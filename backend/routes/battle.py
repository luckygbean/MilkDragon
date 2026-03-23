from flask import Blueprint, request, jsonify
from models.task import get_task
from models.xp import apply_xp, get_xp_per_hit, get_player_stats, format_player_stats
from models.achievement import check_and_award_achievements
from database import get_db

battle_bp = Blueprint("battle", __name__)


@battle_bp.route("/battle/attack", methods=["POST"])
def battle_attack():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    task_id = data.get("taskId")
    if task_id is None:
        return jsonify({"error": "taskId is required"}), 400

    task = get_task(task_id, user_id=1)
    if task is None:
        return jsonify({"error": "Task not found"}), 404

    difficulty = task["difficulty"]
    xp_awarded = get_xp_per_hit(difficulty)

    # Update total damage dealt
    db = get_db()
    db.execute(
        "UPDATE player_stats SET total_damage_dealt = total_damage_dealt + ? WHERE user_id = ?",
        (xp_awarded, 1),
    )
    db.commit()

    # Apply XP
    player_result = apply_xp(1, xp_awarded)

    # Check achievements (level-based ones might trigger)
    newly_unlocked = check_and_award_achievements(1)

    return jsonify({
        "xpAwarded": xp_awarded,
        "playerStats": player_result,
        "achievementsUnlocked": newly_unlocked,
    })
