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
  private intervalId: NodeJS.Timeout | null = null;

  // Store per-node drift targets for subtle random walk
  private nodeTargets: Map<string, { tempTarget: number; humidTarget: number }> = new Map();

  constructor() {
    // --- Default settings ---
    const defaultSettings: SystemSettings = {
      connectionUrl: 'ws://127.0.0.1:3000/telemetry',
      telemetryIntervalMs: 1000,
      autoReconnect: true,
      theme: 'light',
    };

    // --- Initial metrics ---
    const initialMetrics: CoreMetrics = {
      uptimeSeconds: 0,
      connectionStatus: 'connected',
    };

    // --- Generate dummy streams ---
    const initialStreams: StreamMetric[] = [
      {
        id: 'stream-1',
        name: 'Main Ingest',
        eventsPerSecond: 245300,
        dropsPerSecond: 0,
        subscribers: 3,
        bufferUtilizationPercent: 12.4,
        peakRatePerSecond: 285400,
      },
      {
        id: 'stream-2',
        name: 'WASM Pipeline',
        eventsPerSecond: 243500,
        dropsPerSecond: 12,
        subscribers: 2,
        bufferUtilizationPercent: 24.1,
        peakRatePerSecond: 260200,
      },
      {
        id: 'stream-3',
        name: 'Python Analytics',
        eventsPerSecond: 8200,
        dropsPerSecond: 0,
        subscribers: 1,
        bufferUtilizationPercent: 5.1,
        peakRatePerSecond: 10500,
      },
      {
        id: 'stream-4',
        name: 'Telemetry Out',
        eventsPerSecond: 512,
        dropsPerSecond: 0,
        subscribers: 1,
        bufferUtilizationPercent: 1.1,
        peakRatePerSecond: 620,
      },
    ];

    // --- Generate sensor nodes and histories ---
    const sensorNodes: SensorNode[] = this.generateSensorNodes(8);
    const sensorHistory: SensorHistory = {};
    sensorNodes.forEach((node) => {
      // Pre-populate 60 points of history for each node
      const points: TimePoint[] = [];
      const nowTime = Date.now();
      // Initialize target near node's starting values
      this.nodeTargets.set(node.id, {
        tempTarget: node.temperature,
        humidTarget: node.humidity,
      });
      for (let i = 59; i >= 0; i--) {
        const ts = new Date(nowTime - i * 1000);
        // Use a stable random walk with small variation
        const tempOffset = (Math.sin(i / 10 + parseInt(node.id.slice(-2))) * 1.5) + (Math.random() - 0.5) * 0.8;
        const humidOffset = (Math.sin(i / 8 + parseInt(node.id.slice(-2))) * 2.5) + (Math.random() - 0.5) * 1.5;
        let temp = node.temperature + tempOffset;
        let humid = node.humidity + humidOffset;
        // Clamp to realistic ranges
        temp = Math.max(15, Math.min(40, temp));
        humid = Math.max(20, Math.min(80, humid));
        points.push({
          timestamp: this.formatTime(ts),
          temperature: parseFloat(temp.toFixed(1)),
          humidity: parseFloat(humid.toFixed(1)),
        });
      }
      sensorHistory[node.id] = points;
    });

    this.state = {
      metrics: initialMetrics,
      streams: initialStreams,
      sensorNodes,
      sensorHistory,
      settings: defaultSettings,
    };

    this.startSimulation();
  }

  // --- Helper: generate sensor nodes with initial stable values ---
  private generateSensorNodes(count: number): SensorNode[] {
    const nodes: SensorNode[] = [];
    // Force at least one node to start abnormal
    for (let i = 0; i < count; i++) {
      let temp: number, humid: number;
      let isNormal: boolean;
      if (i === 0) {
        // First node starts abnormal (e.g., high temp)
        temp = 33 + Math.random() * 3; // 33-36°C
        humid = 40 + Math.random() * 10; // 40-50%
        isNormal = false;
      } else {
        // Others start normal
        temp = 21 + Math.random() * 7; // 21-28°C
        humid = 42 + Math.random() * 14; // 42-56%
        isNormal = temp >= 18 && temp <= 30 && humid >= 40 && humid <= 60;
      }
      nodes.push({
        id: `sensor-${i + 1}`,
        name: `NODE_${i + 1}`,
        temperature: parseFloat(temp.toFixed(1)),
        humidity: parseFloat(humid.toFixed(1)),
        status: isNormal ? 'normal' : 'abnormal',
      } as SensorNode); // type assertion to fix the status union type
    }
    return nodes;
  }

  // --- Helper: format Date to HH:mm:ss ---
  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  // --- Core update cycle ---
  private updateCycle() {
    const currentStatus = this.state.metrics.connectionStatus;
    const nextUptime = this.state.metrics.uptimeSeconds + 1;

    if (currentStatus !== 'connected') {
      this.state = {
        ...this.state,
        metrics: {
          ...this.state.metrics,
          uptimeSeconds: nextUptime,
        },
      };
      this.notifyListeners();
      return;
    }

    const now = new Date();
    const newTimestamp = this.formatTime(now);

    // ---- Update sensor nodes and histories ----
    // Ensure at least one node is abnormal by occasionally forcing a drift
    let abnormalCount = this.state.sensorNodes.filter(n => n.status === 'abnormal').length;
    const shouldForceAbnormal = abnormalCount === 0 && Math.random() < 0.3; // 30% chance to force one

    const updatedSensorNodes: SensorNode[] = this.state.sensorNodes.map((node) => {
      const history = this.state.sensorHistory[node.id] || [];
      const last = history.length > 0 ? history[history.length - 1] : null;

      // Get or initialize target
      let target = this.nodeTargets.get(node.id);
      if (!target) {
        target = { tempTarget: 24, humidTarget: 50 };
        this.nodeTargets.set(node.id, target);
      }

      // Drift target slowly (very slow random walk)
      target.tempTarget += (Math.random() - 0.5) * 0.1;
      target.humidTarget += (Math.random() - 0.5) * 0.2;
      // Clamp targets to realistic range
      target.tempTarget = Math.max(15, Math.min(40, target.tempTarget));
      target.humidTarget = Math.max(20, Math.min(80, target.humidTarget));

      let newTemp: number, newHumid: number;

      // If we need to force this node abnormal, set target out of range
      if (shouldForceAbnormal && node.id === this.state.sensorNodes[0].id) {
        // Force first node to abnormal
        newTemp = 33 + Math.random() * 4; // 33-37°C
        newHumid = 35 + Math.random() * 10; // 35-45%
        // Ensure it's abnormal
      } else {
        // Otherwise, random walk from last known value towards target
        const lastTemp = last ? last.temperature : node.temperature;
        const lastHumid = last ? last.humidity : node.humidity;
        // Step towards target with some noise
        const tempStep = (target.tempTarget - lastTemp) * 0.05 + (Math.random() - 0.5) * 0.3;
        const humidStep = (target.humidTarget - lastHumid) * 0.05 + (Math.random() - 0.5) * 0.5;
        newTemp = lastTemp + tempStep;
        newHumid = lastHumid + humidStep;
        // Clamp to realistic ranges
        newTemp = Math.max(15, Math.min(40, newTemp));
        newHumid = Math.max(20, Math.min(80, newHumid));
      }

      // Determine status based on thresholds
      const isNormal = newTemp >= 18 && newTemp <= 30 && newHumid >= 40 && newHumid <= 60;
      const status: 'normal' | 'abnormal' = isNormal ? 'normal' : 'abnormal';

      return {
        ...node,
        temperature: parseFloat(newTemp.toFixed(1)),
        humidity: parseFloat(newHumid.toFixed(1)),
        status,
      };
    });

    // Update histories
    const updatedSensorHistory: SensorHistory = {};
    updatedSensorNodes.forEach((node) => {
      const history = this.state.sensorHistory[node.id] || [];
      const newPoint: TimePoint = {
        timestamp: newTimestamp,
        temperature: node.temperature,
        humidity: node.humidity,
      };
      const newHistory = [...history.slice(1), newPoint];
      updatedSensorHistory[node.id] = newHistory;
    });

    // ---- Update streams (unchanged) ----
    const updatedStreams = this.state.streams.map((stream) => {
      const rateChange = 1 + (Math.random() - 0.5) * 0.1;
      let newRate = Math.round(stream.eventsPerSecond * rateChange);
      newRate = Math.max(100, newRate);
      const newDrops = Math.random() > 0.85 ? Math.floor(Math.random() * 5) : 0;
      const newPeak = Math.max(stream.peakRatePerSecond, newRate);
      const newBuffer = parseFloat(
        Math.max(0.5, Math.min(95, stream.bufferUtilizationPercent + (Math.random() - 0.5) * 1.5)).toFixed(1)
      );
      return {
        ...stream,
        eventsPerSecond: newRate,
        dropsPerSecond: stream.dropsPerSecond + newDrops,
        peakRatePerSecond: newPeak,
        bufferUtilizationPercent: newBuffer,
      };
    });

    // ---- Assemble new state ----
    this.state = {
      ...this.state,
      metrics: {
        ...this.state.metrics,
        uptimeSeconds: nextUptime,
      },
      sensorNodes: updatedSensorNodes,
      sensorHistory: updatedSensorHistory,
      streams: updatedStreams,
    };

    this.notifyListeners();
  }

  private startSimulation() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.updateCycle();
    }, this.state.settings.telemetryIntervalMs);
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
    if (settings.telemetryIntervalMs !== undefined) {
      this.startSimulation();
    }
    this.notifyListeners();
  }

  public triggerConnection(status: 'connected' | 'connecting' | 'disconnected'): void {
    this.state = {
      ...this.state,
      metrics: {
        ...this.state.metrics,
        connectionStatus: status,
      },
    };
    this.notifyListeners();
  }

  public exportLogs(): string {
    const logDump = {
      exportedAt: new Date().toISOString(),
      app: 'EZTNOW Monitor',
      version: '0.0.1',
      uptimeSeconds: this.state.metrics.uptimeSeconds,
      connectionUrl: this.state.settings.connectionUrl,
      sensorNodes: this.state.sensorNodes.map((n) => ({
        id: n.id,
        name: n.name,
        temperature: n.temperature,
        humidity: n.humidity,
        status: n.status,
      })),
      streams: this.state.streams.map((s) => ({
        id: s.id,
        name: s.name,
        eventsPerSecond: s.eventsPerSecond,
        dropsPerSecond: s.dropsPerSecond,
        subscribers: s.subscribers,
        bufferUtilizationPercent: s.bufferUtilizationPercent,
      })),
    };
    return JSON.stringify(logDump, null, 2);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}