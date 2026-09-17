// db.js
// SQLite storage for AI Capsule.
//
// NOTE ON PERSISTENCE: On Render's free web service tier, the filesystem is
// ephemeral — this file (capsules.sqlite) is wiped on every restart or
// redeploy. That's acceptable for this assignment (SQLite is the minimum
// required storage) but must be disclosed in the README as a known
// limitation. For persistent storage, swap this module for a Postgres
// connection (e.g. via `pg`) without changing the routes' query shape much.

const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "capsules.sqlite");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS capsules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_name TEXT NOT NULL,
    prompt_title TEXT NOT NULL,
    prompt_version TEXT,
    prompt_text TEXT NOT NULL,
    response_summary TEXT,
    category TEXT,
    usefulness TEXT,
    reviewed INTEGER DEFAULT 0,
    improved INTEGER DEFAULT 0,
    screenshot_url TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
