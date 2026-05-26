from database import get_db

MONSTER_MAP = {
    "Easy": "skeleton",
    "Medium": "flying-eye",
    "Hard": "goblin",
}


def assign_monster(difficulty):
    return MONSTER_MAP.get(difficulty, "skeleton")


def get_monster(monster_id):
    db = get_db()
    row = db.execute("SELECT * FROM monsters WHERE id = ?", (monster_id,)).fetchone()
    if row is None:
        return None
    return dict(row)


def get_all_monsters():
    db = get_db()
    rows = db.execute("SELECT * FROM monsters").fetchall()
    return [dict(r) for r in rows]
