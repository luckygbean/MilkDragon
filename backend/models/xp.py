from database import get_db
from config import XP_PER_HIT, XP_COMPLETION_BONUS, XP_PER_PROGRESS_UPDATE, COINS_PER_LEVEL_UP


def xp_required_for_level(level):
    return 100 * level


def hero_max_hp_for_level(level):
    return 50 + (level * 10)


def get_player_stats(user_id=1):
    db = get_db()
    row = db.execute("SELECT * FROM player_stats WHERE user_id = ?", (user_id,)).fetchone()
    if row is None:
        db.execute("INSERT INTO player_stats (user_id) VALUES (?)", (user_id,))
        db.commit()
        row = db.execute("SELECT * FROM player_stats WHERE user_id = ?", (user_id,)).fetchone()
    return dict(row)


def apply_xp(user_id, xp_amount):
    db = get_db()
    stats = get_player_stats(user_id)

    current_xp = stats["current_xp"] + xp_amount
    hero_level = stats["hero_level"]
    xp_to_level = stats["xp_to_level"]
    coins = stats.get("coins", 0)
    leveled_up = False
    levels_gained = 0

    while current_xp >= xp_to_level:
        current_xp -= xp_to_level
        hero_level += 1
        xp_to_level = xp_required_for_level(hero_level)
        leveled_up = True
        levels_gained += 1

    coins += levels_gained * COINS_PER_LEVEL_UP
    hero_max_hp = hero_max_hp_for_level(hero_level)

    db.execute(
        """UPDATE player_stats
           SET current_xp = ?, hero_level = ?, xp_to_level = ?,
               hero_max_hp = ?, hero_hp = ?, coins = ?
           WHERE user_id = ?""",
        (current_xp, hero_level, xp_to_level, hero_max_hp, hero_max_hp, coins, user_id),
    )
    db.commit()

    return {
        "heroLevel": hero_level,
        "currentXp": current_xp,
        "xpToLevel": xp_to_level,
        "heroHp": hero_max_hp,
        "heroMaxHp": hero_max_hp,
        "leveledUp": leveled_up,
        "coinsEarned": levels_gained * COINS_PER_LEVEL_UP,
        "coins": coins,
    }


def get_xp_per_hit(difficulty):
    return XP_PER_HIT.get(difficulty, 25)


def get_completion_bonus(difficulty):
    return XP_COMPLETION_BONUS.get(difficulty, 50)


def format_player_stats(stats):
    return {
        "heroLevel": stats["hero_level"],
        "currentXp": stats["current_xp"],
        "xpToLevel": stats["xp_to_level"],
        "heroHp": stats["hero_hp"],
        "heroMaxHp": stats["hero_max_hp"],
        "totalTasksCompleted": stats["total_tasks_completed"],
        "totalDamageDealt": stats["total_damage_dealt"],
        "currentStreak": stats["current_streak"],
        "bestStreak": stats["best_streak"],
        "coins": stats.get("coins", 0),
    }
