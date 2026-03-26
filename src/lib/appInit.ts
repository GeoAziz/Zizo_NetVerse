/**
 * App initialization module
 * Validates environment and initializes core services
 */

import { safeValidateEnvironment, EnvironmentValidationError } from './envValidator';

let initialized = false;
let initError: Error | null = null;

/**
 * Initialize the application
 * Should be called once at app startup
 */
export const initializeApp = async (): Promise<boolean> => {
  if (initialized) {
    if (initError) {
      throw initError;
    }
    return true;
  }

  try {
    // Validate environment variables
    const config = safeValidateEnvironment();
    
    if (!config) {
      throw new Error('Environment validation returned null');
    }

    console.debug('✅ Environment validation successful');
    console.debug(`API Base: ${config.apiBase}`);
    console.debug(`Environment: ${config.isProduction ? 'production' : 'development'}`);

    initialized = true;
    return true;
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error));

    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Critical initialization error:', initError.message);
      throw initError;
    } else {
      console.warn('⚠️ Initialization warning (non-fatal in development):', initError.message);
      initialized = true;
      return true;
    }
  }
};

/**
 * Check if app is initialized
 */
export const isAppInitialized = (): boolean => initialized;

/**
 * Get initialization error if any
 */
export const getInitError = (): Error | null => initError;
