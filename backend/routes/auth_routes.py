"""Auth Routes  /api/auth"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from bson import ObjectId
from models.database import mongo

auth_bp = Blueprint("auth", __name__)

def _pub(u):
    return {"id": str(u["_id"]), "name": u["name"], "email": u.get("email",""),
            "phone": u.get("phone",""), "role": u["role"],
            "class_section": u.get("class_section","")}

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
        if not mongo.db.students.find_one({"phone": d["phone"]}):
            return jsonify({"error": "Phone not in college records. Ask your teacher to add you first."}), 404
        if mongo.db.users.find_one({"phone": d["phone"]}):
            return jsonify({"error": "Phone already registered"}), 409

    doc = {"name": d["name"], "email": d.get("email",""), "phone": d.get("phone",""),
           "password": generate_password_hash(d["password"]),
           "role": d["role"], "class_section": d.get("class_section",""),
           "created_at": datetime.utcnow()}
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
