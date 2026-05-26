from flask import Blueprint, jsonify, session
from database import get_db
from datetime import datetime, timedelta

stats_bp = Blueprint("stats", __name__)


@stats_bp.route("/stats/level-distribution", methods=["GET"])
def level_distribution():
    """Get player level distribution statistics"""
    db = get_db()

    categories = [
        {"name": "Novice Knight", "min_level": 0, "max_level": 5},
        {"name": "Veteran Warrior", "min_level": 6, "max_level": 50},
        {"name": "Elite Fighter", "min_level": 51, "max_level": 75},
        {"name": "Legendary Hero", "min_level": 76, "max_level": 999}
    ]

    result = []
    total = 0

    for cat in categories:
        count = db.execute(
            """SELECT COUNT(*) FROM player_stats
               WHERE hero_level >= ? AND hero_level <= ?""",
            (cat["min_level"], cat["max_level"])
        ).fetchone()[0]
        result.append({"name": cat["name"], "count": count})
        total += count

    return jsonify({"categories": result, "total": total})


@stats_bp.route("/stats/register", methods=["GET"])
def register_stats():
    """Get user registration statistics for the last 14 days"""
    db = get_db()
    
    dates = []
    counts = []
    today = datetime.now().date()
    
    for i in range(13, -1, -1):
        date = today - timedelta(days=i)
        date_str = date.strftime("%m-%d")
        dates.append(date_str)
        
        date_start = date.strftime("%Y-%m-%d 00:00:00")
        date_end = date.strftime("%Y-%m-%d 23:59:59")
        
        result = db.execute(
            "SELECT COUNT(*) FROM users WHERE created_at >= ? AND created_at <= ?",
            (date_start, date_end)
        ).fetchone()
        counts.append(result[0] if result else 0)
    
    return jsonify({"dates": dates, "counts": counts})


@stats_bp.route("/stats/active", methods=["GET"])
def active_stats():
    """Get active user statistics for the last 14 days"""
    db = get_db()
    
    dates = []
    counts = []
    today = datetime.now().date()
    
    for i in range(13, -1, -1):
        date = today - timedelta(days=i)
        date_str = date.strftime("%m-%d")
        dates.append(date_str)
        
        date_start = date.strftime("%Y-%m-%d 00:00:00")
        date_end = date.strftime("%Y-%m-%d 23:59:59")
        
        # Count users with task updates on this day
        result = db.execute(
            """SELECT COUNT(DISTINCT user_id) FROM task_updates 
               WHERE created_at >= ? AND created_at <= ?""",
            (date_start, date_end)
        ).fetchone()
        active_count = result[0] if result else 0
        
        # Also count users who completed tasks on this day
        result2 = db.execute(
            """SELECT COUNT(DISTINCT t.user_id) FROM tasks t
               WHERE t.is_completed = 1 AND t.completed_at >= ? AND t.completed_at <= ?""",
            (date_start, date_end)
        ).fetchone()
        completed_count = result2[0] if result2 else 0
        
        counts.append(max(active_count, completed_count))
    
    return jsonify({"dates": dates, "counts": counts})
