from __future__ import annotations

import os

import psycopg2

from app.config import settings
from app.public_workspace import MONITORS, SeedMonitor
from app.public_workspace import upsert_monitor as _upsert_monitor
from app.worker.tasks import _run_check, _write_check_results


def get_seed_user_id(conn) -> int:
    requested_email = os.getenv("SEED_USER_EMAIL")
    with conn.cursor() as cur:
        if requested_email:
            cur.execute("SELECT id FROM users WHERE email = %s", (requested_email,))
        else:
            cur.execute("SELECT id FROM users ORDER BY created_at DESC LIMIT 1")
        row = cur.fetchone()

    if row is None:
        raise RuntimeError("No user exists. Sign up once before seeding monitors.")
    return int(row[0])


def upsert_monitor(conn, user_id: int, monitor: SeedMonitor) -> int:
    with conn.cursor() as cur:
        url_id = _upsert_monitor(cur, user_id, monitor)
    conn.commit()
    return url_id


def seed() -> None:
    conn = psycopg2.connect(settings.database_url)
    try:
        user_id = get_seed_user_id(conn)
        print(f"Seeding {len(MONITORS)} monitors for user_id={user_id}")

        for monitor in MONITORS:
            url_id = upsert_monitor(conn, user_id, monitor)
            primary_results = [
                _run_check(url_id, monitor.web_address, "HTTP", None),
                _run_check(url_id, monitor.web_address, "SSL_EXPIRY", None),
                _run_check(url_id, monitor.web_address, "TTFB", None),
            ]
            _write_check_results(primary_results)

            computed_results = [
                _run_check(url_id, monitor.web_address, "DOWNTIME_DURATION", None),
                _run_check(url_id, monitor.web_address, "ERROR_RATE", None),
            ]
            _write_check_results(computed_results)
            print(f"Seeded {monitor.name} ({monitor.web_address})")
    finally:
        conn.close()


if __name__ == "__main__":
    seed()
