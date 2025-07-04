@echo off
setlocal

echo ===============================================
echo Voice Changer Server Startup Script
echo ===============================================
echo.

REM Function to check if virtual environment exists
:check_venv
if not exist "venv" (
    echo Error: Virtual environment not found!
    echo Please run the installation script first:
    echo   install.bat
    echo.
    pause
    exit /b 1
)

echo Virtual environment found
goto check_app

REM Function to check if main.py exists
:check_app
if not exist "main.py" (
    echo Error: main.py not found!
    echo Please make sure you're running this script from the server directory
    echo.
    pause
    exit /b 1
)

echo Application file found
goto activate_venv

REM Function to activate virtual environment
:activate_venv
echo Activating virtual environment...

call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo Error: Failed to activate virtual environment
    pause
    exit /b 1
)

echo Virtual environment activated
goto start_app

REM Function to start the application
:start_app
echo.
echo Starting Voice Changer Server...
echo Press Ctrl+C to stop the server
echo.

REM Start the application
python main.py

REM This will be reached when the server stops
echo.
echo Voice Changer Server has stopped
goto cleanup

REM Function to handle cleanup
:cleanup
echo.
echo Shutting down Voice Changer Server...
echo Goodbye!
echo.
echo Press any key to exit...
pause >nul
exit /b 0

REM Main startup process
:main
echo Starting Voice Changer Server...
echo.

REM Check if we're in the server directory
if not exist "main.py" (
    echo Error: This script must be run from the server directory
    echo Please navigate to the server directory and run the script again
    pause
    exit /b 1
)

goto check_venv