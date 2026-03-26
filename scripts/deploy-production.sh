#!/bin/bash

# Production deployment script
# Builds Docker images and pushes to registry

set -e

REGISTRY=${REGISTRY:-ghcr.io}
IMAGE_NAME=${IMAGE_NAME:-zizo-netverse}

echo "📦 Production Deployment Script"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Validate .env.production exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found"
    exit 1
fi

print_status "Production environment file found"

# Build frontend image
echo ""
echo "🔨 Building frontend image..."
docker build -f Dockerfile.frontend -t $REGISTRY/$IMAGE_NAME-frontend:$(git rev-parse --short HEAD) -t $REGISTRY/$IMAGE_NAME-frontend:latest .
print_status "Frontend image built"

# Build backend image
echo ""
echo "🔨 Building backend image..."
docker build -f Dockerfile.backend -t $REGISTRY/$IMAGE_NAME-backend:$(git rev-parse --short HEAD) -t $REGISTRY/$IMAGE_NAME-backend:latest .
print_status "Backend image built"

# Push to registry
if [ ! -z "$DOCKER_REGISTRY_PASSWORD" ]; then
    echo ""
    echo "🔐 Logging into Docker registry..."
    echo $DOCKER_REGISTRY_PASSWORD | docker login -u $DOCKER_REGISTRY_USERNAME --password-stdin $REGISTRY
    print_status "Logged in to registry"
    
    echo ""
    echo "📤 Pushing images to registry..."
    docker push $REGISTRY/$IMAGE_NAME-frontend:latest
    docker push $REGISTRY/$IMAGE_NAME-backend:latest
    print_status "Images pushed to registry"
fi

echo ""
print_status "Production deployment preparation complete"
