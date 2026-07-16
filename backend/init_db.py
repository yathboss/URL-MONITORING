import psycopg2
import os
import bcrypt
from urllib.parse import urlparse

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/uptime_monitor")


def migrate_url_uniqueness(cur):
    """Keep URL uniqueness scoped to the owning user account."""
    cur.execute("ALTER TABLE urls DROP CONSTRAINT IF EXISTS urls_web_address_key")
    cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS urls_user_web_address_unique
        ON urls (user_id, web_address)
    """)


def migrate_incidents_columns(cur):
    cur.execute("""
        ALTER TABLE url_incidents
          ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS note TEXT
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_url_incidents_open
        ON url_incidents (url_id) WHERE resolved_at IS NULL
    """)


def migrate_monitor_columns(cur):
    cur.execute("""
        ALTER TABLE urls
          ADD COLUMN IF NOT EXISTS check_type VARCHAR(160) NOT NULL DEFAULT 'HTTP',
          ADD COLUMN IF NOT EXISTS keyword_to_find VARCHAR(255),
          ADD COLUMN IF NOT EXISTS check_interval_seconds INTEGER NOT NULL DEFAULT 30,
          ADD COLUMN IF NOT EXISTS ping_interval_seconds INTEGER NOT NULL DEFAULT 30,
          ADD COLUMN IF NOT EXISTS last_pinged_at TIMESTAMPTZ
    """)
    cur.execute("ALTER TABLE urls ALTER COLUMN check_type TYPE VARCHAR(160)")
    cur.execute("""
        UPDATE urls
        SET
          check_interval_seconds = COALESCE(check_interval_seconds, ping_interval_seconds, 30),
          ping_interval_seconds = COALESCE(ping_interval_seconds, check_interval_seconds, 30)
    """)
    cur.execute("""
        ALTER TABLE ping_history
          ADD COLUMN IF NOT EXISTS check_type VARCHAR(20),
          ADD COLUMN IF NOT EXISTS extra_data JSONB
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS url_incidents (
          id SERIAL PRIMARY KEY,
          url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
          started_at TIMESTAMPTZ NOT NULL,
          resolved_at TIMESTAMPTZ,
          check_type VARCHAR(20) NOT NULL,
          severity VARCHAR(10) NOT NULL
        )
    """)

def migrate_scheduling_columns(cur):
    """Phase 1: next_check_at scheduling model + monitor state columns.

    last_pinged_at stays the canonical 'last checked at'. next_check_at drives
    due-monitor selection; the counters/last_error_reason back false-down
    protection (Phase 2).
    """
    cur.execute("""
        ALTER TABLE urls
          ADD COLUMN IF NOT EXISTS next_check_at         TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS last_status_change_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS consecutive_failures  INTEGER NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS consecutive_successes INTEGER NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS last_error_reason     TEXT
    """)
    cur.execute("UPDATE urls SET next_check_at = NOW() WHERE next_check_at IS NULL")
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_urls_next_check_at ON urls (next_check_at)
    """)
    # Audit column: stamped automatically by a trigger on every UPDATE so all
    # code paths (worker + API) are covered without touching their queries.
    cur.execute("""
        ALTER TABLE urls
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    """)
    cur.execute("""
        CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    cur.execute("DROP TRIGGER IF EXISTS urls_set_updated_at ON urls")
    cur.execute("""
        CREATE TRIGGER urls_set_updated_at
        BEFORE UPDATE ON urls
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)


def migrate_alerts_tables(cur):
    """Create alert channel + delivery log tables for the notifications feature."""
    cur.execute("""
        CREATE TABLE IF NOT EXISTS alert_channels (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          channel_type VARCHAR(20) NOT NULL,
          name VARCHAR(100) NOT NULL,
          destination TEXT NOT NULL,
          headers JSONB NOT NULL DEFAULT '{}',
          http_method VARCHAR(10) NOT NULL DEFAULT 'POST',
          notify_on_down BOOLEAN NOT NULL DEFAULT true,
          notify_on_recovery BOOLEAN NOT NULL DEFAULT true,
          is_enabled BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now()
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS alert_deliveries (
          id SERIAL PRIMARY KEY,
          channel_id INTEGER REFERENCES alert_channels(id) ON DELETE CASCADE,
          url_id INTEGER REFERENCES urls(id) ON DELETE SET NULL,
          incident_id INTEGER,
          event_type VARCHAR(10) NOT NULL,
          status VARCHAR(10) NOT NULL,
          error TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        )
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_alert_deliveries_channel
        ON alert_deliveries (channel_id, created_at DESC)
    """)
    # Custom HTTP headers (key/value) sent with webhook deliveries.
    cur.execute("""
        ALTER TABLE alert_channels
        ADD COLUMN IF NOT EXISTS headers JSONB NOT NULL DEFAULT '{}'
    """)
    # HTTP request method used for webhook deliveries (POST/GET/PUT/PATCH).
    cur.execute("""
        ALTER TABLE alert_channels
        ADD COLUMN IF NOT EXISTS http_method VARCHAR(10) NOT NULL DEFAULT 'POST'
    """)


