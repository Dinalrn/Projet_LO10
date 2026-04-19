-- ============================================================
--  WannaGo – PostgreSQL schema
--  Runs once on first container start (postgres-init-script.sql)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ── 1. Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    username      TEXT        UNIQUE NOT NULL,
    email         TEXT        UNIQUE NOT NULL,
    password_hash TEXT        NOT NULL,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 2. Saved events ──────────────────────────────────────────
-- Stores a snapshot of any event a user bookmarks.
-- external_event_id is the id coming from the source API (Ticketmaster, etc.)
CREATE TABLE IF NOT EXISTS saved_events (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    external_event_id TEXT        NOT NULL,
    source            TEXT        NOT NULL,
    event_data        JSONB       NOT NULL,    -- full event snapshot
    saved_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_events_user ON saved_events(user_id);

-- ── 3. Event registrations ───────────────────────────────────
-- A user can RSVP / register for an event ("I'm going").
-- Separate from saved_events: "interested" vs "going".
-- visit_date / visit_time: when the user plans to attend.
--   If the event has a fixed date the frontend pre-fills these; otherwise the user picks them.
CREATE TABLE IF NOT EXISTS event_registrations (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    external_event_id TEXT        NOT NULL,
    source            TEXT        NOT NULL,
    event_data        JSONB       NOT NULL,    -- full event snapshot at registration time
    visit_date        DATE        NOT NULL,    -- day the user plans to attend
    visit_time        TIME,                   -- optional time slot the user chose
    registered_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);

-- ── 4. Friendships ───────────────────────────────────────────
-- Directed friendship request: requester → addressee.
-- status: 'pending' | 'accepted' | 'blocked'
-- Accepted friendship means both directions are considered friends.
CREATE TABLE IF NOT EXISTS friendships (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status        TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (requester_id, addressee_id),
    CHECK (requester_id <> addressee_id)
);

CREATE TRIGGER friendships_set_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index to quickly find all friendships for a given user (either side)
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
