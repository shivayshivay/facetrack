"""
FaceTrack - Smart Attendance System
Backend: Flask + MongoDB + AWS Rekognition
Run: python app.py
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os
from dotenv import load_dotenv

from routes.auth_routes       import auth_bp
from routes.student_routes    import student_bp
from routes.attendance_routes import attendance_bp
from routes.period_routes     import period_bp
from routes.leave_routes      import leave_bp
from routes.report_routes     import report_bp
from routes.face_routes       import face_bp
from models.database          import init_db

load_dotenv()

def create_app():
    app = Flask(__name__)

    # Fix 308 redirect errors - allow URLs with or without trailing slash
    app.url_map.strict_slashes = False

    app.config["JWT_SECRET_KEY"]           = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)
    app.config["MONGO_URI"]                = os.getenv("MONGO_URI", "mongodb://localhost:27017/facetrack")
    app.config["AWS_ACCESS_KEY"]           = os.getenv("AWS_ACCESS_KEY")
    app.config["AWS_SECRET_KEY"]           = os.getenv("AWS_SECRET_KEY")
    app.config["AWS_REGION"]               = os.getenv("AWS_REGION", "ap-south-1")
    app.config["AWS_COLLECTION_ID"]        = os.getenv("AWS_COLLECTION_ID", "facetrack-students")
    app.config["MSG91_API_KEY"]            = os.getenv("MSG91_API_KEY")
    app.config["MSG91_SENDER_ID"]          = os.getenv("MSG91_SENDER_ID", "FTRACK")
    app.config["FCM_SERVER_KEY"]           = os.getenv("FCM_SERVER_KEY")
    app.config["CLOUDINARY_CLOUD_NAME"]    = os.getenv("CLOUDINARY_CLOUD_NAME")
    app.config["CLOUDINARY_API_KEY"]       = os.getenv("CLOUDINARY_API_KEY")
    app.config["CLOUDINARY_API_SECRET"]    = os.getenv("CLOUDINARY_API_SECRET")
    app.config["MAX_CONTENT_LENGTH"]       = 16 * 1024 * 1024

    allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})
    JWTManager(app)
    init_db(app)

    app.register_blueprint(auth_bp,       url_prefix="/api/auth")
    app.register_blueprint(student_bp,    url_prefix="/api/students")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(period_bp,     url_prefix="/api/periods")
    app.register_blueprint(leave_bp,      url_prefix="/api/leaves")
    app.register_blueprint(report_bp,     url_prefix="/api/reports")
    app.register_blueprint(face_bp,       url_prefix="/api/face")

    @app.get("/")
    def health():
        return {"status": "ok", "app": "FaceTrack API v1.0"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
