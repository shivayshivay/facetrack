"""Report Routes  /api/reports"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import date, timedelta
from bson import ObjectId
from models.database import mongo
from services.notification_service import send_sms

report_bp = Blueprint("reports", __name__)

@report_bp.get("/weekly")
@jwt_required()
def weekly():
    cs = request.args.get("class_section")
    if not cs: return jsonify({"error": "class_section required"}), 400
    today      = date.today()
    week_start = today - timedelta(days=today.weekday())
    day_stats  = []
    for i in range(5):
        d    = (week_start + timedelta(days=i)).isoformat()
        pids = [p["_id"] for p in mongo.db.periods.find({"class_section":cs,"date":d})]
        recs = list(mongo.db.attendance.find({"period_id":{"$in":pids}}))
        tot  = len(recs)
        pre  = sum(1 for r in recs if r["status"]=="present")
        day_stats.append({"date":d,"total":tot,"present":pre,
                           "percentage":round(pre/tot*100 if tot else 0,1)})
    avg = round(sum(d["percentage"] for d in day_stats)/5,1)

    students  = list(mongo.db.students.find({"class_section":cs,"is_verified":True}))
    at_risk   = []
    for s in students:
        recs = list(mongo.db.attendance.find({"student_id":s["_id"]}))
        tot  = len(recs); pre = sum(1 for r in recs if r["status"]=="present")
        pct  = round(pre/tot*100 if tot else 0,1)
        if pct < 75: at_risk.append({"name":s["name"],"roll_no":s["roll_no"],"percentage":pct})

    return jsonify({"week": f"{week_start.isoformat()} – {(week_start+timedelta(4)).isoformat()}",
                    "class_section":cs, "week_average":avg,
                    "day_stats":day_stats, "at_risk_students":at_risk})

@report_bp.post("/send-to-parents")
@jwt_required()
def send_to_parents():
    d  = request.get_json()
    cs = d.get("class_section")
    if not cs: return jsonify({"error": "class_section required"}), 400
    students = list(mongo.db.students.find({"class_section":cs,"is_verified":True}))
    sent = 0
    for s in students:
        recs = list(mongo.db.attendance.find({"student_id":s["_id"]}))
        tot  = len(recs); pre = sum(1 for r in recs if r["status"]=="present")
        pct  = round(pre/tot*100 if tot else 0,1)
        if s.get("parent_phone"):
            warn = "⚠️ Below 75% threshold!" if pct < 75 else "Good attendance!"
            send_sms(s["parent_phone"],
                     f"FaceTrack: {s['name']} attended {pre}/{tot} classes ({pct}%) this week. {warn}")
            sent += 1
    return jsonify({"message": f"Report sent to {sent} parents via SMS"})

@report_bp.get("/notifications")
@jwt_required()
def notifications():
    from flask_jwt_extended import get_jwt_identity
    uid   = get_jwt_identity()
    notifs = list(mongo.db.notifications.find({"user_id":uid}).sort("created_at",-1).limit(20))
    for n in notifs: n["id"] = str(n.pop("_id"))
    return jsonify(notifs)
