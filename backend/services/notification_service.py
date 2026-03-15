"""Notification Service – FCM push + MSG91 SMS"""
import requests, os, json

def send_push(token: str, title: str, body: str, data: dict = None):
    key = os.getenv("FCM_SERVER_KEY")
    if not key or not token: return False
    try:
        r = requests.post("https://fcm.googleapis.com/fcm/send",
            headers={"Authorization":f"key={key}","Content-Type":"application/json"},
            data=json.dumps({"to":token,"notification":{"title":title,"body":body},"data":data or {}}),
            timeout=10)
        return r.json().get("success") == 1
    except: return False

def send_sms(phone: str, message: str):
    key    = os.getenv("MSG91_API_KEY")
    sender = os.getenv("MSG91_SENDER_ID","FTRACK")
    if not key: print(f"[SMS-SKIP] {phone}: {message[:60]}"); return False
    phone  = phone.replace("+91","").replace(" ","").strip()
    if len(phone) == 10: phone = "91" + phone
    try:
        r = requests.post("https://api.msg91.com/api/v5/flow/",
            headers={"authkey":key,"Content-Type":"application/json"},
            json={"sender":sender,"route":"4","country":"91",
                  "sms":[{"message":message,"to":[phone]}]}, timeout=10)
        return r.ok
    except: return False
