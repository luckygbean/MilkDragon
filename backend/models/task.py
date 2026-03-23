from datetime import date, timedelta
from database import get_db
from models.monster import assign_monster, get_monster
from models.xp import apply_xp, get_completion_bonus, get_player_stats
from models.achievement import check_and_award_achievements
from config import XP_PER_PROGRESS_UPDATE, XP_QUEST_COMPLETE_BONUS


def format_task(task_row, updates=None, monster=None):
    task = dict(task_row)
    if monster is None:
        monster = get_monster(task["monster_id"])

    result = {
        "id": task["id"],
        "name": task["name"],
        "description": task["description"],
        "difficulty": task["difficulty"],
        "deadline": task["deadline"],
        "progress": task["progress"],
        "monsterId": task["monster_id"],
        "monsterName": monster["name"] if monster else "Unknown",
        "monsterMaxHp": monster["max_hp"] if monster else 120,
        "monsterPower": monster["power"] if monster else 10,
        "latestNote": task["latest_note"],
        "isCompleted": bool(task["is_completed"]),
        "createdAt": task["created_at"],
        "updates": [],
    }

    if updates is not None:
        result["updates"] = [
            {"date": u["date"], "percent": u["percent"], "note": u["note"]}
            for u in updates
        ]

    return result


def get_tasks(user_id=1, include_completed=False):
    db = get_db()
    if include_completed:
        rows = db.execute(
            "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM tasks WHERE user_id = ? AND is_completed = 0 ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()

    tasks = []
    for row in rows:
        updates = db.execute(
            "SELECT date, percent, note FROM task_updates WHERE task_id = ? ORDER BY created_at DESC",
            (row["id"],),
        ).fetchall()
        tasks.append(format_task(row, updates))

    return tasks


def get_task(task_id, user_id=1):
    db = get_db()
    row = db.execute(
        "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
        (task_id, user_id),
    ).fetchone()
    if row is None:
        return None

    updates = db.execute(
        "SELECT date, percent, note FROM task_updates WHERE task_id = ? ORDER BY created_at DESC",
        (row["id"],),
    ).fetchall()
    return format_task(row, updates)


def create_task(name, description, difficulty, deadline, user_id=1):
    db = get_db()
    monster_id = assign_monster(difficulty)
    default_note = "Quest created. Awaiting the first daily progress update."
    today = date.today().isoformat()

    cursor = db.execute(
        """INSERT INTO tasks (user_id, name, description, difficulty, deadline, monster_id, latest_note)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (user_id, name, description, difficulty, deadline, monster_id, default_note),
    )
    task_id = cursor.lastrowid

    db.execute(
        "INSERT INTO task_updates (task_id, user_id, date, percent, note) VALUES (?, ?, ?, ?, ?)",
        (task_id, user_id, today, 0, default_note),
    )
    db.commit()

    return get_task(task_id, user_id)


def update_task(task_id, user_id=1, **kwargs):
    db = get_db()
    allowed_fields = {"name", "description", "difficulty", "deadline"}
    updates = {k: v for k, v in kwargs.items() if k in allowed_fields and v is not None}

    if not updates:
        return get_task(task_id, user_id)

    # Re-assign monster if difficulty changed
    if "difficulty" in updates:
        updates["monster_id"] = assign_monster(updates["difficulty"])

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [task_id, user_id]

    db.execute(
        f"UPDATE tasks SET {set_clause} WHERE id = ? AND user_id = ?",
        values,
    )
    db.commit()

    return get_task(task_id, user_id)


def delete_task(task_id, user_id=1):
    db = get_db()
    db.execute("DELETE FROM task_updates WHERE task_id = ?", (task_id,))
    db.execute(
        "DELETE FROM tasks WHERE id = ? AND user_id = ?",
        (task_id, user_id),
    )
    db.commit()


def update_progress(task_id, percent, note, user_id=1):
    db = get_db()
    task_row = db.execute(
        "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
        (task_id, user_id),
    ).fetchone()

    if task_row is None:
        return None

    old_progress = task_row["progress"]
    progress_delta = max(0, percent - old_progress)
    today = date.today().isoformat()

    db.execute(
        "UPDATE tasks SET progress = ?, latest_note = ? WHERE id = ?",
        (percent, note, task_id),
    )
    db.execute(
        "INSERT INTO task_updates (task_id, user_id, date, percent, note) VALUES (?, ?, ?, ?, ?)",
        (task_id, user_id, today, percent, note),
    )
    db.commit()

    # Calculate monster damage from progress increment
    monster = get_monster(task_row["monster_id"])
    monster_max_hp = monster["max_hp"] if monster else 120
    damage_dealt = int(monster_max_hp * progress_delta / 100)
    monster_hp_remaining = max(0, int(monster_max_hp * (100 - percent) / 100))
    monster_defeated = percent >= 100

    # XP: base progress XP + hit XP scaled by progress delta
    from models.xp import get_xp_per_hit
    hit_xp = get_xp_per_hit(task_row["difficulty"])
    xp_awarded = XP_PER_PROGRESS_UPDATE + int(hit_xp * progress_delta / 25)

    # If task is completed via progress reaching 100%, handle completion
    achievements_unlocked = []
    completion_bonus = 0
    if monster_defeated and not task_row["is_completed"]:
        db.execute(
            "UPDATE tasks SET progress = 100, is_completed = 1, completed_at = datetime('now') WHERE id = ?",
            (task_id,),
        )
        db.execute(
            "UPDATE player_stats SET total_tasks_completed = total_tasks_completed + 1 WHERE user_id = ?",
            (user_id,),
        )
        _update_streak(user_id, today)
        db.commit()

        difficulty_bonus = get_completion_bonus(task_row["difficulty"])
        completion_bonus = difficulty_bonus + XP_QUEST_COMPLETE_BONUS
        xp_awarded += completion_bonus

    player_result = apply_xp(user_id, xp_awarded)
    achievements_unlocked = check_and_award_achievements(user_id)

    task = get_task(task_id, user_id)
    return {
        "task": task,
        "xpAwarded": xp_awarded,
        "playerStats": player_result,
        "battle": {
            "damageDealt": damage_dealt,
            "monsterHpRemaining": monster_hp_remaining,
            "monsterMaxHp": monster_max_hp,
            "monsterDefeated": monster_defeated,
            "progressDelta": progress_delta,
            "completionBonus": completion_bonus,
        },
        "achievementsUnlocked": achievements_unlocked,
    }


def complete_task(task_id, user_id=1):
    db = get_db()
    task_row = db.execute(
        "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
        (task_id, user_id),
    ).fetchone()

    if task_row is None:
        return None, None, None, None

    if task_row["is_completed"]:
        task = get_task(task_id, user_id)
        stats = get_player_stats(user_id)
        return task, 0, {"heroLevel": stats["hero_level"], "currentXp": stats["current_xp"], "xpToLevel": stats["xp_to_level"], "heroHp": stats["hero_hp"], "heroMaxHp": stats["hero_max_hp"], "leveledUp": False}, []

    today = date.today().isoformat()

    # Mark as completed
    db.execute(
        "UPDATE tasks SET progress = 100, is_completed = 1, completed_at = datetime('now') WHERE id = ?",
        (task_id,),
    )

    # Update player completion count
    db.execute(
        "UPDATE player_stats SET total_tasks_completed = total_tasks_completed + 1 WHERE user_id = ?",
        (user_id,),
    )

    # Update streak
    _update_streak(user_id, today)
    db.commit()

    # Award completion bonus XP
    bonus_xp = get_completion_bonus(task_row["difficulty"])
    player_result = apply_xp(user_id, bonus_xp)

    # Check achievements
    newly_unlocked = check_and_award_achievements(user_id)

    task = get_task(task_id, user_id)
    return task, bonus_xp, player_result, newly_unlocked


def _update_streak(user_id, today):
    db = get_db()
    stats = db.execute(
        "SELECT current_streak, best_streak, last_completion_date FROM player_stats WHERE user_id = ?",
        (user_id,),
    ).fetchone()

    last_date = stats["last_completion_date"]
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    if last_date == today:
        return
    elif last_date == yesterday:
        new_streak = stats["current_streak"] + 1
    else:
        new_streak = 1

    best_streak = max(stats["best_streak"], new_streak)

    db.execute(
        "UPDATE player_stats SET current_streak = ?, best_streak = ?, last_completion_date = ? WHERE user_id = ?",
        (new_streak, best_streak, today, user_id),
    )
