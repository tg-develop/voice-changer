#!/bin/bash

set -e

echo "==============================================="
echo "Voice Changer Server Startup Script"
echo "==============================================="
echo ""

# Function to check if virtual environment exists
check_venv() {
    if [ ! -d "venv" ]; then
        echo "Error: Virtual environment not found!"
        echo "Please run the installation script first:"
        echo "  ./install.sh"
        echo ""
        exit 1
    fi
    
    echo "Virtual environment found"
}

# Function to check if main.py exists
check_app() {
    if [ ! -f "main.py" ]; then
        echo "Error: main.py not found!"
        echo "Please make sure you're running this script from the server directory"
        echo ""
        exit 1
    fi
    
    echo "Application file found"
}

# Function to activate virtual environment
activate_venv() {
    echo "Activating virtual environment..."
    
    # Activate virtual environment
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    # Check if activation was successful
    if [ -z "$VIRTUAL_ENV" ]; then
        echo "Error: Failed to activate virtual environment"
        exit 1
    fi
    
    echo "Virtual environment activated: $VIRTUAL_ENV"
}

# Function to start the application
start_app() {
    echo ""
    echo "Starting Voice Changer Server..."
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the application
    python main.py
}

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down Voice Changer Server..."
    echo "Goodbye!"
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Main startup process
main() {
    echo "Starting Voice Changer Server..."
    echo ""
    
    # Check if we're in the server directory
    if [ ! -f "main.py" ]; then
        echo "Error: This script must be run from the server directory"
        echo "Please navigate to the server directory and run the script again"
        exit 1
    fi
    
    check_venv
    check_app
    activate_venv
    start_app
}

# Run main function
main