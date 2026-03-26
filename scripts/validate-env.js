#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required environment variables and configurations are set
 * Runs on application startup
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_ENV_VARS = [
  'NODE_ENV',
];

const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_API_V1',
  'FIREBASE_PROJECT_ID',
  'GEMINI_API_KEY',
];

const BACKEND_REQUIRED_ENV_VARS = [
  'PROJECT_NAME',
  'API_V1_STR',
];

const BACKEND_OPTIONAL_ENV_VARS = [
  'REDIS_URL',
  'INFLUXDB_URL',
  'FIREBASE_PROJECT_ID',
  'GEMINI_API_KEY',
  'NETWORK_INTERFACE',
];

/**
 * Validates required environment variables
 */
function validateEnvironment() {
  console.log('🔍 Validating environment configuration...');
  
  const missing = [];
  
  REQUIRED_ENV_VARS.forEach((env) => {
    if (!process.env[env]) {
      missing.push(env);
    }
  });
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
  
  // Warn about missing optional variables
  const missingOptional = [];
  OPTIONAL_ENV_VARS.forEach((env) => {
    if (!process.env[env]) {
      missingOptional.push(env);
    }
  });
  
  if (missingOptional.length > 0) {
    console.warn(`⚠️  Missing optional environment variables: ${missingOptional.join(', ')}`);
  }
}

/**
 * Validates backend Python environment
 */
function validateBackendEnvironment() {
  console.log('🔍 Validating backend environment configuration...');
  
  const missing = [];
  
  Object.keys(process.env).forEach((env) => {
    if (BACKEND_REQUIRED_ENV_VARS.includes(env) && !process.env[env]) {
      missing.push(env);
    }
  });
  
  if (missing.length > 0) {
    console.error(`❌ Missing required backend environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ Backend environment configuration is valid');
}

/**
 * Validates connectivity to required services
 */
async function validateServices() {
  console.log('🔗 Validating service connectivity...');
  
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const influxdbUrl = process.env.INFLUXDB_URL || 'http://localhost:8086';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Test InfluxDB
  if (!process.env.SKIP_SERVICE_CHECKS) {
    try {
      const response = await fetch(`${influxdbUrl}/health`);
      if (response.ok) {
        console.log('✅ InfluxDB is reachable');
      } else {
        console.warn(`⚠️  InfluxDB health check returned ${response.status}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not reach InfluxDB at ${influxdbUrl}`);
    }
  }
}

/**
 * Creates .env file from template if it doesn't exist
 */
function ensureEnvFile() {
  const envFile = path.join(process.cwd(), '.env');
  const envTemplate = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envFile)) {
    if (fs.existsSync(envTemplate)) {
      console.log('📝 Creating .env from .env.example');
      fs.copyFileSync(envTemplate, envFile);
      console.log('✅ .env file created. Please configure required variables.');
    } else {
      console.warn('⚠️  No .env file found and .env.example not available');
    }
  }
}

/**
 * Main validation function
 */
async function main() {
  ensureEnvFile();
  validateEnvironment();
  
  if (process.env.VALIDATE_BACKEND === 'true') {
    validateBackendEnvironment();
  }
  
  if (process.env.SKIP_SERVICE_CHECKS !== 'true') {
    await validateServices();
  }
  
  console.log('✨ Environment validation completed successfully');
}

main().catch((error) => {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
});
