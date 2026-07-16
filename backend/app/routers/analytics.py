from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from ..auth import get_current_user
from ..database import get_connection
from ..models import AnalyticsOverview, AnalyticsOverviewMonitor, UserRead
from ..services.metrics import (
    assemble_bucket_series,
    derive_monitor_report_row,
    summarize_report_rows,
)

router = APIRouter(tags=["analytics"])

_RANGE_DELTAS = {
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "90d": timedelta(days=90),
}

# Heartbeat density per range: 24 / 28 / 30 / 90 segments.
_BUCKET_MINUTES = {"24h": 60, "7d": 360, "30d": 1440, "90d": 1440}


@router.get("/analytics/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    current_user: Annotated[UserRead, Depends(get_current_user)],
    range: str = Query(default="7d", pattern="^(24h|7d|30d|90d)$"),
) -> AnalyticsOverview:
    """Fleet analytics for the Home tab: executive-report aggregates per monitor
    plus a bucketed uptime/latency time series for heartbeat graphs.

    The aggregate queries mirror routers/reports.py (kept in sync by hand —
    see the cross-reference comment there); numbers intentionally match
    /reports/executive for the same range. No check_type filter, same as the
    executive report.
    """
    now = datetime.now(timezone.utc)
    start_time = now - _RANGE_DELTAS[range]
    bucket_minutes = _BUCKET_MINUTES[range]

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
        buckets_by_url: dict[int, list[dict]] = {}
        if url_ids:
            # ping_history.checked_at is a naive TIMESTAMP (UTC); bind naive cutoffs.
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

            bucket_rows = await conn.fetch(
                """
                SELECT url_id,
                       date_bin($3::interval, checked_at, TIMESTAMP '1970-01-01') AS bucket,
                       COUNT(*) AS total,
                       COUNT(*) FILTER (WHERE is_up) AS up,
                       AVG(response_time_ms) FILTER (WHERE response_time_ms IS NOT NULL)
                           AS avg_ms
                FROM ping_history
                WHERE url_id = ANY($1::int[]) AND checked_at >= $2
                GROUP BY url_id, bucket
                """,
                url_ids,
                ping_cutoff,
                timedelta(minutes=bucket_minutes),
            )
            for row in bucket_rows:
                buckets_by_url.setdefault(row["url_id"], []).append(dict(row))

    monitor_payloads = []
    rows = []
    for monitor in monitors:
        row = derive_monitor_report_row(
            dict(monitor),
            ping_aggs.get(monitor["id"]),
            incidents_by_url.get(monitor["id"], []),
            start_time,
            now,
        )
        rows.append(row)
        monitor_payloads.append(
            AnalyticsOverviewMonitor(
                **row,
                buckets=assemble_bucket_series(
                    buckets_by_url.get(monitor["id"], []),
                    start_time,
                    now,
                    bucket_minutes,
                ),
            )
        )

    return AnalyticsOverview(
        range=range,
        generated_at=now,
        period_start=start_time,
        period_end=now,
        bucket_minutes=bucket_minutes,
        summary=summarize_report_rows(rows),
        monitors=monitor_payloads,
    )
