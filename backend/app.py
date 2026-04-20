from flask import Flask
from flask_cors import CORS
from database import init_db, close_db


def create_app():
    app = Flask(__name__)
    app.config.from_pyfile("config.py")
    app.secret_key = app.config.get("SECRET_KEY", "dev-secret-key-replace-later")
    CORS(app, supports_credentials=True, origins=["http://127.0.0.1:5500"])

    init_db(app)
    app.teardown_appcontext(close_db)

    from routes.tasks import tasks_bp
    from routes.battle import battle_bp
    from routes.player import player_bp
    from routes.achievements import achievements_bp
    from routes.auth import auth_bp

    app.register_blueprint(tasks_bp, url_prefix="/api")
    app.register_blueprint(battle_bp, url_prefix="/api")
    app.register_blueprint(player_bp, url_prefix="/api")
    app.register_blueprint(achievements_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
