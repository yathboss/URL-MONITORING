"""Public admin workspace: the shared admin login shown on the sign-in page and
the monitors it owns.

Seeding is idempotent (upserts), so it runs on every start-up and from a daily
Celery task to restore anything a visitor deletes or edits. This module only
needs psycopg2 + bcrypt so init_db.py can import it without app settings.
"""
from __future__ import annotations

import os
from dataclasses import dataclass

import bcrypt

ADMIN_LOGIN_EMAIL = os.getenv("ADMIN_LOGIN_EMAIL", "admin@uptimemonitor.dev")
ADMIN_LOGIN_PASSWORD = os.getenv("ADMIN_LOGIN_PASSWORD", "Admin@2026")
ADMIN_LOGIN_NAME = "Admin"

CHECK_TYPE = "HTTP,SSL_EXPIRY,TTFB,DOWNTIME_DURATION,ERROR_RATE"


@dataclass(frozen=True)
class SeedMonitor:
    name: str
    web_address: str
    interval_seconds: int = 300


MONITORS = [
    SeedMonitor("Google Search", "https://www.google.com/"),
    SeedMonitor("GitHub", "https://github.com/"),
    SeedMonitor("Microsoft", "https://www.microsoft.com/"),
    SeedMonitor("Amazon Web Services", "https://aws.amazon.com/"),
    SeedMonitor("Cloudflare", "https://www.cloudflare.com/"),
    SeedMonitor("Stripe", "https://stripe.com/"),
    SeedMonitor("Shopify", "https://www.shopify.com/"),
    SeedMonitor("Slack", "https://slack.com/"),
    SeedMonitor("Atlassian", "https://www.atlassian.com/"),
    SeedMonitor("Notion", "https://www.notion.so/"),
    SeedMonitor("Figma", "https://www.figma.com/"),
    SeedMonitor("Linear", "https://linear.app/"),
    SeedMonitor("Vercel", "https://vercel.com/"),
    SeedMonitor("Netlify", "https://www.netlify.com/"),
    SeedMonitor("Supabase", "https://supabase.com/"),
    SeedMonitor("OpenAI Status", "https://status.openai.com/"),
    SeedMonitor("Docker", "https://www.docker.com/"),
    SeedMonitor("Postman", "https://www.postman.com/"),
    SeedMonitor("Twilio", "https://www.twilio.com/"),
    SeedMonitor("Datadog", "https://www.datadoghq.com/"),
]


def upsert_monitor(cur, user_id: int, monitor: SeedMonitor) -> int:
    cur.execute(
        """
        INSERT INTO urls
            (
                user_id, web_address, name, status, created_at, check_type,
                check_interval_seconds, ping_interval_seconds
            )
        VALUES (%s, %s, %s, 'PENDING', NOW(), %s, %s, %s)
        ON CONFLICT (user_id, web_address)
        DO UPDATE SET
            name = EXCLUDED.name,
            check_type = EXCLUDED.check_type,
            check_interval_seconds = EXCLUDED.check_interval_seconds,
            ping_interval_seconds = EXCLUDED.ping_interval_seconds
        RETURNING id
        """,
        (
            user_id,
            monitor.web_address,
            monitor.name,
            CHECK_TYPE,
            monitor.interval_seconds,
            monitor.interval_seconds,
        ),
    )
    return int(cur.fetchone()[0])


def upsert_admin_login(cur) -> int:
    """Create the shared admin login, or reset its password/role/name."""
    hashed = bcrypt.hashpw(ADMIN_LOGIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cur.execute(
        """
        INSERT INTO users (full_name, email, hashed_password, role)
        VALUES (%s, %s, %s, 'admin')
        ON CONFLICT (email) DO UPDATE
        SET full_name = EXCLUDED.full_name,
            hashed_password = EXCLUDED.hashed_password,
            role = 'admin'
        RETURNING id
        """,
        (ADMIN_LOGIN_NAME, ADMIN_LOGIN_EMAIL, hashed),
    )
    return int(cur.fetchone()[0])


def seed_public_workspace(cur) -> int:
    """Upsert the admin login and its monitors. Returns the monitor count."""
    user_id = upsert_admin_login(cur)
    for monitor in MONITORS:
        upsert_monitor(cur, user_id, monitor)
    return len(MONITORS)
