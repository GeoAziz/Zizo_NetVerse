.PHONY: help dev build start lint test docker-build docker-up docker-down docker-logs clean validate-env

# Default target
help:
	@echo "🚀 Zizo NetVerse - Available Commands"
	@echo "===================================="
	@echo ""
	@echo "Development:"
	@echo "  make dev           - Start development server"
	@echo "  make lint          - Run linter"
	@echo "  make test          - Run tests"
	@echo "  make typecheck     - Run TypeScript type check"
	@echo ""
	@echo "Building:"
	@echo "  make build         - Build for production"
	@echo "  make start         - Start production server"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build  - Build Docker images"
	@echo "  make docker-up     - Start all services"
	@echo "  make docker-down   - Stop all services"
	@echo "  make docker-logs   - View service logs"
	@echo "  make docker-reset  - Reset all services (remove volumes)"
	@echo ""
	@echo "Validation & Cleanup:"
	@echo "  make validate-env  - Validate environment variables"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make install       - Install dependencies"
	@echo ""

# Development
dev:
	npm run dev

dev-backend:
	bash scripts/backend-start.sh

# Linting and Testing
lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm run test

test-watch:
	npm run test:watch

# Building
build: validate-env
	npm run build

# Production
start: validate-env
	npm run start:prod

# Docker commands
docker-build:
	bash scripts/docker-start.sh

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-down-volumes:
	docker-compose down -v

docker-logs:
	docker-compose logs -f

docker-reset: docker-down-volumes docker-up

docker-ps:
	docker-compose ps

# Validation
validate-env:
	npm run validate-env

# Cleanup
clean:
	rm -rf .next dist build coverage
	rm -rf node_modules
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete
	docker-compose down -v

# Installation
install:
	npm ci
	pip install -r src/backend/requirements.txt

# Production deployment
deploy-prod:
	bash scripts/deploy-production.sh

# Kubernetes
k8s-apply:
	kubectl apply -f k8s-deployment.yaml

k8s-delete:
	kubectl delete -f k8s-deployment.yaml

k8s-logs:
	kubectl logs -n zizo-netverse -l app=backend -f

# Security checks
security-scan:
	trivy fs .

# Health checks
health-check:
	@echo "Checking service health..."
	@curl -s http://localhost:3000 > /dev/null && echo "✓ Frontend" || echo "✗ Frontend"
	@curl -s http://localhost:8000/api/v1/health > /dev/null && echo "✓ Backend" || echo "✗ Backend"
	@curl -s http://localhost:8086/health > /dev/null && echo "✓ InfluxDB" || echo "✗ InfluxDB"
	@redis-cli ping > /dev/null && echo "✓ Redis" || echo "✗ Redis"

# Git hooks setup
setup-hooks:
	chmod +x scripts/*.sh
	@echo "Git hooks prepared"

# All-in-one setup
setup: install docker-build
	@echo "✨ Setup complete!"
	@echo "Start services with: make docker-up"
	@echo "Start development with: make dev"
