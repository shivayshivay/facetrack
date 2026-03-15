"""
FaceTrack – MongoDB initialisation + schema helpers
"""

from flask_pymongo import PyMongo
from pymongo import ASCENDING, DESCENDING, IndexModel
from datetime import datetime

mongo = PyMongo()

def init_db(app):
    mongo.init_app(app)
    with app.app_context():
        _create_indexes()

def _create_indexes():
    db = mongo.db
    db.students.create_indexes([
        IndexModel([("phone",        ASCENDING)], unique=True),
        IndexModel([("roll_no",      ASCENDING), ("class_section", ASCENDING)], unique=True),
        IndexModel([("face_id",      ASCENDING)]),
        IndexModel([("is_verified",  ASCENDING)]),
    ])
    db.attendance.create_indexes([
        IndexModel([("student_id",   ASCENDING), ("date",    DESCENDING)]),
        IndexModel([("period_id",    ASCENDING)]),
        IndexModel([("date",         DESCENDING)]),
        IndexModel([("status",       ASCENDING)]),
    ])
    db.periods.create_indexes([
        IndexModel([("teacher_id",   ASCENDING), ("date",    DESCENDING)]),
        IndexModel([("is_active",    ASCENDING)]),
    ])
    db.leave_requests.create_indexes([
        IndexModel([("student_id",   ASCENDING), ("date",    DESCENDING)]),
        IndexModel([("status",       ASCENDING)]),
    ])
    db.users.create_indexes([
        IndexModel([("email",        ASCENDING)], unique=True, sparse=True),
        IndexModel([("phone",        ASCENDING)], unique=True, sparse=True),
        IndexModel([("role",         ASCENDING)]),
    ])
    print("[DB] Indexes ready ✓")

# ── Schema helpers ────────────────────────────────────────────────────────────

def student_doc(name, roll_no, phone, class_section,
                photo_url="", face_id="", is_verified=False,
                parent_phone="", parent_name=""):
    return {
        "name": name, "roll_no": roll_no, "phone": phone,
        "class_section": class_section, "photo_url": photo_url,
        "face_id": face_id, "is_verified": is_verified,
        "parent_phone": parent_phone, "parent_name": parent_name,
        "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
    }

def attendance_doc(student_id, period_id, date, subject, status, marked_by, confidence=None):
    return {
        "student_id": student_id, "period_id": period_id,
        "date": date, "subject": subject, "status": status,
        "marked_by": marked_by, "confidence": confidence,
        "created_at": datetime.utcnow(),
    }

def period_doc(teacher_id, subject, start_time, end_time, class_section, date):
    return {
        "teacher_id": teacher_id, "subject": subject,
        "start_time": start_time, "end_time": end_time,
        "class_section": class_section, "date": date,
        "is_active": True, "student_count": 0, "present_count": 0,
        "created_at": datetime.utcnow(),
    }

def leave_doc(student_id, date, subject, reason):
    return {
        "student_id": student_id, "date": date,
        "subject": subject, "reason": reason,
        "status": "pending", "reviewed_by": None, "reviewed_at": None,
        "created_at": datetime.utcnow(),
    }

def notification_doc(user_id, title, message, notif_type="info"):
    return {
        "user_id": user_id, "title": title, "message": message,
        "type": notif_type, "is_read": False,
        "created_at": datetime.utcnow(),
    }
