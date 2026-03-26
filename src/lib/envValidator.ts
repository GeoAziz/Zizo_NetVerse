/**
 * Environment validation utility
 * Validates required environment variables at startup
 */

// Extend Window type for validation tracking
declare global {
  interface Window {
    __envValidationLogged?: boolean;
  }
}

export interface EnvironmentConfig {
  apiBase: string;
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseMessagingSenderId: string;
  firebaseAppId: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

export class EnvironmentValidationError extends Error {
  constructor(
    public missingVars: string[],
    public invalidVars: string[]
  ) {
    const messages = [];
    if (missingVars.length > 0) {
      messages.push(`Missing: ${missingVars.join(', ')}`);
    }
    if (invalidVars.length > 0) {
      messages.push(`Invalid: ${invalidVars.join(', ')}`);
    }
    super(`Environment validation failed: ${messages.join('; ')}`);
    this.name = 'EnvironmentValidationError';
  }
}

export const validateEnvironment = (): EnvironmentConfig => {
  const errors = {
    missing: [] as string[],
    invalid: [] as string[],
  };

  const config: any = {};

  // API Base URL
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (!apiBase) {
    console.warn(
      'NEXT_PUBLIC_API_BASE not set, using default: http://localhost:8000/api/v1'
    );
    config.apiBase = 'http://localhost:8000/api/v1';
  } else {
    try {
      new URL(apiBase);
      config.apiBase = apiBase;
    } catch {
      errors.invalid.push('NEXT_PUBLIC_API_BASE (invalid URL)');
    }
  }

  // Firebase Configuration
  const firebaseEnvValues = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseEnvValues.NEXT_PUBLIC_FIREBASE_API_KEY) {
    errors.missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  } else {
    config.firebaseApiKey = firebaseEnvValues.NEXT_PUBLIC_FIREBASE_API_KEY;
  }

  if (!firebaseEnvValues.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    errors.missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  } else {
    config.firebaseAuthDomain = firebaseEnvValues.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  }

  if (!firebaseEnvValues.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    errors.missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  } else {
    config.firebaseProjectId = firebaseEnvValues.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  }

  if (!firebaseEnvValues.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    errors.missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  } else {
    config.firebaseStorageBucket = firebaseEnvValues.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  }

  if (!firebaseEnvValues.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
    errors.missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  } else {
    config.firebaseMessagingSenderId =
      firebaseEnvValues.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  }

  if (!firebaseEnvValues.NEXT_PUBLIC_FIREBASE_APP_ID) {
    errors.missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');
  } else {
    config.firebaseAppId = firebaseEnvValues.NEXT_PUBLIC_FIREBASE_APP_ID;
  }

  // Environment mode
  config.isDevelopment = process.env.NODE_ENV === 'development';
  config.isProduction = process.env.NODE_ENV === 'production';

  if (errors.missing.length > 0 || errors.invalid.length > 0) {
    throw new EnvironmentValidationError(errors.missing, errors.invalid);
  }

  return config as EnvironmentConfig;
};

// Safe validation that doesn't throw in development
export const safeValidateEnvironment = (): EnvironmentConfig | null => {
  try {
    return validateEnvironment();
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      console.error('Environment validation warning:', error.message);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      // Return default config for development
      return {
        apiBase: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1',
        firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
        isDevelopment: true,
        isProduction: false,
      };
    }
    throw error;
  }
};

// Runtime validation for browser environment
// This runs after the app loads to verify variables were embedded in the client bundle
if (typeof window !== 'undefined') {
  // Defer validation to allow app initialization
  // The actual validation happens in appInit.ts via the AppInitializer component
  if (process.env.NODE_ENV === 'development') {
    // In development, log if variables are missing but don't throw
    const missingVars = [
      !process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 'NEXT_PUBLIC_FIREBASE_API_KEY',
      !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET && 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      !process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID && 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      !process.env.NEXT_PUBLIC_FIREBASE_APP_ID && 'NEXT_PUBLIC_FIREBASE_APP_ID',
    ].filter(Boolean) as string[];
    
    if (missingVars.length > 0 && !window.__envValidationLogged) {
      console.debug('ℹ️ Missing environment variables in browser bundle:', missingVars);
      console.debug('ℹ️ Make sure .env.local or .env file has these NEXT_PUBLIC_* variables');
      window.__envValidationLogged = true;
    }
  }
}
