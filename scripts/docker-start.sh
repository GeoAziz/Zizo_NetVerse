#!/bin/bash

# Docker initialization script
# Builds and starts all containers

set -e

echo "🐳 Docker Build & Start Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

print_status "Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker Compose is installed"

# Check for .env file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        print_warning ".env file not found, creating from .env.example"
        cp .env.example .env
        print_warning "Please update .env file with your configuration"
    else
        print_error ".env file not found and .env.example not available"
        exit 1
    fi
else
    print_status ".env file found"
fi

# Validate environment variables
echo ""
echo "🔍 Validating environment..."

source scripts/validate-backend-env.sh || true

# Build images
echo ""
echo "🔨 Building Docker images..."
docker-compose build --no-cache

print_status "Docker images built successfully"

# Start services
echo ""
echo "🚀 Starting services..."
docker-compose up -d

print_status "Services started"

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."

# Wait for Redis
echo "Waiting for Redis..."
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_status "Redis is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Redis failed to start"
        exit 1
    fi
    sleep 1
done

# Wait for InfluxDB
echo "Waiting for InfluxDB..."
for i in {1..30}; do
    if curl -s http://localhost:8086/health > /dev/null 2>&1; then
        print_status "InfluxDB is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "InfluxDB failed to start"
        exit 1
    fi
    sleep 1
done

# Wait for Backend
echo "Waiting for Backend..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
        print_status "Backend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_warning "Backend startup check failed (may still be starting)"
        break
    fi
    sleep 1
done

# Wait for Frontend
echo "Waiting for Frontend..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_warning "Frontend startup check failed (may still be starting)"
        break
    fi
    sleep 1
done

echo ""
echo "================================"
print_status "All services started successfully!"
echo ""
echo "Service URLs:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  InfluxDB:  http://localhost:8086"
echo "  Redis:     localhost:6379"
echo ""
echo "View logs with: docker-compose logs -f"
echo "Stop services with: docker-compose down"
echo "================================"
