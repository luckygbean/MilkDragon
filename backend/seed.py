"""
Optional script to seed sample tasks for testing.
Run: python seed.py
"""
import sqlite3
import os
from datetime import date, timedelta
# Use Flask's password hashing
try:
    from werkzeug.security import generate_password_hash
except ImportError:
    import hashlib
    def generate_password_hash(password):
        return hashlib.sha256(password.encode()).hexdigest()

DB_PATH = os.path.join(os.path.dirname(__file__), "task_slayer.db")


def seed():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row

    # Clear existing data
    db.execute("DELETE FROM task_updates")
    db.execute("DELETE FROM player_achievements")
    db.execute("DELETE FROM player_stats")
    db.execute("DELETE FROM tasks")
    db.execute("DELETE FROM users")
    db.execute("DELETE FROM monsters")
    db.execute("DELETE FROM achievements")
    db.execute("DELETE FROM sqlite_sequence")
    db.commit()
    print("Cleared existing data.")

    # Seed monsters
    monsters = [
        ("skeleton", "Skeleton", 100, 8, 30, "Easy"),
        ("flying-eye", "Flying Eye", 120, 10, 40, "Medium"),
        ("goblin", "Goblin", 150, 12, 50, "Hard"),
    ]
    db.executemany(
        """INSERT INTO monsters (id, name, max_hp, power, xp_reward, difficulty)
           VALUES (?, ?, ?, ?, ?, ?)""",
        monsters,
    )
    print("Seeded monsters.")

    # Seed achievements
    achievements = [
        ("first-quest", "First Quest", "Complete your first quest", "trophy"),
        ("streak-3", "3-Day Streak", "Complete 3 consecutive days of progress", "flame"),
        ("streak-7", "Week Streak", "Complete 7 consecutive days of progress", "star"),
        ("10-quests", "Quest Master", "Complete 10 quests", "crown"),
        ("hard-mode", "Hard Mode", "Complete a Hard difficulty quest", "skull"),
    ]
    db.executemany(
        """INSERT INTO achievements (id, name, description, icon)
           VALUES (?, ?, ?, ?)""",
        achievements,
    )
    print("Seeded achievements.")

    # Seed users
    users = [
        ("hero1", generate_password_hash("password1"), 0),
        ("hero2", generate_password_hash("password2"), 0),
        ("admin", generate_password_hash("adminpass"), 1),
    ]
    db.executemany(
        """INSERT INTO users (username, password_hash, is_admin)
           VALUES (?, ?, ?)""",
        users,
    )
    print("Seeded users.")

    # Seed player stats
    player_stats = [
        (1, 5, 150, 200, 70, 70, 3, 450, 5, 7, "2026-01-10", 120),
        (2, 8, 280, 350, 85, 85, 8, 920, 3, 5, "2026-01-12", 250),
        (3, 10, 450, 500, 100, 100, 15, 1500, 10, 12, "2026-01-13", 500),
    ]
    db.executemany(
        """INSERT INTO player_stats (user_id, hero_level, current_xp, xp_to_level, hero_hp, hero_max_hp,
                                     total_tasks_completed, total_damage_dealt, current_streak, best_streak,
                                     last_completion_date, coins)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        player_stats,
    )
    print("Seeded player stats.")

    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    two_days_ago = (date.today() - timedelta(days=2)).isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    next_week = (date.today() + timedelta(days=7)).isoformat()
    in_two_weeks = (date.today() + timedelta(days=14)).isoformat()

    # Seed tasks for user 1
    tasks_user1 = [
        (1, "Refactor the Dashboard Header", "Clean up the layout, improve spacing, and make the header responsive for tablet and desktop breakpoints.", "Hard", next_week, 45, "goblin", "Mapped the spacing issues and identified key improvement areas."),
        (1, "Write API Integration Tests", "Prepare stable request mocks and cover the main authentication and task retrieval flows.", "Medium", tomorrow, 60, "flying-eye", "Finished success-path tests and documented edge cases."),
        (1, "Prepare Demo Presentation", "Build a polished walkthrough for the software engineering project demo.", "Easy", today, 20, "skeleton", "Outlined the storyline and gathered product screenshots."),
        (1, "Fix Login Page Styling", "Update the login modal to match the new design system.", "Easy", today, 80, "skeleton", "Completed 80% of the styling work."),
        (1, "Database Optimization", "Optimize slow queries and add proper indexes.", "Medium", in_two_weeks, 10, "flying-eye", "Identified the main bottlenecks."),
    ]

    for task in tasks_user1:
        cursor = db.execute(
            """INSERT INTO tasks (user_id, name, description, difficulty, deadline, progress, monster_id, latest_note)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            task,
        )
        task_id = cursor.lastrowid
        
        # Add progress updates
        if task[5] >= 20:
            db.execute(
                "INSERT INTO task_updates (task_id, user_id, date, percent, note) VALUES (?, 1, ?, ?, ?)",
                (task_id, two_days_ago, min(task[5], 30), "Started working on this quest."),
            )
        if task[5] >= 40:
            db.execute(
                "INSERT INTO task_updates (task_id, user_id, date, percent, note) VALUES (?, 1, ?, ?, ?)",
                (task_id, yesterday, min(task[5], 50), "Made good progress today."),
            )
        if task[5] > 0:
            db.execute(
                "INSERT INTO task_updates (task_id, user_id, date, percent, note) VALUES (?, 1, ?, ?, ?)",
                (task_id, today, task[5], task[7]),
            )

    # Seed completed tasks for user 1
    completed_tasks_user1 = [
        (1, "Complete Onboarding Flow", "Build the user onboarding experience with welcome screens.", "Medium", "2026-01-10", 100, "flying-eye", "Quest completed successfully!", 1, "2026-01-10"),
        (1, "Setup CI/CD Pipeline", "Configure GitHub Actions for automated testing and deployment.", "Hard", "2026-01-08", 100, "goblin", "Pipeline is now running automatically.", 1, "2026-01-08"),
        (1, "Update Documentation", "Write comprehensive API documentation.", "Easy", "2026-01-05", 100, "skeleton", "Docs are complete and published.", 1, "2026-01-05"),
    ]
    db.executemany(
        """INSERT INTO tasks (user_id, name, description, difficulty, deadline, progress, monster_id, latest_note, is_completed, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        completed_tasks_user1,
    )

    # Seed tasks for user 2
    tasks_user2 = [
        (2, "Design System Components", "Create reusable UI components for the design system.", "Hard", next_week, 35, "goblin", "Created 5 core components so far."),
        (2, "Mobile Responsive Layout", "Ensure all pages work correctly on mobile devices.", "Medium", tomorrow, 70, "flying-eye", "Most pages are now responsive."),
        (2, "User Profile Page", "Build the user profile management page.", "Easy", today, 90, "skeleton", "Only final touches remaining."),
        (2, "Notification System", "Implement real-time notifications for task updates.", "Medium", in_two_weeks, 25, "flying-eye", "Backend API is ready."),
    ]

    for task in tasks_user2:
        cursor = db.execute(
            """INSERT INTO tasks (user_id, name, description, difficulty, deadline, progress, monster_id, latest_note)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            task,
        )
        task_id = cursor.lastrowid
        if task[5] > 0:
            db.execute(
                "INSERT INTO task_updates (task_id, user_id, date, percent, note) VALUES (?, 2, ?, ?, ?)",
                (task_id, today, task[5], task[7]),
            )

    # Seed completed tasks for user 2
    completed_tasks_user2 = [
        (2, "Initial Project Setup", "Set up the project structure and dependencies.", "Easy", "2026-01-01", 100, "skeleton", "Project is ready for development.", 1, "2026-01-01"),
        (2, "Database Schema Design", "Design and implement the database schema.", "Medium", "2026-01-03", 100, "flying-eye", "Schema is finalized.", 1, "2026-01-03"),
        (2, "Authentication System", "Implement user registration and login.", "Hard", "2026-01-06", 100, "goblin", "Auth system is secure and working.", 1, "2026-01-06"),
        (2, "Task CRUD Operations", "Implement create, read, update, delete for tasks.", "Medium", "2026-01-09", 100, "flying-eye", "All operations working correctly.", 1, "2026-01-09"),
        (2, "Progress Tracking", "Add daily progress tracking functionality.", "Medium", "2026-01-11", 100, "flying-eye", "Progress tracking is complete.", 1, "2026-01-11"),
    ]
    db.executemany(
        """INSERT INTO tasks (user_id, name, description, difficulty, deadline, progress, monster_id, latest_note, is_completed, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        completed_tasks_user2,
    )

    # Seed achievements for users
    player_achievements = [
        (1, "first-quest", "2026-01-05"),
        (1, "streak-3", "2026-01-08"),
        (1, "10-quests", "2026-01-10"),
        (2, "first-quest", "2026-01-01"),
        (2, "streak-3", "2026-01-04"),
        (2, "streak-7", "2026-01-08"),
        (2, "hard-mode", "2026-01-06"),
    ]
    db.executemany(
        """INSERT INTO player_achievements (user_id, achievement_id, unlocked_at)
           VALUES (?, ?, ?)""",
        player_achievements,
    )

    db.commit()
    print("Successfully seeded all test data!")
    print("Users:")
    print("  - hero1 / password1")
    print("  - hero2 / password2")
    print("  - admin / adminpass")
    db.close()


if __name__ == "__main__":
    seed()