from flask import Blueprint, request, jsonify, session
from models.task import (
    get_tasks,
    get_task,
    create_task,
    update_task,
    delete_task,
    update_progress,
    complete_task,
)

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("/tasks", methods=["GET"])
def list_tasks():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "请先登录"}), 401

    include_completed = request.args.get("include_completed", "false").lower() == "true"
    tasks = get_tasks(user_id=user_id, include_completed=include_completed)

    return jsonify({"tasks": tasks})


@tasks_bp.route("/tasks", methods=["POST"])
def create_task_route():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "请先登录"}), 401

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    difficulty = data.get("difficulty", "").strip()
    deadline = data.get("deadline", "").strip()

    if not name or not description or not deadline:
        return jsonify({"error": "name, description, and deadline are required"}), 400

    if difficulty not in ("Easy", "Medium", "Hard"):
        return jsonify({"error": "difficulty must be Easy, Medium, or Hard"}), 400

    task = create_task(name, description, difficulty, deadline, user_id=user_id)
    return jsonify({"task": task}), 201


@tasks_bp.route("/tasks/<int:task_id>", methods=["GET"])
def get_task_route(task_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "请先登录"}), 401

    task = get_task(task_id, user_id=user_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404
    return jsonify({"task": task})


@tasks_bp.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task_route(task_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "请先登录"}), 401

    existing = get_task(task_id, user_id=user_id)
    if existing is None:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    task = update_task(
        task_id,
        user_id=user_id,
        name=data.get("name"),
        description=data.get("description"),
        difficulty=data.get("difficulty"),
        deadline=data.get("deadline"),
    )
    return jsonify({"task": task})


@tasks_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task_route(task_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "请先登录"}), 401

    existing = get_task(task_id, user_id=user_id)
    if existing is None:
        return jsonify({"error": "Task not found"}), 404

    delete_task(task_id, user_id=user_id)
    return jsonify({"message": "Task deleted"})


@tasks_bp.route("/tasks/<int:task_id>/progress", methods=["POST"])
def update_progress_route(task_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "请先登录"}), 401

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    percent = data.get("percent")
    note = data.get("note", "Daily progress update submitted.").strip()

    if percent is None or not isinstance(percent, (int, float)):
        return jsonify({"error": "percent is required and must be a number"}), 400

    percent = int(percent)
    if percent < 0 or percent > 100:
        return jsonify({"error": "percent must be between 0 and 100"}), 400

    result = update_progress(task_id, percent, note, user_id=user_id)
    if result is None:
        return jsonify({"error": "Task not found"}), 404

    return jsonify(result)


@tasks_bp.route("/tasks/<int:task_id>/complete", methods=["POST"])
def complete_task_route(task_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "请先登录"}), 401

    task, bonus_xp, player_result, achievements_unlocked = complete_task(task_id, user_id=user_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({
        "task": task,
        "xpAwarded": bonus_xp,
        "achievementsUnlocked": achievements_unlocked,
        "playerStats": player_result,
    })
