# 👁️ FaceTrack — Smart Attendance Web App

AI-powered attendance system with face recognition, built with Flask + React.

---

## 📁 Project Structure

```
facetrack/
├── backend/          ← Python Flask API
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   │   └── database.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── student_routes.py
│   │   ├── attendance_routes.py  (also has period/leave/report blueprints)
│   │   └── face_routes.py
│   └── services/
│       └── notification_service.py
│
└── frontend/         ← React + Vite + Tailwind
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── hooks/useAuth.jsx
        ├── services/api.js
        ├── components/shared/UI.jsx
        └── pages/
            ├── auth/  (LoginPage, RegisterPage)
            ├── teacher/ (Layout, Dashboard, Camera, Students, Reports, Leaves, Settings)
            └── student/ (Layout, Dashboard, Attendance, Leave, Profile)
```

---

## 🚀 Setup — Step by Step

### 1. Install MongoDB

Download from https://www.mongodb.com/try/download/community  
Or use MongoDB Atlas (free cloud): https://cloud.mongodb.com

### 2. Set up Backend

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your actual values (see below)

python app.py
# Server starts at http://localhost:5000
```

### 3. Set up Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 🔑 Environment Variables (.env)

| Variable | Where to get it |
|---|---|
| `JWT_SECRET_KEY` | Any random long string |
| `MONGO_URI` | MongoDB connection string |
| `AWS_ACCESS_KEY` | AWS Console → IAM → Create User → Rekognition access |
| `AWS_SECRET_KEY` | Same as above |
| `AWS_REGION` | `ap-south-1` for India |
| `AWS_COLLECTION_ID` | Any name e.g. `facetrack-students` |
| `MSG91_API_KEY` | Register at msg91.com |
| `FCM_SERVER_KEY` | Firebase Console → Project Settings → Cloud Messaging |
| `CLOUDINARY_*` | Register at cloudinary.com → Dashboard |

---

## 🏗️ First-time Setup (After Running)

1. **Create AWS Rekognition Collection** — POST `http://localhost:5000/api/face/setup-collection`  
   (Do this once, with a valid JWT token)

2. **Register a teacher account** — Go to `http://localhost:5173/register` → choose Teacher

3. **Add students** — Teacher Dashboard → Students → Add Student (or bulk CSV upload)

4. **Students register** — Students go to `/register` → choose Student → enter their phone number  
   (Must match what teacher uploaded)

5. **Teacher approves students** — Dashboard shows pending approvals

6. **Student uploads face photo** — Student Profile → click avatar → upload clear selfie  
   → face gets enrolled in AWS Rekognition automatically

7. **Start scanning** — Teacher → Camera tab → select period → Start

---

## 📋 CSV Format for Bulk Student Upload

```csv
name,roll_no,phone,class_section,parent_name,parent_phone
Aarav Shah,001,9876543210,CSE-B,Rajesh Shah,9123456789
Priya Reddy,002,8765432109,CSE-B,Suresh Reddy,9234567890
```

---

## 🌐 Deployment

### Backend (Render.com — Free)
1. Push code to GitHub
2. Go to render.com → New Web Service → Connect repo
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:create_app()`
5. Add all .env variables in Render dashboard

### Frontend (Vercel — Free)
1. Push frontend folder to GitHub
2. Go to vercel.com → Import project
3. Framework: Vite
4. Add env variable: `VITE_API_URL=https://your-render-url.onrender.com/api`
5. Update `vite.config.js` proxy to point to your Render URL

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python Flask + Flask-JWT |
| Database | MongoDB (PyMongo) |
| Face AI | AWS Rekognition |
| Photo Storage | Cloudinary |
| SMS | MSG91 (India) |
| Push Notifications | Firebase Cloud Messaging |
| Charts | Recharts |
| Camera | react-webcam |

---

## 💰 Monthly Cost Estimate

| Service | Cost |
|---|---|
| MongoDB Atlas (M0) | Free |
| AWS Rekognition | ~₹200–500/month |
| Cloudinary | Free (25GB) |
| MSG91 SMS | ~₹0.15 per SMS |
| Render.com hosting | Free tier |
| Vercel hosting | Free |
| **Total** | **~₹500–1000/month** |
