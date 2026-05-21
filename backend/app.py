import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from database import init_db, close_db

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "task-slayer")


def create_app():
    app = Flask(__name__)
    app.config.from_pyfile("config.py")
    CORS(app, supports_credentials=True, origins="*")

    init_db(app)
    app.teardown_appcontext(close_db)

    from routes.tasks import tasks_bp
    from routes.battle import battle_bp
    from routes.player import player_bp
    from routes.achievements import achievements_bp
    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.stats import stats_bp

    app.register_blueprint(tasks_bp, url_prefix="/api")
    app.register_blueprint(battle_bp, url_prefix="/api")
    app.register_blueprint(player_bp, url_prefix="/api")
    app.register_blueprint(achievements_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(admin_bp, url_prefix="/api")
    app.register_blueprint(stats_bp, url_prefix="/api")

    @app.route("/")
    def serve_index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/admin")
    def serve_admin():
        return send_from_directory(FRONTEND_DIR, "admin.html")

    @app.route("/shop")
    def serve_shop():
        return send_from_directory(FRONTEND_DIR, "shop.html")

    @app.route("/chart")
    def serve_chart():
        return send_from_directory(os.path.dirname(__file__) + "/..", "chart-demo.html")

    @app.route("/<path:path>")
    def serve_static(path):
        if path.startswith("api/"):
            from flask import abort
            abort(404)
        
        # First try to serve from task-slayer directory
        frontend_path = os.path.join(FRONTEND_DIR, path)
        if os.path.exists(frontend_path):
            return send_from_directory(FRONTEND_DIR, path)
        
        # If not found, try to serve from root static directory
        if path.startswith("static/"):
            return send_from_directory(os.path.dirname(__file__) + "/..", path)
        
        from flask import abort
        abort(404)

    return app


if __name__ == "__main__":
    app = create_app()
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", debug=debug, port=5000, use_reloader=False)
