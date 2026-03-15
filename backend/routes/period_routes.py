"""Period Routes  /api/periods"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import date
from models.database import mongo, period_doc

period_bp = Blueprint("periods", __name__)

def _s(d):
    d["id"] = str(d.pop("_id")); return d

@period_bp.post("/")
@jwt_required()
def create():
    d = request.get_json()
    for k in ["subject","start_time","end_time","class_section"]:
        if not d.get(k): return jsonify({"error": f"{k} required"}), 400
    doc = period_doc(get_jwt_identity(), d["subject"], d["start_time"],
                     d["end_time"], d["class_section"], date.today().isoformat())
    doc["student_count"] = mongo.db.students.count_documents(
        {"class_section": d["class_section"], "is_verified": True})
    r = mongo.db.periods.insert_one(doc); doc["_id"] = r.inserted_id
    return jsonify(_s(doc)), 201

@period_bp.get("/today")
@jwt_required()
def today():
    tid = get_jwt_identity()
    ps  = list(mongo.db.periods.find({"teacher_id": tid, "date": date.today().isoformat()}).sort("start_time",1))
    return jsonify([_s(p) for p in ps])

@period_bp.put("/<pid>/end")
@jwt_required()
def end(pid):
    mongo.db.periods.update_one({"_id": ObjectId(pid)}, {"$set": {"is_active": False}})
    return jsonify({"message": "Period ended"})

@period_bp.get("/")
@jwt_required()
def all_periods():
    tid = get_jwt_identity()
    ps  = list(mongo.db.periods.find({"teacher_id": tid}).sort("date",-1).limit(50))
    return jsonify([_s(p) for p in ps])
