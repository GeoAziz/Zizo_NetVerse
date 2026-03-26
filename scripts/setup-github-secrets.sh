#!/bin/bash
#
# GitHub Secrets Setup Script for Zizo_NetVerse CI/CD Pipeline
#
# This script configures required secrets in GitHub repository for production deployment.
# Required secrets:
#   - FIREBASE_SERVICE_ACCOUNT_JSON: Firebase admin SDK JSON key
#   - GEMINI_API_KEY: Google Gemini API key  
#   - INFLUXDB_TOKEN: InfluxDB API token
#
# Usage:
#   ./scripts/setup-github-secrets.sh <repo-owner>/<repo-name>
#
# Prerequisites:
#   - GitHub CLI (gh) installed and authenticated: https://cli.github.com/
#   - jq for JSON processing (optional, for parsing credentials)
#   - All credential files in ~/.config/zizo-secrets/
#

set -euo pipefail

REPO="${1:-.}"
SECRETS_DIR="${HOME}/.config/zizo-secrets"

echo "🔐 Zizo_NetVerse GitHub Secrets Configuration"
echo "=============================================="
echo ""

if [ "$REPO" = "." ]; then
    echo "Getting current repository..."
    REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
fi

echo "Repository: $REPO"
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) not found. Install from: https://cli.github.com/"
    exit 1
fi

# Verify authentication
if ! gh auth status &> /dev/null; then
    echo "❌ Error: Not authenticated with GitHub CLI. Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ]; then
        echo "⚠️  Skipping $secret_name (empty value)"
        return 1
    fi
    
    echo "Setting $secret_name..."
    echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO"
    echo "✅ $secret_name set successfully"
}

echo "📋 REQUIRED SECRETS TO CONFIGURE:"
echo "=================================="
echo ""
echo "1️⃣  FIREBASE_SERVICE_ACCOUNT_JSON"
echo "   Location: ~/.config/zizo-secrets/firebase-service-account.json"
echo "   Description: Firebase admin SDK service account key (full JSON)"
echo ""
echo "2️⃣  GEMINI_API_KEY"
echo "   Location: ~/.config/zizo-secrets/gemini-api-key.txt"
echo "   Description: Google AI Gemini API key"
echo ""
echo "3️⃣  INFLUXDB_TOKEN"
echo "   Location: ~/.config/zizo-secrets/influxdb-token.txt"
echo "   Description: InfluxDB API token with write permissions"
echo ""

read -p "Continue with secret setup? (y/N): " confirm
if [ "${confirm:-n}" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🔄 Reading secrets from $SECRETS_DIR..."
echo ""

# Read and set FIREBASE_SERVICE_ACCOUNT_JSON
firebase_file="$SECRETS_DIR/firebase-service-account.json"
if [ -f "$firebase_file" ]; then
    firebase_json=$(cat "$firebase_file" | jq -c '.')
    set_secret "FIREBASE_SERVICE_ACCOUNT_JSON" "$firebase_json"
else
    echo "⚠️  Firebase service account file not found: $firebase_file"
    echo "   Steps to create:"
    echo "   1. Go to Firebase Console → Project Settings → Service Accounts"
    echo "   2. Click 'Generate New Private Key'"
    echo "   3. Save to: $firebase_file"
fi

echo ""

# Read and set GEMINI_API_KEY
gemini_file="$SECRETS_DIR/gemini-api-key.txt"
if [ -f "$gemini_file" ]; then
    gemini_key=$(cat "$gemini_file" | tr -d '\n')
    set_secret "GEMINI_API_KEY" "$gemini_key"
else
    echo "⚠️  Gemini API key file not found: $gemini_file"
    echo "   Steps to create:"
    echo "   1. Go to https://makersuite.google.com/app/apikey"
    echo "   2. Create or copy your API key"
    echo "   3. Save to: $gemini_file"
fi

echo ""

# Read and set INFLUXDB_TOKEN
influxdb_file="$SECRETS_DIR/influxdb-token.txt"
if [ -f "$influxdb_file" ]; then
    influxdb_token=$(cat "$influxdb_file" | tr -d '\n')
    set_secret "INFLUXDB_TOKEN" "$influxdb_token"
else
    echo "⚠️  InfluxDB token file not found: $influxdb_file"
    echo "   Steps to create:"
    echo "   1. Go to InfluxDB Cloud/Server → API Tokens"
    echo "   2. Generate new token with write:buckets scope"
    echo "   3. Save to: $influxdb_file"
fi

echo ""
echo "✨ Secret configuration complete!"
echo ""
echo "📋 Verify secrets are set:"
echo "   gh secret list --repo $REPO"
echo ""
echo "🚀 Ready for production deployment!"
