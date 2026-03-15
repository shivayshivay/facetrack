@echo off
TITLE Facetrack - Automated Starter
echo ==========================================
echo       FaceTrack - Smart Attendance
echo ==========================================
echo.

echo [1/2] Starting Backend Server...
start "Facetrack Backend" cmd /k "cd backend && venv\Scripts\activate && python app.py"

echo [2/2] Starting Frontend Server...
start "Facetrack Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo Servers are launching in separate windows.
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:5173
echo ==========================================
echo.
pause
