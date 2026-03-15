"""Student Routes  /api/students"""

import csv, io, os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId, errors
from datetime import datetime
import cloudinary, cloudinary.uploader
from models.database import mongo, student_doc
from services.notification_service import send_push

student_bp = Blueprint("students", __name__)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def _s(d):
    d["id"] = str(d.pop("_id"))
    return d

# ── List ──────────────────────────────────────────────────────────────────────
@student_bp.get("/")
@jwt_required()
def list_students():
    q = {}
    if cs := request.args.get("class_section"):
        q["class_section"] = cs
    if iv := request.args.get("is_verified"):
        q["is_verified"] = iv.lower() == "true"
    return jsonify([_s(s) for s in mongo.db.students.find(q).sort("roll_no",1)])

@student_bp.get("/pending")
@jwt_required()
def pending():
    return jsonify([_s(s) for s in mongo.db.students.find({"is_verified":False}).sort("created_at",-1)])

# ── Add single ────────────────────────────────────────────────────────────────
@student_bp.post("/")
@jwt_required()
def add_student():
    d = request.get_json()
    for k in ["name","roll_no","phone","class_section"]:
        if not d.get(k):
            return jsonify({"error": f"{k} required"}), 400
    if mongo.db.students.find_one({"phone": d["phone"]}):
        return jsonify({"error": "Phone already exists"}), 409
    doc = student_doc(
        d["name"], d["roll_no"], d["phone"], d["class_section"],
        parent_phone=d.get("parent_phone",""),
        parent_name=d.get("parent_name",""),
        is_verified=True # Make student active by default
    )
    r = mongo.db.students.insert_one(doc)
    doc["_id"] = r.inserted_id
    return jsonify(_s(doc)), 201

# ── Bulk CSV upload ───────────────────────────────────────────────────────────
@student_bp.post("/bulk-upload")
@jwt_required()
def bulk_upload():
    if "file" not in request.files:
        return jsonify({"error": "CSV file required"}), 400
    content = request.files["file"].read().decode("utf-8")
    reader  = csv.DictReader(io.StringIO(content))
    inserted, skipped, errors = 0, 0, []
    for i, row in enumerate(reader, 2):
        try:
            if mongo.db.students.find_one({"phone": row["phone"]}):
                skipped += 1
                continue
            doc = student_doc(
                row["name"].strip(), row["roll_no"].strip(),
                row["phone"].strip(), row["class_section"].strip(),
                parent_name=row.get("parent_name","").strip(),
                parent_phone=row.get("parent_phone","").strip(),
                is_verified=True # Make student active by default
            )
            mongo.db.students.insert_one(doc)
            inserted += 1
        except Exception as e:
            errors.append(f"Row {i}: {e}")
    return jsonify({"inserted": inserted, "skipped": skipped, "message": f"Successfully imported {inserted} students", "errors": errors})

# ── Verify All Students ───────────────────────────────────────────────────────
@student_bp.post("/verify-all")
@jwt_required()
def verify_all():
    res = mongo.db.students.update_many({"is_verified": False}, {"$set": {"is_verified": True, "updated_at": datetime.utcnow()}})
    return jsonify({"message": f"Verified {res.modified_count} students"})

# ── Get one ───────────────────────────────────────────────────────────────────
@student_bp.get("/<sid>")
@jwt_required()
def get_student(sid):
    try:
        s = mongo.db.students.find_one({"_id": ObjectId(sid)})
    except errors.InvalidId:
        return jsonify({"error": "Invalid student ID"}), 400
    if not s:
        return jsonify({"error": "Not found"}), 404
    return jsonify(_s(s))

# ── Approve / Reject ──────────────────────────────────────────────────────────
@student_bp.put("/<sid>/approve")
@jwt_required()
def approve(sid):
    try:
        s = mongo.db.students.find_one({"_id": ObjectId(sid)})
    except errors.InvalidId:
        return jsonify({"error": "Invalid student ID"}), 400
    if not s:
        return jsonify({"error": "Not found"}), 404
    mongo.db.students.update_one(
        {"_id": ObjectId(sid)},
        {"$set": {"is_verified": True, "updated_at": datetime.utcnow()}}
    )
    return jsonify({"message": f"{s['name']} approved"})

@student_bp.put("/<sid>/reject")
@jwt_required()
def reject(sid):
    try:
        _id = ObjectId(sid)
    except errors.InvalidId:
        return jsonify({"error": "Invalid student ID"}), 400
    mongo.db.students.delete_one({"_id": _id})
    return jsonify({"message": "Registration rejected"})

# ── Photo upload ──────────────────────────────────────────────────────────────
@student_bp.put("/<sid>/photo")
@jwt_required()
def upload_photo(sid):
    d = request.get_json()
    if not d.get("image_base64"):
        return jsonify({"error": "image_base64 required"}), 400
    try:
        res = cloudinary.uploader.upload(
            f"data:image/jpeg;base64,{d['image_base64']}",
            folder="facetrack/students", public_id=f"student_{sid}", overwrite=True,
            transformation=[{"width":400,"height":400,"crop":"fill","gravity":"face"}]
        )
        mongo.db.students.update_one(
            {"_id": ObjectId(sid)},
            {"$set": {"photo_url": res["secure_url"], "updated_at": datetime.utcnow()}}
        )
        return jsonify({"photo_url": res["secure_url"]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Update ────────────────────────────────────────────────────────────────────
@student_bp.put("/<sid>")
@jwt_required()
def update_student(sid):
    d = request.get_json()
    fields = ["name", "roll_no", "phone", "class_section", "parent_name", "parent_phone", "is_verified"]
    upd = {k: d[k] for k in fields if k in d}
    upd["updated_at"] = datetime.utcnow()
    try:
        mongo.db.students.update_one({"_id": ObjectId(sid)}, {"$set": upd})
        return jsonify({"message": "Updated"})
    except errors.InvalidId:
        return jsonify({"error": "Invalid student ID"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Delete ────────────────────────────────────────────────────────────────────
@student_bp.delete("/<sid>")
@jwt_required()
def delete_student(sid):
    try:
        _id = ObjectId(sid)
    except errors.InvalidId:
        return jsonify({"error": "Invalid student ID"}), 400

    s = mongo.db.students.find_one({"_id": _id})
    if not s:
        return jsonify({"error": "Student not found"}), 404

    # 1. Cleanup Rekognition (if enrolled)
    if s.get("face_id"):
        try:
            from routes.face_routes import _client as face_client, _col as face_col
            c = face_client()
            c.delete_faces(CollectionId=face_col(), FaceIds=[s["face_id"]])
        except Exception as e:
            print(f"[Cleanup] Rekognition error: {e}")

    # 2. Cleanup Cloudinary (if photo exists)
    if s.get("photo_url"):
        try:
            cloudinary.uploader.destroy(f"facetrack/students/student_{sid}")
        except Exception as e:
            print(f"[Cleanup] Cloudinary error: {e}")

    # 3. Cleanup Attendance & Leave Requests
    mongo.db.attendance.delete_many({"student_id": _id})
    mongo.db.leave_requests.delete_many({"student_id": _id})
    
    # 4. Cleanup Notifications (optional, but good for "permanent" delete)
    mongo.db.notifications.delete_many({"user_id": sid})

    # 5. Finally, delete the student
    result = mongo.db.students.delete_one({"_id": _id})
    
    return jsonify({"message": "Student and all related data deleted permanently"}), 200