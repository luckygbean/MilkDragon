from flask import Blueprint, jsonify, session
from database import get_db

admin_bp = Blueprint("admin", __name__)


def require_admin():
    user_id = session.get("user_id")
    if not user_id:
        return None, (jsonify({"error": "Not logged in"}), 401)
    db = get_db()
    user = db.execute(
        "SELECT is_admin FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    if not user or not user["is_admin"]:
        return None, (jsonify({"error": "Admin access required"}), 403)
    return user_id, None


@admin_bp.route("/admin/stats", methods=["GET"])
def admin_stats():
    _, err = require_admin()
    if err:
        return err

    db = get_db()

    total_users = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_tasks = db.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
    completed_tasks = db.execute(
        "SELECT COUNT(*) FROM tasks WHERE is_completed = 1"
    ).fetchone()[0]
    total_updates = db.execute("SELECT COUNT(*) FROM task_updates").fetchone()[0]

    difficulty_counts = db.execute(
        "SELECT difficulty, COUNT(*) as cnt FROM tasks GROUP BY difficulty"
    ).fetchall()
    difficulty_data = {r["difficulty"]: r["cnt"] for r in difficulty_counts}

    monster_counts = db.execute(
        """SELECT m.name, COUNT(t.id) as cnt
           FROM tasks t JOIN monsters m ON t.monster_id = m.id
           WHERE t.is_completed = 1
           GROUP BY m.id"""
    ).fetchall()
    monster_data = [{"name": r["name"], "count": r["cnt"]} for r in monster_counts]

    registrations_by_day = db.execute(
        """SELECT DATE(created_at) as day, COUNT(*) as cnt
           FROM users
           GROUP BY day
           ORDER BY day DESC
           LIMIT 14"""
    ).fetchall()
    reg_data = [{"day": r["day"], "count": r["cnt"]} for r in registrations_by_day]

    tasks_by_day = db.execute(
        """SELECT DATE(created_at) as day, COUNT(*) as cnt
           FROM tasks
           GROUP BY day
           ORDER BY day DESC
           LIMIT 14"""
    ).fetchall()
    tasks_day_data = [{"day": r["day"], "count": r["cnt"]} for r in tasks_by_day]

    return jsonify({
        "overview": {
            "total_users": total_users,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "active_tasks": total_tasks - completed_tasks,
            "total_updates": total_updates,
            "completion_rate": round(completed_tasks / total_tasks * 100, 1) if total_tasks else 0,
        },
        "difficulty_distribution": difficulty_data,
        "monster_defeats": monster_data,
        "registrations_by_day": reg_data,
        "tasks_by_day": tasks_day_data,
    })


@admin_bp.route("/admin/users", methods=["GET"])
def admin_users():
    _, err = require_admin()
    if err:
        return err

    db = get_db()
    rows = db.execute(
        """SELECT u.id, u.username, u.is_admin, u.created_at,
                  COALESCE(ps.hero_level, 1) as hero_level,
                  COALESCE(ps.total_tasks_completed, 0) as tasks_completed,
                  COALESCE(ps.current_streak, 0) as current_streak,
                  COALESCE(ps.best_streak, 0) as best_streak,
                  (SELECT COUNT(*) FROM tasks WHERE user_id = u.id) as total_tasks
           FROM users u
           LEFT JOIN player_stats ps ON ps.user_id = u.id
           ORDER BY u.created_at DESC"""
    ).fetchall()

    users = [dict(r) for r in rows]
    return jsonify({"users": users})


@admin_bp.route("/admin/users/<int:uid>/toggle-admin", methods=["POST"])
def toggle_admin(uid):
    current_id, err = require_admin()
    if err:
        return err
    if uid == current_id:
        return jsonify({"error": "Cannot change your own admin status"}), 400

    db = get_db()
    user = db.execute("SELECT is_admin FROM users WHERE id = ?", (uid,)).fetchone()
    if not user:
        return jsonify({"error": "User not found"}), 404

    new_val = 0 if user["is_admin"] else 1
    db.execute("UPDATE users SET is_admin = ? WHERE id = ?", (new_val, uid))
    db.commit()
    return jsonify({"is_admin": new_val})
