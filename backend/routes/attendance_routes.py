"""Attendance Routes  /api/attendance"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, date
from models.database import mongo, attendance_doc, notification_doc
from services.notification_service import send_push, send_sms

attendance_bp = Blueprint("attendance", __name__)

def _s(d):
    d["id"] = str(d.pop("_id"))
    d["student_id"] = str(d.get("student_id",""))
    d["period_id"]  = str(d.get("period_id",""))
    return d

@attendance_bp.post("/mark")
@jwt_required()
def mark():
    d = request.get_json()
    teacher_id = get_jwt_identity()
    for k in ["student_id","period_id","subject"]:
        if not d.get(k): return jsonify({"error": f"{k} required"}), 400
    today = date.today().isoformat()
    if mongo.db.attendance.find_one({"student_id": ObjectId(d["student_id"]),
                                      "period_id":  ObjectId(d["period_id"])}):
        return jsonify({"message": "Already marked"}), 200
    doc = attendance_doc(ObjectId(d["student_id"]), ObjectId(d["period_id"]),
                         today, d["subject"], "present", teacher_id, d.get("confidence"))
    mongo.db.attendance.insert_one(doc)
    mongo.db.periods.update_one({"_id": ObjectId(d["period_id"])}, {"$inc": {"present_count":1}})
    s = mongo.db.students.find_one({"_id": ObjectId(d["student_id"])})
    return jsonify({"message": "Present", "student_name": s["name"] if s else ""}), 201

@attendance_bp.post("/close-session")
@jwt_required()
def close_session():
    d = request.get_json()
    pid, cs = d.get("period_id"), d.get("class_section")
    if not pid or not cs: return jsonify({"error": "period_id and class_section required"}), 400
    period  = mongo.db.periods.find_one({"_id": ObjectId(pid)})
    if not period: return jsonify({"error": "Period not found"}), 404
    today   = date.today().isoformat()
    students = list(mongo.db.students.find({"class_section": cs, "is_verified": True}))
    marked  = {str(a["student_id"]) for a in mongo.db.attendance.find({"period_id": ObjectId(pid)})}
    absent_count = 0
    for s in students:
        if str(s["_id"]) in marked: continue
        on_leave = mongo.db.leave_requests.find_one({
            "student_id": ObjectId(str(s["_id"])), "date": today, "status": "approved",
            "$or": [{"subject":"All"},{"subject": period["subject"]}]})
        status = "leave" if on_leave else "absent"
        mongo.db.attendance.insert_one(
            attendance_doc(s["_id"], ObjectId(pid), today, period["subject"], status, "auto"))
        absent_count += 1
        if status == "absent":
            _notify_absent(s, period)
    mongo.db.periods.update_one({"_id": ObjectId(pid)}, {"$set": {"is_active": False}})
    return jsonify({"message": f"Session closed. {absent_count} marked absent."})

def _notify_absent(student, period):
    u = mongo.db.users.find_one({"phone": student.get("phone","")})
    if u:
        mongo.db.notifications.insert_one(notification_doc(
            str(u["_id"]), f"Absent – {period['subject']}",
            f"You were absent in {period['subject']} ({period['start_time']}–{period['end_time']}).",
            "absent"))
    if student.get("parent_phone"):
        send_sms(student["parent_phone"],
            f"Dear {student.get('parent_name','Parent')}, {student['name']} was absent in "
            f"{period['subject']} today at {period['start_time']}. -FaceTrack")

@attendance_bp.put("/update/<rid>")
@jwt_required()
def update(rid):
    d = request.get_json()
    if d.get("status") not in ("present","absent","leave"):
        return jsonify({"error": "status must be present/absent/leave"}), 400
    mongo.db.attendance.update_one({"_id": ObjectId(rid)},
        {"$set": {"status": d["status"], "marked_by": get_jwt_identity(),
                  "updated_at": datetime.utcnow()}})
    return jsonify({"message": "Updated"})

@attendance_bp.get("/period/<pid>")
@jwt_required()
def by_period(pid):
    records = list(mongo.db.attendance.find({"period_id": ObjectId(pid)}))
    out = []
    for r in records:
        s = mongo.db.students.find_one({"_id": r["student_id"]})
        r = _s(r)
        r["student_name"] = s["name"]    if s else ""
        r["roll_no"]       = s["roll_no"] if s else ""
        out.append(r)
    return jsonify(out)

@attendance_bp.get("/student/<sid>/stats")
@jwt_required()
def stats(sid):
    recs = list(mongo.db.attendance.find({"student_id": ObjectId(sid)}))
    total   = len(recs)
    present = sum(1 for r in recs if r["status"]=="present")
    absent  = sum(1 for r in recs if r["status"]=="absent")
    leave   = sum(1 for r in recs if r["status"]=="leave")
    pct     = round(present/total*100 if total else 0, 1)
    subjects = {}
    for r in recs:
        sb = r["subject"]
        if sb not in subjects: subjects[sb] = {"present":0,"absent":0,"leave":0,"total":0}
        subjects[sb]["total"] += 1; subjects[sb][r["status"]] += 1
    subj_stats = {sb: {**c, "percentage": round(c["present"]/c["total"]*100 if c["total"] else 0, 1),
                        "at_risk": (c["present"]/c["total"]*100 if c["total"] else 0) < 75}
                  for sb, c in subjects.items()}
    return jsonify({"overall": {"total":total,"present":present,"absent":absent,
                                "leave":leave,"percentage":pct,"at_risk":pct<75},
                    "by_subject": subj_stats})

@attendance_bp.get("/student/<sid>")
@jwt_required()
def history(sid):
    page  = int(request.args.get("page",1))
    limit = int(request.args.get("limit",30))
    recs  = list(mongo.db.attendance.find({"student_id":ObjectId(sid)})
                 .sort("date",-1).skip((page-1)*limit).limit(limit))
    return jsonify([_s(r) for r in recs])
