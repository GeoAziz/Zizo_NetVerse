#!/bin/bash

# Backend startup script with environment validation
# Run this to start the Python backend with proper initialization

set -e

echo "🚀 Starting Zizo NetVerse Backend..."

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Validate environment
echo "📋 Validating backend environment..."
scripts/validate-backend-env.sh

# Install dependencies if needed
if [ ! -d venv ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate || . venv/Scripts/activate

# Install/update dependencies
echo "📦 Installing Python dependencies..."
pip install -r src/backend/requirements.txt

# Run database migrations/setup
echo "🗄️  Setting up database..."
cd src/backend

# Initialize Firebase if needed
if [ ! -z "$FIREBASE_SERVICE_ACCOUNT_JSON" ]; then
    echo "🔥 Firebase configured"
fi

# Start backend
echo "✨ Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
