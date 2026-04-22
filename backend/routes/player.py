from flask import Blueprint, jsonify, session
from models.xp import get_player_stats, format_player_stats
from database import get_db

player_bp = Blueprint("player", __name__)


@player_bp.route("/player/stats", methods=["GET"])
def player_stats():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "请先登录"}), 401

    stats = get_player_stats(user_id=user_id)
    return jsonify(format_player_stats(stats))


@player_bp.route("/player/reset", methods=["POST"])
def reset_player():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "请先登录"}), 401

    db = get_db()
    db.execute(
        """UPDATE player_stats
           SET hero_level = 1, current_xp = 0, xp_to_level = 100,
               hero_hp = 60, hero_max_hp = 60,
               total_tasks_completed = 0, total_damage_dealt = 0,
               current_streak = 0, best_streak = 0, last_completion_date = NULL,
               coins = 0
           WHERE user_id = ?""",
        (user_id,)
    )
    db.execute("DELETE FROM player_achievements WHERE user_id = ?", (user_id,))
    # 修复：增加了 WHERE 条件，防止误删其他玩家的数据
    db.execute("DELETE FROM task_updates WHERE user_id = ?", (user_id,))
    db.execute("DELETE FROM tasks WHERE user_id = ?", (user_id,))
    db.commit()

    stats = get_player_stats(user_id=user_id)
    return jsonify({"message": "Player stats reset", "playerStats": format_player_stats(stats)})