from flask import Blueprint, jsonify
from models.achievement import get_all_achievements

achievements_bp = Blueprint("achievements", __name__)


@achievements_bp.route("/achievements", methods=["GET"])
def list_achievements():
    achievements = get_all_achievements(user_id=1)
    return jsonify({"achievements": achievements})
