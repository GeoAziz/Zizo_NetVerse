/**
 * Hook for app initialization
 * Ensures environment validation and initialization happens at startup
 */

'use client';

import { useEffect, useState } from 'react';
import { initializeApp } from '@/lib/appInit';

export const useAppInitialization = () => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeApp();
        setInitialized(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('App initialization failed:', error);
      }
    };

    init();
  }, []);

  return { initialized, error };
};
