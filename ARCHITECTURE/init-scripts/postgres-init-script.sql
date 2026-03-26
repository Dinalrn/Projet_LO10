-- File: init-scripts/postgres-init-script.sql
-- PostgreSQL database schema exemple


-- 1. App configuration
CREATE TABLE IF NOT EXISTS app_configuration (
     is_on_premise BOOLEAN NOT NULL DEFAULT TRUE,
     home_name TEXT
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
     id SERIAL PRIMARY KEY,
     user_name TEXT NOT NULL,
     created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 3. Notes
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    message_content TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    author INTEGER REFERENCES users(id)
);

-- 4. 
CREATE TABLE IF NOT EXISTS contacts (
     id SERIAL PRIMARY KEY,
     added_by INTEGER REFERENCES users(id),
     contacts_name TEXT NOT NULL,
     contacts_mail TEXT,
     contacts_number TEXT
);


-- EXEMPLE
-- CREATE TABLE IF NOT EXISTS XXX (
--     id SERIAL PRIMARY KEY,
--     url TEXT UNIQUE NOT NULL,
--     domain TEXT NOT NULL,
--     timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
--     s3_path TEXT,
--     content_hash TEXT UNIQUE NOT NULL,
--     http_status INTEGER,
--     content_type TEXT NOT NULL DEFAULT 'text/html',
--     processing_status TEXT NOT NULL DEFAULT 'pending',
--     updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
--     analyzed BOOLEAN NOT NULL DEFAULT FALSE,
--     is_homepage BOOLEAN NOT NULL DEFAULT FALSE,
--     notes TEXT
-- );
