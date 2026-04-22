import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

DATABASE = os.path.join(BASE_DIR, "task_slayer.db")
SECRET_KEY = "dev-secret-key-change-in-production"

SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False

# XP awarded per battle hit by difficulty
XP_PER_HIT = {
    "Easy": 25,
    "Medium": 40,
    "Hard": 60,
}

# Bonus XP for completing a task (monster defeated)
XP_COMPLETION_BONUS = {
    "Easy": 50,
    "Medium": 100,
    "Hard": 150,
}

# XP for submitting a progress update
XP_PER_PROGRESS_UPDATE = 10

# Fixed bonus XP awarded when a quest is completed (on top of difficulty bonus)
XP_QUEST_COMPLETE_BONUS = 100

# Coins awarded per level-up
COINS_PER_LEVEL_UP = 50
