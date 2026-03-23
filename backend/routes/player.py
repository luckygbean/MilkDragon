from flask import Blueprint, jsonify
from models.xp import get_player_stats, format_player_stats
from database import get_db

player_bp = Blueprint("player", __name__)


@player_bp.route("/player/stats", methods=["GET"])
def player_stats():
    stats = get_player_stats(user_id=1)
    return jsonify(format_player_stats(stats))


@player_bp.route("/player/reset", methods=["POST"])
def reset_player():
    db = get_db()
    db.execute(
        """UPDATE player_stats
           SET hero_level = 1, current_xp = 0, xp_to_level = 100,
               hero_hp = 60, hero_max_hp = 60,
               total_tasks_completed = 0, total_damage_dealt = 0,
               current_streak = 0, best_streak = 0, last_completion_date = NULL
           WHERE user_id = 1"""
    )
    db.execute("DELETE FROM player_achievements WHERE user_id = 1")
    db.execute("DELETE FROM task_updates")
    db.execute("DELETE FROM tasks WHERE user_id = 1")
    db.commit()

    stats = get_player_stats(user_id=1)
    return jsonify({"message": "Player stats reset", "playerStats": format_player_stats(stats)})
