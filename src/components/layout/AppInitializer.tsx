'use client';

import { ReactNode } from 'react';
import { useAppInitialization } from '@/hooks/use-app-init';

/**
 * AppInitializer component
 * Wraps the app and ensures environment validation happens at startup
 */
export const AppInitializer = ({ children }: { children: ReactNode }) => {
  const { initialized, error } = useAppInitialization();

  if (error && process.env.NODE_ENV === 'production') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Initialization Error</h1>
          <p className="text-destructive mb-4">{error.message}</p>
          <p className="text-muted-foreground text-sm">
            Please check your environment configuration and try again.
          </p>
        </div>
      </div>
    );
  }

  // In development, we continue even with warnings
  // In production, we require initialization to succeed
  if (process.env.NODE_ENV === 'production' && !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="text-center">
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
