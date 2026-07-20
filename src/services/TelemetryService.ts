/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TelemetryState,
  ITelemetryService,
  CoreMetrics,
  StreamMetric,
  SystemSettings,
  SensorNode,
  SensorHistory,
  TimePoint,
} from '../types';

export class TelemetryService implements ITelemetryService {
  private state: TelemetryState;
  private listeners: Set<(state: TelemetryState) => void> = new Set();
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    const defaultSettings: SystemSettings = {
      connectionUrl: 'ws://localhost:9001',
      telemetryIntervalMs: 1000,
      autoReconnect: true,
      theme: 'light',
    };

    const initialMetrics: CoreMetrics = {
      uptimeSeconds: 0,
      connectionStatus: 'connecting',
    };

    this.state = {
      metrics: initialMetrics,
      streams: [],
      sensorNodes: [],
      sensorHistory: {},
      settings: defaultSettings,
    };

    this.connect();
  }

  private connect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const url = this.state.settings.connectionUrl;
    console.log('[TelemetryService] Connecting to', url);
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      console.log('[TelemetryService] WebSocket connected');
      this.updateConnectionStatus('connected');
    };
    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    this.ws.onerror = (err) => {
      console.error('[TelemetryService] WebSocket error', err);
      this.updateConnectionStatus('disconnected');
    };
    this.ws.onclose = () => {
      console.warn('[TelemetryService] WebSocket closed');
      this.updateConnectionStatus('disconnected');
      if (this.state.settings.autoReconnect) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  /**
   * Extract telemetry data from a WebSocket message.
   * Supports both:
   *   - Flat JSON: { device_id, temperature, humidity, ... }
   *   - Mawmaw‑style: { stream, payload: "<base64>" } or { stream, payload: {...} }
   */
  private handleMessage(data: string) {
    try {
      const root = JSON.parse(data);

      // Try to get the inner payload
      let inner: any = root;

      // If there is a 'payload' field, it may be Base64‑encoded or already an object
      if (root.payload !== undefined) {
        if (typeof root.payload === 'string') {
          // Base64‑decode the string
          try {
            const decoded = atob(root.payload);
            inner = JSON.parse(decoded);
          } catch (e) {
            console.warn('Failed to Base64‑decode or parse payload, treating as raw string', e);
            // If it's not valid JSON, maybe it's a plain string? We'll try to parse as JSON anyway.
            try {
              inner = JSON.parse(root.payload);
            } catch (_) {
              // Give up
              console.warn('Payload is not JSON, ignoring', root.payload);
              return;
            }
          }
        } else if (typeof root.payload === 'object') {
          inner = root.payload;
        } else {
          console.warn('Unexpected payload type', root.payload);
          return;
        }
      }

      // Now extract device_id, temperature, humidity from `inner`
      const deviceId = inner.device_id;
      if (typeof deviceId !== 'string') {
        console.warn('Missing or invalid device_id in message', inner);
        return;
      }
      const temp = inner.temperature;
      const hum = inner.humidity;
      if (typeof temp !== 'number' || typeof hum !== 'number') {
        console.warn('Invalid temperature/humidity in message', inner);
        return;
      }

      // Update state
      this.updateDevice(deviceId, temp, hum);

    } catch (e) {
      console.error('[TelemetryService] Failed to parse WebSocket message', e);
    }
  }

  private updateDevice(deviceId: string, temp: number, hum: number) {
    const now = new Date();
    const timestampStr = this.formatTime(now);

    // Determine status
    const isNormal = temp >= 18 && temp <= 30 && hum >= 40 && hum <= 60;
    const status: 'normal' | 'abnormal' = isNormal ? 'normal' : 'abnormal';

    const node: SensorNode = {
      id: deviceId,
      name: deviceId,
      temperature: temp,
      humidity: hum,
      status,
    };

    // Update sensorNodes list
    let updatedNodes = [...this.state.sensorNodes];
    const idx = updatedNodes.findIndex(n => n.id === deviceId);
    if (idx >= 0) {
      updatedNodes[idx] = node;
    } else {
      updatedNodes.push(node);
    }

    // Update history for this node (keep last 60 points)
    const history = this.state.sensorHistory[deviceId] || [];
    const newPoint: TimePoint = {
      timestamp: timestampStr,
      temperature: temp,
      humidity: hum,
    };
    const updatedHistory = [...history, newPoint].slice(-60);
    const newSensorHistory = {
      ...this.state.sensorHistory,
      [deviceId]: updatedHistory,
    };

    this.state = {
      ...this.state,
      sensorNodes: updatedNodes,
      sensorHistory: newSensorHistory,
    };
    this.notifyListeners();
  }

  private updateConnectionStatus(status: 'connected' | 'connecting' | 'disconnected') {
    this.state = {
      ...this.state,
      metrics: {
        ...this.state.metrics,
        connectionStatus: status,
      },
    };
    this.notifyListeners();
  }

  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  // --- ITelemetryService Methods ---

  public subscribe(listener: (state: TelemetryState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): TelemetryState {
    return this.state;
  }

  public updateSettings(settings: Partial<SystemSettings>): void {
    const updatedSettings = { ...this.state.settings, ...settings };
    this.state = { ...this.state, settings: updatedSettings };
    if (settings.connectionUrl && settings.connectionUrl !== this.state.settings.connectionUrl) {
      this.connect();
    }
    this.notifyListeners();
  }

  public triggerConnection(status: 'connected' | 'connecting' | 'disconnected'): void {
    this.updateConnectionStatus(status);
  }

  public exportLogs(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      app: 'EZTNOW Monitor',
      version: '0.0.1',
      uptimeSeconds: this.state.metrics.uptimeSeconds,
      connectionUrl: this.state.settings.connectionUrl,
      sensorNodes: this.state.sensorNodes,
      streams: this.state.streams,
    }, null, 2);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}