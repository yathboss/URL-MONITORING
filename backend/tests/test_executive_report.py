from datetime import datetime, timedelta, timezone

from app.services.metrics import derive_monitor_report_row, summarize_report_rows

NOW = datetime(2026, 7, 8, 12, 0, tzinfo=timezone.utc)
START = NOW - timedelta(days=7)


def _monitor(mid=1, status="UP"):
    return {"id": mid, "name": f"mon-{mid}", "web_address": f"https://m{mid}.test", "status": status}


def test_row_with_pings_and_incident():
    ping_agg = {"total_pings": 100, "up_pings": 90, "avg_response_time_ms": 123.456}
    incidents = [
        # started inside the window, lasted 30 minutes
        {"started_at": START + timedelta(days=1), "resolved_at": START + timedelta(days=1, minutes=30)},
        # started BEFORE the window -> downtime overlap counts, incident_count doesn't
        {"started_at": START - timedelta(hours=2), "resolved_at": START + timedelta(minutes=10)},
    ]
    row = derive_monitor_report_row(_monitor(), ping_agg, incidents, START, NOW)
    assert row["uptime_pct"] == 90.0
    assert row["error_rate_pct"] == 10.0
    assert row["avg_response_time_ms"] == 123.46
    assert row["incident_count"] == 1
    assert row["total_downtime_minutes"] == 40
    assert row["total_pings"] == 100
    assert row["current_status"] == "UP"


def test_row_without_pings_defaults_to_100():
    row = derive_monitor_report_row(_monitor(2, "PENDING"), None, [], START, NOW)
    assert row["uptime_pct"] == 100.0
    assert row["error_rate_pct"] == 0.0
    assert row["avg_response_time_ms"] is None
    assert row["incident_count"] == 0
    assert row["total_downtime_minutes"] == 0
    assert row["total_pings"] == 0


def test_summary_is_ping_weighted():
    rows = [
        derive_monitor_report_row(_monitor(1), {"total_pings": 300, "up_pings": 300, "avg_response_time_ms": 100}, [], START, NOW),
        derive_monitor_report_row(_monitor(2), {"total_pings": 100, "up_pings": 50, "avg_response_time_ms": 300}, [], START, NOW),
    ]
    summary = summarize_report_rows(rows)
    # 350 up / 400 total = 87.5%, NOT the naive mean of 100 and 50 (75%)
    assert summary["overall_uptime_pct"] == 87.5
    assert summary["avg_response_time_ms"] == 200.0
    assert summary["monitor_count"] == 2
    assert summary["worst_performer"]["monitor_id"] == 2
    assert summary["worst_performer"]["uptime_pct"] == 50.0


def test_summary_worst_performer_ignores_pingless_monitors():
    rows = [
        derive_monitor_report_row(_monitor(1), {"total_pings": 10, "up_pings": 9, "avg_response_time_ms": None}, [], START, NOW),
        derive_monitor_report_row(_monitor(2), None, [], START, NOW),  # no data, uptime 100 by convention
    ]
    summary = summarize_report_rows(rows)
    assert summary["worst_performer"]["monitor_id"] == 1


def test_summary_empty_fleet():
    summary = summarize_report_rows([])
    assert summary["overall_uptime_pct"] == 100.0
    assert summary["avg_response_time_ms"] is None
    assert summary["total_incidents"] == 0
    assert summary["total_downtime_minutes"] == 0
    assert summary["monitor_count"] == 0
    assert summary["worst_performer"] is None


def test_open_incident_downtime_runs_to_period_end():
    incidents = [{"started_at": NOW - timedelta(hours=1), "resolved_at": None}]
    row = derive_monitor_report_row(
        _monitor(), {"total_pings": 10, "up_pings": 5, "avg_response_time_ms": 50}, incidents, START, NOW
    )
    assert row["total_downtime_minutes"] == 60
    assert row["incident_count"] == 1
