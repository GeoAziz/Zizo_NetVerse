#!/bin/bash

# Backend Environment Validation Script
# Validates Python backend environment configuration

set -e

echo "🔍 Validating backend environment configuration..."

# Check required environment variables
REQUIRED_VARS=(
    "PROJECT_NAME"
    "API_V1_STR"
)

OPTIONAL_VARS=(
    "REDIS_URL"
    "INFLUXDB_URL"
    "INFLUXDB_TOKEN"
    "FIREBASE_PROJECT_ID"
    "GEMINI_API_KEY"
)

missing_vars=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables: ${missing_vars[*]}"
    exit 1
fi

echo "✅ All required environment variables are set"

# Check optional variables
missing_optional=()
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        missing_optional+=("$var")
    fi
done

if [ ${#missing_optional[@]} -gt 0 ]; then
    echo "⚠️  Missing optional environment variables: ${missing_optional[*]}"
fi

# Validate Python installation
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

echo "✅ Python 3 is installed: $(python3 --version)"

# Check required Python packages
required_packages=(
    "fastapi"
    "uvicorn"
    "pydantic"
    "redis"
    "influxdb_client"
)

missing_packages=()

for package in "${required_packages[@]}"; do
    if ! python3 -c "import ${package//-/_}" 2>/dev/null; then
        missing_packages+=("$package")
    fi
done

if [ ${#missing_packages[@]} -gt 0 ]; then
    echo "⚠️  Missing Python packages: ${missing_packages[*]}"
    echo "    Install with: pip install -r requirements.txt"
else
    echo "✅ All required Python packages are installed"
fi

# Validate Redis connection
if [ ! -z "${REDIS_URL}" ]; then
    if ! python3 -c "import redis; redis.from_url('${REDIS_URL}').ping()" 2>/dev/null; then
        if [ "${SKIP_SERVICE_CHECKS}" != "true" ]; then
            echo "⚠️  Could not connect to Redis at ${REDIS_URL}"
        fi
    else
        echo "✅ Redis connection successful"
    fi
fi

# Validate InfluxDB connection
if [ ! -z "${INFLUXDB_URL}" ]; then
    if ! curl -s "${INFLUXDB_URL}/health" > /dev/null; then
        if [ "${SKIP_SERVICE_CHECKS}" != "true" ]; then
            echo "⚠️  Could not connect to InfluxDB at ${INFLUXDB_URL}"
        fi
    else
        echo "✅ InfluxDB connection successful"
    fi
fi

echo "✨ Backend environment validation completed successfully"
