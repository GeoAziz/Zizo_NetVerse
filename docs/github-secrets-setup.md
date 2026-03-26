# GitHub Secrets Configuration Guide

## Overview
This document provides step-by-step instructions for configuring GitHub repository secrets required for the Zizo_NetVerse CI/CD pipeline.

**⚠️ CRITICAL**: These secrets must be configured before production deployment.

---

## Required Secrets

### 1. FIREBASE_SERVICE_ACCOUNT_JSON
**Purpose**: Firebase Admin SDK authentication for backend services  
**Type**: JSON  
**Scope**: Backend API, AI services

#### Setup Steps:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Navigate to **Project Settings** → **Service Accounts** tab
4. Click **Generate New Private Key**
5. A JSON file will download automatically
6. Copy the entire JSON content

#### Adding to GitHub:
```bash
# Method 1: Using GitHub CLI
gh secret set FIREBASE_SERVICE_ACCOUNT_JSON < firebase-key.json

# Method 2: Using provided script
./scripts/setup-github-secrets.sh <owner>/<repo>
```

---

### 2. GEMINI_API_KEY
**Purpose**: Google AI Gemini API for threat analysis and AI lab features  
**Type**: Text string  
**Scope**: Frontend & backend AI services

#### Setup Steps:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Create API Key**
3. Select your Google Cloud project
4. Copy the generated API key

#### Adding to GitHub:
```bash
# Method 1: Using GitHub CLI
echo "your-api-key" | gh secret set GEMINI_API_KEY

# Method 2: Using provided script
echo "your-api-key" > ~/.config/zizo-secrets/gemini-api-key.txt
./scripts/setup-github-secrets.sh <owner>/<repo>
```

---

### 3. INFLUXDB_TOKEN
**Purpose**: InfluxDB authentication for network metrics storage  
**Type**: Text string  
**Scope**: Backend packet pipeline, metrics aggregation

#### Setup Steps for InfluxDB Cloud:
1. Go to [InfluxDB Cloud Console](https://cloud2.influxdata.com/)
2. Navigate to **API Tokens** section
3. Click **Generate** → **Read/Write API Token**
4. Set permissions:
   - ✅ Write to `network-logs` bucket
   - ✅ Write to `real-time-metrics` bucket
5. Copy the token value

#### Setup Steps for Self-Hosted InfluxDB:
1. Access your InfluxDB server: `http://<host>:8086`
2. Go to **InfluxDB UI** → **Data** → **Tokens**
3. Click **Generate** → **Custom Token**
4. Set permissions as above
5. Copy the token

#### Adding to GitHub:
```bash
# Method 1: Using GitHub CLI
echo "your-influxdb-token" | gh secret set INFLUXDB_TOKEN

# Method 2: Using provided script
echo "your-influxdb-token" > ~/.config/zizo-secrets/influxdb-token.txt
./scripts/setup-github-secrets.sh <owner>/<repo>
```

---

## Quick Setup Using Provided Script

### Prerequisites:
- GitHub CLI installed: https://cli.github.com/
- `gh auth login` completed
- Secret files saved locally

### Directory Structure:
```
~/.config/zizo-secrets/
├── firebase-service-account.json
├── gemini-api-key.txt
└── influxdb-token.txt
```

### Execution:
```bash
# Make script executable
chmod +x scripts/setup-github-secrets.sh

# Run setup script
./scripts/setup-github-secrets.sh your-org/zizo-netverse

# Verify secrets are set
gh secret list --repo your-org/zizo-netverse
```

---

## Manual Setup via GitHub Web UI

### Steps:
1. Navigate to your repository on GitHub.com
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. For each secret:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_JSON`, `GEMINI_API_KEY`, or `INFLUXDB_TOKEN`
   - **Value**: Paste the secret value
   - Click **Add secret**

---

## Verification

### Check Secrets are Configured:
```bash
# Using GitHub CLI
gh secret list --repo your-org/zizo-netverse

# Expected output:
# NAME                                UPDATED
# FIREBASE_SERVICE_ACCOUNT_JSON      2024-01-15T10:30:00Z
# GEMINI_API_KEY                     2024-01-15T10:35:00Z
# INFLUXDB_TOKEN                     2024-01-15T10:40:00Z
```

### Test Pipeline:
```bash
git push --force-with-lease
# Check GitHub Actions → CI/CD Pipeline
# Verify build completes with all secrets available
```

---

## CI/CD Pipeline Usage

### Frontend Build:
- Uses `GEMINI_API_KEY` for AI lab features
- Uses `FIREBASE_PROJECT_ID` for authentication

### Backend Build:
- Uses `FIREBASE_SERVICE_ACCOUNT_JSON` for Firebase Admin SDK
- Uses `INFLUXDB_TOKEN` for metrics pipeline
- Uses `GEMINI_API_KEY` for threat analysis AI

### Example Workflow Access:
```yaml
build:
  steps:
    - name: Build backend
      env:
        FIREBASE_SERVICE_ACCOUNT_JSON: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_JSON }}
        INFLUXDB_TOKEN: ${{ secrets.INFLUXDB_TOKEN }}
      run: docker build -f Dockerfile.backend .
```

---

## Troubleshooting

### ❌ "Secret not found" Error
**Solution**:
- Verify secret name matches exactly (case-sensitive)
- Confirm secret is set for the correct repository
- Try refreshing the GitHub page

### ❌ Build Fails with "Invalid API Key"
**Solution**:
- Verify API key has not expired
- Check API key has appropriate permissions
- Regenerate key if necessary

### ❌ "Authentication Failed"
**Solution**:
- Verify JSON content is valid (use `jq . firebase-key.json`)
- Ensure no newlines or extra whitespace in secret
- For JSON: set entire object, not individual fields

---

## Security Best Practices

### DO:
✅ Rotate secrets periodically (every 6 months recommended)  
✅ Use separate tokens per environment (dev/staging/prod)  
✅ Enable audit logging for secret access  
✅ Restrict secret access to necessary workflows only  
✅ Use GitHub's built-in secret scanning  

### DON'T:
❌ Hardcode secrets in code or config files  
❌ Share secret values outside secure channels  
❌ Commit credential files to repository  
❌ Use same secrets across multiple projects  
❌ Log or print secret values in build output  

---

## Reference

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Service Accounts](https://firebase.google.com/docs/admin/setup)
- [Google Gemini API](https://ai.google.dev/)
- [InfluxDB API Tokens](https://docs.influxdata.com/influxdb/latest/api/tokens/)
- [GitHub CLI Documentation](https://cli.github.com/manual)