def migrate_ping_history_index(cur):
    """Composite index for per-monitor time-series queries (detail page,
    executive report, analytics overview heartbeats)."""
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_ping_history_url_checked_at
        ON ping_history (url_id, checked_at DESC)
    """)


def migrate_bug_reports_table(cur):
    """User-submitted bug reports with admin triage workflow."""
    cur.execute("""
        CREATE TABLE IF NOT EXISTS bug_reports (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          title VARCHAR(200) NOT NULL,
          description TEXT NOT NULL,
          severity VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
          area VARCHAR(50),
          status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_bug_reports_status
        ON bug_reports (status, created_at DESC)
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_bug_reports_user
        ON bug_reports (user_id)
    """)
    # Reuses the set_updated_at() trigger function created for urls.
    cur.execute("DROP TRIGGER IF EXISTS bug_reports_set_updated_at ON bug_reports")
    cur.execute("""
        CREATE TRIGGER bug_reports_set_updated_at
        BEFORE UPDATE ON bug_reports
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)


ADMIN_EMAILS = [
    "pathania.yuvraj@thinksys.com",
    "singh.yatharth@thinksys.com",
]


def migrate_role_column(cur):
    """Add role column to users table. Existing users default to 'admin'."""
    cur.execute("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role VARCHAR(10) NOT NULL DEFAULT 'viewer'
    """)
    # Ensure the two fixed admin accounts always have admin role
    for email in ADMIN_EMAILS:
        cur.execute(
            "UPDATE users SET role = 'admin' WHERE email = %s",
            (email,)
        )


def seed_admin_accounts(cur):
    """Upsert the two fixed admin accounts with password 'password123'."""
    hashed = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode("utf-8")
    admin_accounts = [
        ("Yuvraj Pathania", "pathania.yuvraj@thinksys.com"),
        ("Yatharth Singh", "singh.yatharth@thinksys.com"),
    ]
    for full_name, email in admin_accounts:
        cur.execute(
            """
            INSERT INTO users (full_name, email, hashed_password, role)
            VALUES (%s, %s, %s, 'admin')
            ON CONFLICT (email) DO UPDATE
            SET hashed_password = EXCLUDED.hashed_password,
                role = 'admin'
            """,
            (full_name, email, hashed),
        )
    print(f"Seeded {len(admin_accounts)} admin accounts.")


def init_db():
    try:
        print("Connecting to PostgreSQL...")
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Creating 'users' table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(150) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        print("Creating 'urls' table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS urls (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                web_address VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                status VARCHAR(20) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                check_type VARCHAR(160) NOT NULL DEFAULT 'HTTP',
                keyword_to_find VARCHAR(255),
                check_interval_seconds INTEGER NOT NULL DEFAULT 30,
                ping_interval_seconds INTEGER NOT NULL DEFAULT 30,
                last_pinged_at TIMESTAMPTZ,
                is_public BOOLEAN DEFAULT false
            )
        """)
        
        print("Creating 'ping_history' table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ping_history (
                id SERIAL PRIMARY KEY,
                url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
                checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                response_time_ms INTEGER,
                status_code INTEGER,
                is_up BOOLEAN NOT NULL
            )
        """)
        
        print("Creating 'maintenance_windows' table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS maintenance_windows (
                id SERIAL PRIMARY KEY,
                url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                starts_at TIMESTAMPTZ NOT NULL,
                ends_at TIMESTAMPTZ NOT NULL
            )
        """)

        print("Ensuring URL uniqueness is scoped per user...")
        migrate_monitor_columns(cur)
        migrate_url_uniqueness(cur)

        print("Adding role column to users...")
        migrate_role_column(cur)

        print("Migrating incidents columns...")
        migrate_incidents_columns(cur)

        print("Adding scheduling columns...")
        migrate_scheduling_columns(cur)

        print("Creating alert tables...")
        migrate_alerts_tables(cur)

        print("Creating bug reports table...")
        migrate_bug_reports_table(cur)

        print("Indexing ping history...")
        migrate_ping_history_index(cur)

        print("Seeding admin accounts...")
        seed_admin_accounts(cur)
        
        print("Successfully initialized all database tables!")
        cur.close()
        conn.close()
    except psycopg2.OperationalError as e:
        if 'database "uptime_monitor" does not exist' in str(e):
            print("Database 'uptime_monitor' does not exist! Creating it automatically...")
            # Connect to the default 'postgres' database to issue the CREATE DATABASE command
            parsed = urlparse(DATABASE_URL)
            default_database_url = DATABASE_URL.replace(f"/{parsed.path.lstrip('/')}", "/postgres", 1)
            conn_default = psycopg2.connect(default_database_url)
            conn_default.autocommit = True
            cur_default = conn_default.cursor()
            cur_default.execute("CREATE DATABASE uptime_monitor")
            cur_default.close()
            conn_default.close()
            
            # Now that it's created, try again!
            print("Database created. Retrying table creation...")
            init_db()
        else:
            print(f"Failed to connect: {e}")

if __name__ == "__main__":
    init_db()
