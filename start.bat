@echo off
echo =======================================================
echo Starting Golden Noura ERP (Backend ^& Frontend)
echo =======================================================
start cmd /k "cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000"
start cmd /k "cd frontend && npm install && npm run dev"
echo Both servers are starting up! Please wait 1-2 minutes for the installation...
echo Frontend Node Server will be on: http://localhost:5173
echo.
pause
