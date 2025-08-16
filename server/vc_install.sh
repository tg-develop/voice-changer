#!/bin/bash

set -e

echo "==============================================="
echo "Voice Changer Server Installation Script"
echo "==============================================="
echo ""

# Function to check if Python is available
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        echo "Error: Python is not installed or not in PATH"
        echo "Please install Python 3.8 or higher and try again"
        exit 1
    fi
    
    # Check Python version
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | grep -oE '[0-9]+\.[0-9]+')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
        echo "Error: Python 3.8 or higher is required. Found: $($PYTHON_CMD --version)"
        exit 1
    fi
    
    echo "Found Python: $($PYTHON_CMD --version)"
}

# Function to select backend
select_backend() {
    echo "Please select your backend:"
    echo "1) CPU (works everywhere, slower)"
    echo "2) CUDA (NVIDIA GPUs)"
    echo "3) DirectML (Windows only, AMD/Intel/NVIDIA)"
    echo "4) ROCm (AMD GPUs on Linux)"
    echo ""
    
    while true; do
        read -p "Enter your choice (1-4): " choice
        case $choice in
            1)
                BACKEND="cpu"
                REQUIREMENTS_FILE="requirements-cpu.txt"
                break
                ;;
            2)
                BACKEND="cuda"
                REQUIREMENTS_FILE="requirements-cuda.txt"
                break
                ;;
            3)
                BACKEND="dml"
                REQUIREMENTS_FILE="requirements-dml.txt"
                if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "cygwin" ]]; then
                    echo "Warning: DirectML is primarily designed for Windows"
                    read -p "Continue anyway? (y/n): " confirm
                    if [[ $confirm != [yY] ]]; then
                        continue
                    fi
                fi
                break
                ;;
            4)
                BACKEND="rocm"
                REQUIREMENTS_FILE="requirements-rocm.txt"
                if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
                    echo "Warning: ROCm is not supported on Windows"
                    read -p "Continue anyway? (y/n): " confirm
                    if [[ $confirm != [yY] ]]; then
                        continue
                    fi
                fi
                break
                ;;
            *)
                echo "Invalid choice. Please enter 1, 2, 3, or 4."
                ;;
        esac
    done
    
    echo "Selected backend: $BACKEND"
}

# Function to create virtual environment
create_venv() {
    echo ""
    echo "Creating virtual environment..."
    
    if [ -d "venv" ]; then
        echo "Virtual environment already exists. Removing old one..."
        rm -rf venv
    fi
    
    $PYTHON_CMD -m venv venv
    
    # Activate virtual environment
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    echo "Virtual environment created and activated"
}

# Function to install requirements
install_requirements() {
    echo ""
    echo "Installing requirements..."
    
    # Upgrade pip first
    python -m pip install --upgrade pip
    
    # Install common requirements
    echo "Installing common requirements..."
    pip install -r requirements-common.txt
    
    # Install backend-specific requirements
    if [ -f "$REQUIREMENTS_FILE" ]; then
        echo "Installing $BACKEND-specific requirements..."
        pip install -r "$REQUIREMENTS_FILE"
    else
        echo "Warning: $REQUIREMENTS_FILE not found. Skipping backend-specific requirements."
    fi
    
    echo "Requirements installed successfully"
}

# Function to show completion message
show_completion() {
    echo ""
    echo "==============================================="
    echo "Installation completed successfully!"
    echo "==============================================="
    echo ""
    echo "To start the voice changer server:"
    echo ""
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        echo "Run ./vc_start.sh"
    else
        echo "Run ./vc_start.sh"
    fi
    echo ""
    echo "Backend: $BACKEND"
    echo "Requirements file: $REQUIREMENTS_FILE"
    echo ""
}

# Main installation process
main() {
    echo "Starting installation process..."
    echo ""
    
    # Check if we're in the server directory
    if [ ! -f "main.py" ] || [ ! -f "requirements-common.txt" ]; then
        echo "Error: This script must be run from the server directory"
        echo "Please navigate to the server directory and run the script again"
        exit 1
    fi
    
    check_python
    select_backend
    create_venv
    install_requirements
    show_completion
}

# Run main function
main