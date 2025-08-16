@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo Voice Changer Server Installation Script
echo ===============================================
echo.

REM Function to check if Python is available
:check_python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher and try again
    pause
    exit /b 1
)

REM Check Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
for /f "tokens=1,2 delims=." %%a in ("%PYTHON_VERSION%") do (
    set PYTHON_MAJOR=%%a
    set PYTHON_MINOR=%%b
)

if %PYTHON_MAJOR% lss 3 (
    echo Error: Python 3.10 or higher is required. Found: %PYTHON_VERSION%
    pause
    exit /b 1
)
if %PYTHON_MAJOR% equ 3 if %PYTHON_MINOR% lss 10 (
    echo Error: Python 3.10 or higher is required. Found: %PYTHON_VERSION%
    pause
    exit /b 1
)

echo Found Python: %PYTHON_VERSION%
goto select_backend

REM Function to select backend
:select_backend
echo.
echo Please select your backend:
echo 1) CPU (works everywhere, slower)
echo 2) CUDA (NVIDIA GPUs)
echo 3) DirectML (Windows, AMD/Intel/NVIDIA)
echo 4) ROCm (AMD GPUs on Linux - not recommended for Windows)
echo.

:ask_choice
set /p choice=Enter your choice (1-4): 

if "%choice%"=="1" (
    set BACKEND=cpu
    set REQUIREMENTS_FILE=requirements-cpu.txt
    goto create_venv
)
if "%choice%"=="2" (
    set BACKEND=cuda
    set REQUIREMENTS_FILE=requirements-cuda.txt
    goto create_venv
)
if "%choice%"=="3" (
    set BACKEND=dml
    set REQUIREMENTS_FILE=requirements-dml.txt
    goto create_venv
)
if "%choice%"=="4" (
    set BACKEND=rocm
    set REQUIREMENTS_FILE=requirements-rocm.txt
    echo Warning: ROCm is not officially supported on Windows
    set /p confirm=Continue anyway? (y/n): 
    if /i "!confirm!"=="y" goto create_venv
    if /i "!confirm!"=="yes" goto create_venv
    goto ask_choice
)

echo Invalid choice. Please enter 1, 2, 3, or 4.
goto ask_choice

REM Function to create virtual environment
:create_venv
echo.
echo Selected backend: %BACKEND%
echo.
echo Creating virtual environment...

if exist "venv" (
    echo Virtual environment already exists. Removing old one...
    rmdir /s /q venv
)

python -m venv venv
if %errorlevel% neq 0 (
    echo Error: Failed to create virtual environment
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo Error: Failed to activate virtual environment
    pause
    exit /b 1
)

echo Virtual environment created and activated
goto install_requirements

REM Function to install requirements
:install_requirements
echo.
echo Installing requirements...

REM Upgrade pip first
python -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo Warning: Failed to upgrade pip
)

REM Install common requirements
echo Installing common requirements...
pip install -r requirements-common.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install common requirements
    pause
    exit /b 1
)

REM Install backend-specific requirements
if exist "%REQUIREMENTS_FILE%" (
    echo Installing %BACKEND%-specific requirements...
    pip install -r "%REQUIREMENTS_FILE%"
    if %errorlevel% neq 0 (
        echo Error: Failed to install %BACKEND%-specific requirements
        pause
        exit /b 1
    )
) else (
    echo Warning: %REQUIREMENTS_FILE% not found. Skipping backend-specific requirements.
)

echo Requirements installed successfully
goto show_completion

REM Function to show completion message
:show_completion
echo.
echo ===============================================
echo Installation completed successfully!
echo ===============================================
echo.
echo To start the voice changer server:
echo.
echo Run .\vc_start.bat
echo.
echo Backend: %BACKEND%
echo Requirements file: %REQUIREMENTS_FILE%
echo.
echo Press any key to exit...
pause >nul
exit /b 0

REM Main installation process
:main
echo Starting installation process...
echo.

REM Check if we're in the server directory
if not exist "main.py" (
    echo Error: This script must be run from the server directory
    echo Please navigate to the server directory and run the script again
    pause
    exit /b 1
)
if not exist "requirements-common.txt" (
    echo Error: This script must be run from the server directory
    echo Please navigate to the server directory and run the script again
    pause
    exit /b 1
)

goto check_python