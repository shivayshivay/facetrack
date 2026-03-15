"""Face Routes  /api/face  – AWS Rekognition"""

import boto3, base64
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from bson import ObjectId
from datetime import datetime
from models.database import mongo

face_bp = Blueprint("face", __name__)

def _client():
    return boto3.client("rekognition",
        aws_access_key_id=current_app.config["AWS_ACCESS_KEY"],
        aws_secret_access_key=current_app.config["AWS_SECRET_KEY"],
        region_name=current_app.config["AWS_REGION"])

def _col(): return current_app.config["AWS_COLLECTION_ID"]

# ── One-time setup: create Rekognition collection ─────────────────────────────
@face_bp.post("/setup-collection")
@jwt_required()
def setup():
    try:
        c = _client()
        if _col() in c.list_collections().get("CollectionIds",[]):
            return jsonify({"message": "Collection already exists"})
        c.create_collection(CollectionId=_col())
        return jsonify({"message": f"Collection '{_col()}' created ✓"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Enroll a student's face ───────────────────────────────────────────────────
@face_bp.post("/enroll")
@jwt_required()
def enroll():
    d = request.get_json()
    sid, b64 = d.get("student_id"), d.get("image_base64")
    if not sid or not b64: return jsonify({"error": "student_id and image_base64 required"}), 400

    s = mongo.db.students.find_one({"_id": ObjectId(sid)})
    if not s: return jsonify({"error": "Student not found"}), 404

    try:
        resp = _client().index_faces(
            CollectionId=_col(), Image={"Bytes": base64.b64decode(b64)},
            ExternalImageId=sid, MaxFaces=1, QualityFilter="AUTO")
        faces = resp.get("FaceRecords", [])
        if not faces: return jsonify({"error": "No face detected – use a clear front-facing photo"}), 400
        face_id = faces[0]["Face"]["FaceId"]
        mongo.db.students.update_one({"_id": ObjectId(sid)},
            {"$set": {"face_id": face_id, "updated_at": datetime.utcnow()}})
        return jsonify({"face_id": face_id, "confidence": round(faces[0]["Face"]["Confidence"],2)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Match face during attendance scan ─────────────────────────────────────────
@face_bp.post("/match")
@jwt_required()
def match():
    d = request.get_json()
    b64 = d.get("image_base64")
    if not b64: return jsonify({"error": "image_base64 required"}), 400
    try:
        # Search for face in the Rekognition collection
        client = _client()
        resp = client.search_faces_by_image(
            CollectionId=_col(), 
            Image={"Bytes": base64.b64decode(b64)},
            MaxFaces=1, 
            FaceMatchThreshold=80 # Minimum 80% confidence
        )
        
        matches = resp.get("FaceMatches", [])
        if not matches:
            return jsonify({
                "matched": False, 
                "message": "Face not recognized. Please ensure you are enrolled and look directly at the camera."
            })

        # ExternalImageId was set to student_id during enrollment
        sid = matches[0]["Face"]["ExternalImageId"]
        confidence = matches[0]["Similarity"]
        
        s = mongo.db.students.find_one({"_id": ObjectId(sid)})
        if not s:
            return jsonify({"matched": False, "message": "Matched student record not found in database"}), 404
            
        return jsonify({
            "matched": True, 
            "confidence": round(confidence, 2),
            "student": {
                "id": sid, 
                "name": s["name"],
                "roll_no": s["roll_no"], 
                "photo_url": s.get("photo_url","")
            }
        })
    except Exception as e:
        # Check if it's an AWS Rekognition "No face detected" exception
        if "InvalidParameterException" in str(e):
             return jsonify({"matched": False, "message": "No face detected in the frame. Please look at the camera."})
        return jsonify({"error": str(e)}), 500

# ── Remove face from collection ───────────────────────────────────────────────
@face_bp.delete("/remove/<sid>")
@jwt_required()
def remove(sid):
    s = mongo.db.students.find_one({"_id": ObjectId(sid)})
    if not s or not s.get("face_id"): return jsonify({"error": "Face not enrolled"}), 404
    try:
        _client().delete_faces(CollectionId=_col(), FaceIds=[s["face_id"]])
        mongo.db.students.update_one({"_id": ObjectId(sid)},
            {"$set": {"face_id": "", "updated_at": datetime.utcnow()}})
        return jsonify({"message": "Face removed"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
