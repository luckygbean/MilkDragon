from flask import Blueprint, jsonify, session
from models.achievement import get_all_achievements

achievements_bp = Blueprint("achievements", __name__)


@achievements_bp.route("/achievements", methods=["GET"])
def list_achievements():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "请先登录"}), 401

    achievements = get_all_achievements(user_id=user_id)
    return jsonify({"achievements": achievements})