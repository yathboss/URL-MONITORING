from datetime import datetime, timedelta, timezone
from typing import Any

def calculate_uptime_pct(pings: list[dict[str, Any]]) -> float:
    if not pings:
        return 100.0
    up_count = sum(1 for p in pings if p.get("is_up"))
    return round((up_count / len(pings)) * 100, 4)

def calculate_error_rate_pct(uptime_pct: float) -> float:
    return round(100.0 - uptime_pct, 4)

def calculate_avg_response_time_ms(pings: list[dict[str, Any]]) -> float | None:
    valid_times = [p["response_time_ms"] for p in pings if p.get("response_time_ms") is not None]
    if not valid_times:
        return None
    return round(sum(valid_times) / len(valid_times), 2)

def assemble_bucket_series(
    rows: list[dict[str, Any]],
    period_start: datetime,
    period_end: datetime,
    bucket_minutes: int,
) -> list[dict[str, Any]]:
    """Densify sparse SQL bucket rows into a full, ordered timeline.

    `rows` come from a date_bin(...) GROUP BY (keys: bucket, total, up, avg_ms)
    and only exist where pings happened. The frontend heartbeat renders one
    segment per bucket, so gaps must appear as explicit empty buckets. Bucket
    timestamps are naive UTC in the DB; output `t` is timezone-aware UTC.
    """
    if period_start.tzinfo is not None:
        period_start = period_start.astimezone(timezone.utc).replace(tzinfo=None)
    if period_end.tzinfo is not None:
        period_end = period_end.astimezone(timezone.utc).replace(tzinfo=None)

    step = timedelta(minutes=bucket_minutes)
    epoch = datetime(1970, 1, 1)
    # First epoch-aligned bucket that CONTAINS period_start (matches date_bin).
    offset = (period_start - epoch) // step
    cursor = epoch + offset * step

    by_bucket: dict[datetime, dict[str, Any]] = {}
    for row in rows:
        bucket_ts = row["bucket"]
        if bucket_ts.tzinfo is not None:
            bucket_ts = bucket_ts.astimezone(timezone.utc).replace(tzinfo=None)
        by_bucket[bucket_ts] = row

    series: list[dict[str, Any]] = []
    while cursor < period_end:
        row = by_bucket.get(cursor)
        avg_ms = row.get("avg_ms") if row else None
        series.append(
            {
                "t": cursor.replace(tzinfo=timezone.utc),
                "total": int(row["total"]) if row else 0,
                "up": int(row["up"]) if row else 0,
                "avg_ms": None if avg_ms is None else round(float(avg_ms), 2),
            }
        )
        cursor += step
    return series


def derive_monitor_report_row(
    monitor: dict[str, Any],
    ping_agg: dict[str, Any] | None,
    incidents: list[dict[str, Any]],
    range_start: datetime,
    range_end: datetime,
) -> dict[str, Any]:
    """Build one executive-report row from SQL aggregates + the monitor's incidents.

    Semantics intentionally match /urls/{id}/metrics: 100% uptime when there are
    no pings in the window; incident_count only counts incidents that STARTED
    inside the window, while downtime minutes include overlap from earlier ones.
    """
    total_pings = int(ping_agg["total_pings"]) if ping_agg else 0
    up_pings = int(ping_agg["up_pings"]) if ping_agg else 0
    avg_ms = ping_agg.get("avg_response_time_ms") if ping_agg else None

    if total_pings > 0:
        uptime_pct = round((up_pings / total_pings) * 100, 4)
    else:
        uptime_pct = 100.0

    if range_start.tzinfo is None:
        range_start = range_start.replace(tzinfo=timezone.utc)

    incident_count = 0
    for inc in incidents:
        started = inc["started_at"]
        if started.tzinfo is None:
            started = started.replace(tzinfo=timezone.utc)
        if started >= range_start:
            incident_count += 1

    return {
        "monitor_id": monitor["id"],
        "name": monitor["name"],
        "web_address": monitor["web_address"],
        "uptime_pct": uptime_pct,
        "error_rate_pct": calculate_error_rate_pct(uptime_pct),
        "avg_response_time_ms": None if avg_ms is None else round(float(avg_ms), 2),
        "incident_count": incident_count,
        "total_downtime_minutes": calculate_total_downtime_minutes(incidents, range_start, range_end),
        "current_status": monitor["status"],
        "total_pings": total_pings,
    }


def summarize_report_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """Fleet-level rollups for the executive report.

    Overall uptime is ping-weighted (a monitor with 10x the checks counts 10x),
    so it equals up_checks / total_checks across the whole fleet. The worst
    performer only considers monitors that actually have pings.
    """
    monitor_count = len(rows)
    total_pings = sum(r["total_pings"] for r in rows)
    if total_pings > 0:
        weighted_up = sum(r["uptime_pct"] * r["total_pings"] for r in rows)
        overall_uptime_pct = round(weighted_up / total_pings, 4)
    else:
        overall_uptime_pct = 100.0

    latencies = [r["avg_response_time_ms"] for r in rows if r["avg_response_time_ms"] is not None]
    avg_response_time_ms = round(sum(latencies) / len(latencies), 2) if latencies else None

    worst = None
    candidates = [r for r in rows if r["total_pings"] > 0]
    if candidates:
        worst_row = min(candidates, key=lambda r: (r["uptime_pct"], -r["total_downtime_minutes"]))
        worst = {
            "monitor_id": worst_row["monitor_id"],
            "name": worst_row["name"],
            "uptime_pct": worst_row["uptime_pct"],
            "total_downtime_minutes": worst_row["total_downtime_minutes"],
        }

    return {
        "overall_uptime_pct": overall_uptime_pct,
        "avg_response_time_ms": avg_response_time_ms,
        "total_incidents": sum(r["incident_count"] for r in rows),
        "total_downtime_minutes": sum(r["total_downtime_minutes"] for r in rows),
        "monitor_count": monitor_count,
        "worst_performer": worst,
    }


def calculate_total_downtime_minutes(incidents: list[dict[str, Any]], range_start: datetime, range_end: datetime) -> int:
    total_minutes = 0
    if range_start.tzinfo is None:
        range_start = range_start.replace(tzinfo=timezone.utc)
    if range_end.tzinfo is None:
        range_end = range_end.replace(tzinfo=timezone.utc)

    for inc in incidents:
        start = inc["started_at"]
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        
        end = inc.get("resolved_at")
        if end is None:
            end = range_end
        elif end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
            
        overlap_start = max(start, range_start)
        overlap_end = min(end, range_end)
        
        if overlap_end > overlap_start:
            total_minutes += int((overlap_end - overlap_start).total_seconds() // 60)
            
    return total_minutes
