from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from ..auth import get_current_user
from ..database import get_connection
from ..models import ExecutiveReport, UserRead
from ..services.metrics import derive_monitor_report_row, summarize_report_rows

router = APIRouter(tags=["reports"])

_RANGE_DELTAS = {
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "90d": timedelta(days=90),
}


@router.get("/reports/executive", response_model=ExecutiveReport)
async def get_executive_report(
    current_user: Annotated[UserRead, Depends(get_current_user)],
    range: str = Query(default="7d", pattern="^(24h|7d|30d|90d)$"),
) -> ExecutiveReport:
    """Fleet-wide uptime report for the caller's monitors (all monitors for admins).

    Aggregation happens in SQL (one GROUP BY over ping_history) so the cost stays
    flat regardless of fleet size; per-row semantics match /urls/{id}/metrics.
    NOTE: routers/analytics.py duplicates these queries for its overview — keep
    the two in sync when changing semantics here.
    """
    now = datetime.now(timezone.utc)
    start_time = now - _RANGE_DELTAS[range]

    async with get_connection() as conn:
        if current_user.role == "admin":
            monitors = await conn.fetch(
                "SELECT id, name, web_address, status FROM urls ORDER BY name"
            )
        else:
            monitors = await conn.fetch(
                "SELECT id, name, web_address, status FROM urls WHERE user_id = $1 ORDER BY name",
                current_user.id,
            )

        url_ids = [m["id"] for m in monitors]
        ping_aggs: dict[int, dict] = {}
        incidents_by_url: dict[int, list[dict]] = {}
        if url_ids:
            # ping_history.checked_at is a naive TIMESTAMP (UTC); bind a naive cutoff.
            ping_cutoff = start_time.replace(tzinfo=None)
            agg_rows = await conn.fetch(
                """
                SELECT url_id,
                       COUNT(*) AS total_pings,
                       COUNT(*) FILTER (WHERE is_up) AS up_pings,
                       AVG(response_time_ms) FILTER (WHERE response_time_ms IS NOT NULL)
                           AS avg_response_time_ms
                FROM ping_history
                WHERE url_id = ANY($1::int[]) AND checked_at >= $2
                GROUP BY url_id
                """,
                url_ids,
                ping_cutoff,
            )
            ping_aggs = {row["url_id"]: dict(row) for row in agg_rows}

            incident_rows = await conn.fetch(
                """
                SELECT url_id, started_at, resolved_at
                FROM url_incidents
                WHERE url_id = ANY($1::int[])
                  AND started_at <= $2
                  AND (resolved_at IS NULL OR resolved_at >= $3)
                """,
                url_ids,
                now,
                start_time,
            )
            for row in incident_rows:
                incidents_by_url.setdefault(row["url_id"], []).append(dict(row))

    rows = [
        derive_monitor_report_row(
            dict(monitor),
            ping_aggs.get(monitor["id"]),
            incidents_by_url.get(monitor["id"], []),
            start_time,
            now,
        )
        for monitor in monitors
    ]

    return ExecutiveReport(
        range=range,
        generated_at=now,
        period_start=start_time,
        period_end=now,
        summary=summarize_report_rows(rows),
        monitors=rows,
    )
