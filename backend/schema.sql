CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

CREATE TABLE IF NOT EXISTS monsters (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    max_hp      INTEGER NOT NULL,
    power       INTEGER NOT NULL,
    xp_reward   INTEGER NOT NULL,
    difficulty  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    name         TEXT NOT NULL,
    description  TEXT NOT NULL,
    difficulty   TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    deadline     TEXT NOT NULL,
    progress     INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    monster_id   TEXT NOT NULL,
    latest_note  TEXT NOT NULL DEFAULT 'Quest created. Awaiting the first daily progress update.',
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (monster_id) REFERENCES monsters(id)
);

CREATE TABLE IF NOT EXISTS task_updates (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id    INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    date       TEXT NOT NULL,
    percent    INTEGER NOT NULL CHECK (percent >= 0 AND percent <= 100),
    note       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS player_stats (
    user_id                INTEGER NOT NULL,
    hero_level             INTEGER NOT NULL DEFAULT 1,
    current_xp             INTEGER NOT NULL DEFAULT 0,
    xp_to_level            INTEGER NOT NULL DEFAULT 100,
    hero_hp                INTEGER NOT NULL DEFAULT 60,
    hero_max_hp            INTEGER NOT NULL DEFAULT 60,
    total_tasks_completed  INTEGER NOT NULL DEFAULT 0,
    total_damage_dealt     INTEGER NOT NULL DEFAULT 0,
    current_streak         INTEGER NOT NULL DEFAULT 0,
    best_streak            INTEGER NOT NULL DEFAULT 0,
    last_completion_date   TEXT
);

CREATE TABLE IF NOT EXISTS achievements (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    icon        TEXT NOT NULL DEFAULT 'trophy'
);

CREATE TABLE IF NOT EXISTS player_achievements (
    user_id        INTEGER NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at    TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);
