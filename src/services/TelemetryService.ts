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
    // Default settings – WebSocket URL points to mawmaw's publisher
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

    const initialStreams: StreamMetric[] = [];
    const initialSensorNodes: SensorNode[] = [];
    const initialSensorHistory: SensorHistory = {};

    this.state = {
      metrics: initialMetrics,
      streams: initialStreams,
      sensorNodes: initialSensorNodes,
      sensorHistory: initialSensorHistory,
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

  private handleMessage(data: string) {
    try {
      const envelope = JSON.parse(data);
      
      if (!envelope || typeof envelope.payload_b64 !== 'string') {
        console.warn('[TelemetryService] Missing or invalid payload_b64 in envelope', envelope);
        return;
      }

      const decodedPayload = typeof Buffer !== 'undefined'
        ? Buffer.from(envelope.payload_b64, 'base64').toString('utf8')
        : atob(envelope.payload_b64);

      const parsed = JSON.parse(decodedPayload);

      const deviceId = parsed.device_id;
      if (typeof deviceId !== 'string') {
        console.warn('Missing or invalid device_id in inner payload', parsed);
        return;
      }
      const temp = parsed.temperature;
      const hum = parsed.humidity;
      if (typeof temp !== 'number' || typeof hum !== 'number') {
        console.warn('Invalid temperature/humidity in inner payload', parsed);
        return;
      }

      const now = new Date();
      const timestampStr = this.formatTime(now);

      const existingNode = this.state.sensorNodes.find(n => n.id === deviceId);
      const isNormal = temp >= 18 && temp <= 30 && hum >= 40 && hum <= 60;
      const status: 'normal' | 'abnormal' = isNormal ? 'normal' : 'abnormal';
      const node: SensorNode = {
        id: deviceId,
        name: deviceId,
        temperature: temp,
        humidity: hum,
        status,
      };

      let updatedNodes = [...this.state.sensorNodes];
      const idx = updatedNodes.findIndex(n => n.id === deviceId);
      if (idx >= 0) {
        updatedNodes[idx] = node;
      } else {
        updatedNodes.push(node);
      }

      // Update history for this node
      const history = this.state.sensorHistory[deviceId] || [];
      const newPoint: TimePoint = {
        timestamp: timestampStr,
        temperature: temp,
        humidity: hum,
      };
      
      // Keep last 3600 points (1 second intervals * 3600 seconds = 1 hour)
      const updatedHistory = [...history, newPoint].slice(-3600);
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

    } catch (e) {
      console.error('[TelemetryService] Failed to parse WebSocket packet stack', e);
    }
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