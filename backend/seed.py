"""
Optional script to seed sample tasks for testing.
Run: python seed.py
"""
import sqlite3
import os
from datetime import date, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "task_slayer.db")


def seed():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row

    # Check if tasks already exist
    count = db.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
    if count > 0:
        print(f"Database already has {count} tasks. Skipping seed.")
        db.close()
        return

    today = date.today().isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    next_week = (date.today() + timedelta(days=7)).isoformat()

    sample_tasks = [
        (1, "Refactor the Dashboard Header", "Clean up the layout, improve spacing, and make the header responsive.", "Hard", next_week, 45, "goblin", "Mapped the spacing issues and isolated the responsive breakpoints."),
        (1, "Write API Integration Tests", "Prepare stable request mocks and cover the main authentication and task retrieval flows.", "Medium", tomorrow, 60, "flying-eye", "Finished success-path tests and documented two missing edge cases."),
        (1, "Prepare Demo Presentation", "Build a polished walkthrough for the software engineering project demo.", "Easy", today, 20, "skeleton", "Outlined the storyline and gathered the first product screenshots."),
    ]

    for task in sample_tasks:
        cursor = db.execute(
            """INSERT INTO tasks (user_id, name, description, difficulty, deadline, progress, monster_id, latest_note)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            task,
        )
        task_id = cursor.lastrowid
        db.execute(
            "INSERT INTO task_updates (task_id, user_id, date, percent, note) VALUES (?, 1, ?, ?, ?)",
            (task_id, today, task[5], task[7]),
        )

    db.commit()
    print(f"Seeded {len(sample_tasks)} sample tasks.")
    db.close()


if __name__ == "__main__":
    seed()
