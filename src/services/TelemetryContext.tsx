/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { TelemetryState, ITelemetryService, SystemSettings } from '../types';
import { TelemetryService } from './TelemetryService';

interface TelemetryContextValue {
  state: TelemetryState;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  exportLogs: () => string;
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;
}

const TelemetryContext = createContext<TelemetryContextValue | undefined>(undefined);

// Instantiate our service repository (acts as our Singleton / DI Service)
const defaultServiceInstance = new TelemetryService();

export const TelemetryProvider: React.FC<{ children: React.ReactNode; service?: ITelemetryService }> = ({
  children,
  service = defaultServiceInstance,
}) => {
  const [state, setState] = useState<TelemetryState>(() => service.getState());

  useEffect(() => {
    // Subscribe to real-time updates from the telemetry repository
    const unsubscribe = service.subscribe((nextState) => {
      setState(nextState);
    });

    return () => {
      unsubscribe();
    };
  }, [service]);

  // Expose callbacks mapped to our repository service
  const contextValue = useMemo<TelemetryContextValue>(() => {
    return {
      state,
      updateSettings: (settings: Partial<SystemSettings>) => {
        service.updateSettings(settings);
      },
      exportLogs: () => {
        return service.exportLogs();
      },
      setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected') => {
        service.triggerConnection(status);
      },
    };
  }, [state, service]);

  return <TelemetryContext.Provider value={contextValue}>{children}</TelemetryContext.Provider>;
};

export const useTelemetry = (): TelemetryContextValue => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
