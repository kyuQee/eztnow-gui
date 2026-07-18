/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CoreMetrics {
  uptimeSeconds: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}

export interface StreamMetric {
  id: string;
  name: string;
  eventsPerSecond: number;
  dropsPerSecond: number;
  subscribers: number;
  bufferUtilizationPercent: number;
  peakRatePerSecond: number;
}

export interface SystemSettings {
  connectionUrl: string;
  telemetryIntervalMs: number;
  autoReconnect: boolean;
  theme: 'light';
}

// --- Sensor types ---
export interface TimePoint {
  timestamp: string;
  temperature: number;
  humidity: number;
}

export interface SensorNode {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  status: 'normal' | 'abnormal';
}

export interface SensorHistory {
  [nodeId: string]: TimePoint[];
}

export interface TelemetryState {
  metrics: CoreMetrics;
  streams: StreamMetric[];
  sensorNodes: SensorNode[];
  sensorHistory: SensorHistory;
  settings: SystemSettings;
}

export interface ITelemetryService {
  subscribe(listener: (state: TelemetryState) => void): () => void;
  getState(): TelemetryState;
  updateSettings(settings: Partial<SystemSettings>): void;
  exportLogs(): string;
  triggerConnection(status: 'connected' | 'connecting' | 'disconnected'): void;
}