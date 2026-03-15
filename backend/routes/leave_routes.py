"""Leave Routes  /api/leaves"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from models.database import mongo, leave_doc
from services.notification_service import send_push, send_sms

leave_bp = Blueprint("leaves", __name__)

def _s(d):
    d["id"] = str(d.pop("_id"))
    d["student_id"] = str(d.get("student_id",""))
    return d

@leave_bp.post("/")
@jwt_required()
def submit():
    d = request.get_json()
    for k in ["student_id","date","subject","reason"]:
        if not d.get(k): return jsonify({"error": f"{k} required"}), 400
    doc = leave_doc(ObjectId(d["student_id"]), d["date"], d["subject"], d["reason"])
    r   = mongo.db.leave_requests.insert_one(doc); doc["_id"] = r.inserted_id
    return jsonify(_s(doc)), 201

@leave_bp.get("/")
@jwt_required()
def list_leaves():
    q = {}
    if s := request.args.get("status"):     q["status"]     = s
    if sid := request.args.get("student_id"): q["student_id"] = ObjectId(sid)
    leaves = list(mongo.db.leave_requests.find(q).sort("created_at",-1))
    out = []
    for lv in leaves:
        s = mongo.db.students.find_one({"_id": lv["student_id"]})
        lv = _s(lv)
        lv["student_name"] = s["name"] if s else "Unknown"
        out.append(lv)
    return jsonify(out)

@leave_bp.put("/<lid>/review")
@jwt_required()
def review(lid):
    d = request.get_json()
    if d.get("status") not in ("approved","rejected"):
        return jsonify({"error": "status must be approved or rejected"}), 400
    mongo.db.leave_requests.update_one({"_id": ObjectId(lid)},
        {"$set": {"status": d["status"], "reviewed_by": get_jwt_identity(),
                  "reviewed_at": datetime.utcnow()}})
    lv = mongo.db.leave_requests.find_one({"_id": ObjectId(lid)})
    if lv:
        s  = mongo.db.students.find_one({"_id": lv["student_id"]})
        u  = mongo.db.users.find_one({"phone": s["phone"]}) if s else None
        if u:
            emoji = "✅" if d["status"]=="approved" else "❌"
            mongo.db.notifications.insert_one({
                "user_id": str(u["_id"]), "is_read": False,
                "title": f"Leave {d['status'].capitalize()} {emoji}",
                "message": f"Your leave for {lv['date']} ({lv['subject']}) was {d['status']}.",
                "type": "leave"})
    return jsonify({"message": f"Leave {d['status']}"})
