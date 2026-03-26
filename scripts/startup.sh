#!/bin/bash

# Startup Script for Zizo NetVerse
# Validates environment and starts the application

set -e

echo "🚀 Starting Zizo NetVerse..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Validate environment
echo "📋 Validating environment..."

if [ ! -f scripts/validate-env.js ]; then
    echo "❌ Validation script not found"
    exit 1
fi

node scripts/validate-env.js

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "🐳 Running in Docker"
    echo "Starting Next.js server..."
    exec node server.js
else
    echo "🖥️  Running locally"
    
    # Check if dependencies are installed
    if [ ! -d node_modules ]; then
        echo "📦 Installing dependencies..."
        npm ci
    fi
    
    # Build if needed
    if [ ! -d .next ]; then
        echo "🔨 Building application..."
        npm run build
    fi
    
    echo "✨ Starting development server..."
    npm run start:prod
fi
