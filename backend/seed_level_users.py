"""
Script to add test users with different levels for chart testing.
Run: python seed_level_users.py
"""
import sqlite3
import os
from datetime import date, timedelta

try:
    from werkzeug.security import generate_password_hash
except ImportError:
    import hashlib
    def generate_password_hash(password):
        return hashlib.sha256(password.encode()).hexdigest()

DB_PATH = os.path.join(os.path.dirname(__file__), "task_slayer.db")

def get_next_user_id(db):
    cursor = db.execute("SELECT MAX(id) FROM users")
    result = cursor.fetchone()[0]
    return 1 if result is None else result + 1

def add_level_users():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    
    start_id = get_next_user_id(db)
    print(f"Starting user ID: {start_id}")
    
    # Legendary Heroes (Level 76+) - 3 users
    legendary_heroes = [
        {"username": "legend1", "level": 80, "coins": 10000},
        {"username": "legend2", "level": 85, "coins": 12000},
        {"username": "legend3", "level": 90, "coins": 15000},
    ]
    
    # Elite Fighters (Level 51-75) - 6 users
    elite_fighters = [
        {"username": "elite1", "level": 55, "coins": 5000},
        {"username": "elite2", "level": 60, "coins": 5500},
        {"username": "elite3", "level": 65, "coins": 6000},
        {"username": "elite4", "level": 70, "coins": 7000},
        {"username": "elite5", "level": 72, "coins": 7500},
        {"username": "elite6", "level": 75, "coins": 8000},
    ]
    
    # Veteran Warriors (Level 6-50) - 4 users
    veteran_warriors = [
        {"username": "veteran1", "level": 15, "coins": 1500},
        {"username": "veteran2", "level": 25, "coins": 2500},
        {"username": "veteran3", "level": 35, "coins": 3500},
        {"username": "veteran4", "level": 45, "coins": 4500},
    ]
    
    # Novice Knights (Level 0-5) - 15 users
    novice_knights = [
        {"username": f"novice{i}", "level": i % 6, "coins": 100 + i * 50}
        for i in range(1, 16)
    ]
    
    all_users = legendary_heroes + elite_fighters + veteran_warriors + novice_knights
    today = date.today().isoformat()
    
    for i, user_data in enumerate(all_users):
        user_id = start_id + i
        username = user_data["username"]
        level = user_data["level"]
        coins = user_data["coins"]
        
        xp_to_level = level * 100
        current_xp = xp_to_level // 2  # Half level XP
        max_hp = 50 + level * 10
        tasks_completed = level * 2
        damage_dealt = level * 100
        
        # Add user
        db.execute(
            "INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)",
            (username, generate_password_hash("password"), 0)
        )
        
        # Add player stats
        db.execute(
            """INSERT INTO player_stats 
               (user_id, hero_level, current_xp, xp_to_level, hero_hp, hero_max_hp,
                total_tasks_completed, total_damage_dealt, current_streak, best_streak,
                last_completion_date, coins)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, level, current_xp, xp_to_level, max_hp, max_hp,
             tasks_completed, damage_dealt, min(level, 7), min(level, 14), today, coins)
        )
        
        print(f"Added {username} (level {level})")
    
    db.commit()
    print(f"\nSuccessfully added {len(all_users)} test users!")
    print(f"Legendary Heroes: {len(legendary_heroes)}")
    print(f"Elite Fighters: {len(elite_fighters)}")
    print(f"Veteran Warriors: {len(veteran_warriors)}")
    print(f"Novice Knights: {len(novice_knights)}")
    db.close()

if __name__ == "__main__":
    add_level_users()