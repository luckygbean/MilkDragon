import sqlite3
import os
from flask import g

DATABASE = os.path.join(os.path.abspath(os.path.dirname(__file__)), "task_slayer.db")


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(app):
    with app.app_context():
        db = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        with open(schema_path, "r") as f:
            db.executescript(f.read())
        db.commit()

        # Seed monsters if table is empty
        count = db.execute("SELECT COUNT(*) FROM monsters").fetchone()[0]
        if count == 0:
            monsters = [
                ("skeleton", "Skeleton", 80, 8, 50, "Easy"),
                ("flying-eye", "Flying Eye", 120, 12, 100, "Medium"),
                ("goblin", "Goblin", 160, 16, 150, "Hard"),
            ]
            db.executemany(
                "INSERT INTO monsters (id, name, max_hp, power, xp_reward, difficulty) VALUES (?, ?, ?, ?, ?, ?)",
                monsters,
            )
            db.commit()

        # Seed achievements if table is empty
        count = db.execute("SELECT COUNT(*) FROM achievements").fetchone()[0]
        if count == 0:
            achievements = [
                ("first_blood", "First Blood", "Complete your first task", "sword"),
                ("slayer_5", "Task Slayer", "Complete 5 tasks", "skull"),
                ("slayer_10", "Monster Hunter", "Complete 10 tasks", "crown"),
                ("streak_3", "On Fire", "Complete tasks 3 days in a row", "flame"),
                ("streak_7", "Unstoppable", "Complete tasks 7 days in a row", "lightning"),
                ("level_5", "Apprentice", "Reach level 5", "star"),
                ("level_10", "Veteran", "Reach level 10", "medal"),
                ("hard_slayer", "Elite Warrior", "Complete a Hard difficulty task", "shield"),
                ("all_monsters", "Bestiary Complete", "Defeat all 3 monster types", "book"),
            ]
            db.executemany(
                "INSERT INTO achievements (id, name, description, icon) VALUES (?, ?, ?, ?)",
                achievements,
            )
            db.commit()

        # Ensure default player_stats row exists
        exists = db.execute("SELECT 1 FROM player_stats WHERE user_id = 1").fetchone()
        if not exists:
            db.execute("INSERT INTO player_stats (user_id) VALUES (1)")
            db.commit()

        db.close()
