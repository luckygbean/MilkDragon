import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from database import init_db, close_db

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "task-slayer")


def create_app():
    app = Flask(__name__)
    app.config.from_pyfile("config.py")
    CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5500", "http://127.0.0.1:5000"])

    @app.route("/")
    def serve_index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/admin")
    def serve_admin():
        return send_from_directory(FRONTEND_DIR, "admin.html")

    @app.route("/<path:path>")
    def serve_static(path):
        if path.startswith("api/"):
            from flask import abort
            abort(404)
        return send_from_directory(FRONTEND_DIR, path)

    init_db(app)
    app.teardown_appcontext(close_db)

    from routes.tasks import tasks_bp
    from routes.battle import battle_bp
    from routes.player import player_bp
    from routes.achievements import achievements_bp
    from routes.auth import auth_bp
    from routes.admin import admin_bp

    app.register_blueprint(tasks_bp, url_prefix="/api")
    app.register_blueprint(battle_bp, url_prefix="/api")
    app.register_blueprint(player_bp, url_prefix="/api")
    app.register_blueprint(achievements_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000, use_reloader=False)
