-- ============================================================
-- schema.sql
-- Manual DDL for Smart Door Access Control System
-- Use this for manual PostgreSQL setup (production).
-- For development with Alembic, use: alembic upgrade head
-- ============================================================

-- Enable UUID extension (PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    username         VARCHAR(64)  NOT NULL UNIQUE,
    email            VARCHAR(128) NOT NULL UNIQUE,
    hashed_password  VARCHAR(256) NOT NULL,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    is_superuser     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ  DEFAULT NOW(),
    last_login       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_users_username ON users (username);
CREATE INDEX IF NOT EXISTS ix_users_email    ON users (email);

-- ─── residents ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS residents (
    id                     SERIAL PRIMARY KEY,
    name                   VARCHAR(128) NOT NULL,
    email                  VARCHAR(128),
    phone                  VARCHAR(32),
    face_image_url         TEXT,
    face_image_public_id   VARCHAR(256),
    face_encoding          TEXT,          -- JSON array of 128 floats
    is_active              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMPTZ  DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_residents_name ON residents (name);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_residents_updated_at ON residents;
CREATE TRIGGER set_residents_updated_at
    BEFORE UPDATE ON residents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── access_logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_logs (
    id           SERIAL PRIMARY KEY,
    resident_id  INT REFERENCES residents(id) ON DELETE SET NULL,
    timestamp    TIMESTAMPTZ DEFAULT NOW(),
    method       VARCHAR(32) DEFAULT 'face',   -- face | pin | rfid | manual | remote
    status       VARCHAR(32) DEFAULT 'unknown', -- granted | denied | unknown
    image_url    TEXT,
    notes        TEXT
);

CREATE INDEX IF NOT EXISTS ix_access_logs_timestamp   ON access_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS ix_access_logs_status      ON access_logs (status);
CREATE INDEX IF NOT EXISTS ix_access_logs_resident_id ON access_logs (resident_id);

-- ─── system_events ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_events (
    id           SERIAL PRIMARY KEY,
    type         VARCHAR(64) NOT NULL,   -- motion | face_recognized | alarm_triggered | ...
    payload_json TEXT,                   -- JSON blob with event details
    image_url    TEXT,
    timestamp    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_system_events_type      ON system_events (type);
CREATE INDEX IF NOT EXISTS ix_system_events_timestamp ON system_events (timestamp DESC);
