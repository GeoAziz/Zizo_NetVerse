# Automated Deployment Scripts

## Overview
Automate deployment, environment setup, and service restarts for consistent and reliable operations.

## Scripts
- `backend/install_dependencies.sh`: Installs backend dependencies
- `backend/run_dev.sh`: Starts backend in development mode
- `backend/setup.sh`: Sets up backend environment
- Add scripts for:
  - Frontend build and deploy
  - Redis server start/stop
  - Full stack restart

## Usage
- Document all scripts with usage instructions
- Ensure scripts are idempotent and safe for repeated use

## Recommendations
- Add CI/CD pipeline for automated deployment
- Document onboarding steps for new team members
