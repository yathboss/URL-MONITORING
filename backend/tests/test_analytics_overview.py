from datetime import datetime, timedelta, timezone

from app.services.metrics import assemble_bucket_series

# Aligned to whole hours so epoch-aligned buckets are predictable.
END = datetime(2026, 7, 14, 12, 0, tzinfo=timezone.utc)


def _naive(dt: datetime) -> datetime:
    return dt.astimezone(timezone.utc).replace(tzinfo=None)


def test_24h_hourly_has_24_buckets_ordered():
    start = END - timedelta(hours=24)
    series = assemble_bucket_series([], start, END, 60)
    assert len(series) == 24
    assert all(b["total"] == 0 and b["up"] == 0 and b["avg_ms"] is None for b in series)
    times = [b["t"] for b in series]
    assert times == sorted(times)
    assert times[0] == start  # start is hour-aligned, so first bucket == start
    assert all(b["t"].tzinfo is not None for b in series)


def test_gaps_are_densified_and_rows_merged():
    start = END - timedelta(hours=6)
    rows = [
        {"bucket": _naive(start), "total": 10, "up": 9, "avg_ms": 123.456},
        {"bucket": _naive(start + timedelta(hours=3)), "total": 5, "up": 0, "avg_ms": None},
    ]
    series = assemble_bucket_series(rows, start, END, 60)
    assert len(series) == 6
    assert series[0]["total"] == 10 and series[0]["up"] == 9 and series[0]["avg_ms"] == 123.46
    assert series[1]["total"] == 0  # gap densified
    assert series[3]["total"] == 5 and series[3]["up"] == 0 and series[3]["avg_ms"] is None


def test_unaligned_start_uses_containing_bucket():
    # Start 12:30 with 60-min buckets -> first bucket is 12:00 (contains start),
    # matching Postgres date_bin epoch alignment.
    start = datetime(2026, 7, 14, 12, 30, tzinfo=timezone.utc)
    end = start + timedelta(hours=2)
    series = assemble_bucket_series([], start, end, 60)
    assert series[0]["t"] == datetime(2026, 7, 14, 12, 0, tzinfo=timezone.utc)
    assert len(series) == 3  # 12:00, 13:00, 14:00 (14:00 bucket contains 14:29 end)


def test_daily_buckets_for_90d():
    start = END - timedelta(days=90)
    series = assemble_bucket_series([], start, END, 1440)
    assert 90 <= len(series) <= 91  # partial edge bucket allowed


def test_aware_bucket_rows_are_normalized():
    start = END - timedelta(hours=2)
    rows = [{"bucket": start, "total": 3, "up": 3, "avg_ms": 50}]  # aware input
    series = assemble_bucket_series(rows, start, END, 60)
    assert series[0]["total"] == 3 and series[0]["avg_ms"] == 50.0
