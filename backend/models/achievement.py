from database import get_db

ACHIEVEMENT_CHECKS = {
    "first_blood": lambda stats, db: stats["total_tasks_completed"] >= 1,
    "slayer_5": lambda stats, db: stats["total_tasks_completed"] >= 5,
    "slayer_10": lambda stats, db: stats["total_tasks_completed"] >= 10,
    "streak_3": lambda stats, db: stats["current_streak"] >= 3,
    "streak_7": lambda stats, db: stats["current_streak"] >= 7,
    "level_5": lambda stats, db: stats["hero_level"] >= 5,
    "level_10": lambda stats, db: stats["hero_level"] >= 10,
    "hard_slayer": lambda stats, db: db.execute(
        "SELECT 1 FROM tasks WHERE user_id = ? AND difficulty = 'Hard' AND is_completed = 1",
        (stats["user_id"],),
    ).fetchone() is not None,
    "all_monsters": lambda stats, db: db.execute(
        "SELECT COUNT(DISTINCT monster_id) FROM tasks WHERE user_id = ? AND is_completed = 1",
        (stats["user_id"],),
    ).fetchone()[0] >= 3,
}


def check_and_award_achievements(user_id=1):
    db = get_db()
    stats = dict(
        db.execute("SELECT * FROM player_stats WHERE user_id = ?", (user_id,)).fetchone()
    )
    stats["user_id"] = user_id

    already_unlocked = set(
        row["achievement_id"]
        for row in db.execute(
            "SELECT achievement_id FROM player_achievements WHERE user_id = ?",
            (user_id,),
        ).fetchall()
    )

    newly_unlocked = []
    for achievement_id, check_fn in ACHIEVEMENT_CHECKS.items():
        if achievement_id not in already_unlocked and check_fn(stats, db):
            db.execute(
                "INSERT INTO player_achievements (user_id, achievement_id) VALUES (?, ?)",
                (user_id, achievement_id),
            )
            newly_unlocked.append(achievement_id)

    if newly_unlocked:
        db.commit()

    # Return full achievement info for newly unlocked
    if not newly_unlocked:
        return []

    placeholders = ",".join("?" for _ in newly_unlocked)
    rows = db.execute(
        f"SELECT id, name, description, icon FROM achievements WHERE id IN ({placeholders})",
        newly_unlocked,
    ).fetchall()

    return [
        {"id": row["id"], "name": row["name"], "description": row["description"], "icon": row["icon"]}
        for row in rows
    ]


def get_all_achievements(user_id=1):
    db = get_db()
    rows = db.execute(
        """SELECT a.id, a.name, a.description, a.icon,
                  pa.unlocked_at
           FROM achievements a
           LEFT JOIN player_achievements pa
                ON a.id = pa.achievement_id AND pa.user_id = ?
           ORDER BY a.id""",
        (user_id,),
    ).fetchall()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "icon": row["icon"],
            "unlocked": row["unlocked_at"] is not None,
            "unlockedAt": row["unlocked_at"],
        }
        for row in rows
    ]
