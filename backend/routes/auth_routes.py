"""Auth Routes  /api/auth"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from bson import ObjectId
from models.database import mongo

auth_bp = Blueprint("auth", __name__)

def _pub(u):
    out = {"id": str(u["_id"]), "name": u["name"], "email": u.get("email",""),
            "phone": u.get("phone",""), "role": u["role"],
            "class_section": u.get("class_section","")}
    if u["role"] == "student" and u.get("phone"):
        s = mongo.db.students.find_one({"phone": u["phone"]})
        if s:
            out["student_id"] = str(s["_id"])
            out["photo_url"] = s.get("photo_url", "")
            out["class_section"] = s.get("class_section", out["class_section"])
            out["is_verified"] = s.get("is_verified", False)
    return out

@auth_bp.post("/register")
def register():
    d = request.get_json()
    if not all(k in d for k in ["name","password","role"]):
        return jsonify({"error": "name, password, role required"}), 400
    if d["role"] not in ("teacher","student","admin"):
        return jsonify({"error": "role must be teacher / student / admin"}), 400

    if d["role"] == "teacher":
        if not d.get("email"):
            return jsonify({"error": "email required for teachers"}), 400
        if mongo.db.users.find_one({"email": d["email"]}):
            return jsonify({"error": "Email already registered"}), 409
    else:
        if not d.get("phone"):
            return jsonify({"error": "phone required for students"}), 400
        
        # Check if user already exists
        if mongo.db.users.find_one({"phone": d["phone"]}):
            return jsonify({"error": "Phone already registered"}), 409
            
        # Check if student record exists, if not create a pending one
        from models.database import student_doc
        s_rec = mongo.db.students.find_one({"phone": d["phone"]})
        if not s_rec:
            # Auto-create verified student record
            new_s = student_doc(d["name"], "PENDING", d["phone"], d.get("class_section", "UNASSIGNED"), is_verified=True)
            s_res = mongo.db.students.insert_one(new_s)
            student_id = str(s_res.inserted_id)
        else:
            student_id = str(s_rec["_id"])

    doc = {
        "name": d["name"],
        "password": generate_password_hash(d["password"]),
        "role": d["role"],
        "class_section": d.get("class_section", ""),
        "created_at": datetime.utcnow()
    }
    if d.get("email"): doc["email"] = d["email"]
    if d.get("phone"): doc["phone"] = d["phone"]
    
    # Store student_id link for students
    if d["role"] == "student":
        doc["student_id"] = student_id

    r = mongo.db.users.insert_one(doc)
    doc["_id"] = r.inserted_id
    token = create_access_token(identity=str(r.inserted_id))
    return jsonify({"token": token, "user": _pub(doc)}), 201

@auth_bp.post("/login")
def login():
    d = request.get_json()
    q = {}
    if "email" in d:   q["email"] = d["email"]
    elif "phone" in d: q["phone"] = d["phone"]
    else: return jsonify({"error": "email or phone required"}), 400

    u = mongo.db.users.find_one(q)
    if not u or not check_password_hash(u["password"], d.get("password","")):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(u["_id"]))
    return jsonify({"token": token, "user": _pub(u)})

@auth_bp.get("/me")
@jwt_required()
def me():
    u = mongo.db.users.find_one({"_id": ObjectId(get_jwt_identity())})
    if not u: return jsonify({"error": "Not found"}), 404
    return jsonify(_pub(u))
