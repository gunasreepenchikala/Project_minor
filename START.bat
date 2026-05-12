@echo off
echo.
echo ============================================
echo   ComplyAI - Starting...
echo ============================================
echo.

:: Install Python packages
echo [1/4] Installing Python packages...
pip install -r requirements.txt -q
echo Done.

:: Remove old database to start fresh (optional - comment out to keep data)
:: del complyai.db 2>nul

:: Start Flask backend in background
echo [2/4] Starting backend (Flask on port 5000)...
start "ComplyAI Backend" cmd /k "python app.py"

:: Wait for backend to start
echo [3/4] Waiting for backend to initialize...
timeout /t 4 /nobreak > nul

:: Install and start frontend
echo [4/4] Starting frontend (React on port 5173)...
cd frontend
call npm install --silent
start "ComplyAI Frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo   Both servers are starting!
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo.
echo   Open your browser at: http://localhost:5173
echo ============================================
echo.
pause
