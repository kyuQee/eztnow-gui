/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTelemetry } from '../services/TelemetryContext';
import { ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';

export const Header: React.FC = () => {
  const { state, setConnectionStatus } = useTelemetry();
  const { connectionStatus, uptimeSeconds } = state.metrics;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (mins > 0 || hours > 0 || days > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  };

  return (
    <header className="w-full bg-white/70 backdrop-blur-md border-b border-neutral-200/60 sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Brand Identity / Logo */}
      <div className="flex items-center gap-4">
        {/* Crisp industrial label logo */}
        <div className="bg-[#C7F000] text-black font-sans font-bold text-lg tracking-widest px-3 py-1.5 flex items-center justify-center select-none border border-neutral-900/10">
          EZTNOW
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">MONITOR</h1>
            <span className="text-[10px] font-mono bg-neutral-200/60 text-neutral-600 px-1.5 py-0.5 rounded-xs tracking-wider">v0.0.1</span>
          </div>
        </div>
      </div>

      {/* Uptime only (removed other status details) */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-sans text-neutral-600">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400 font-medium">UPTIME:</span>
          <span className="font-mono text-neutral-800 font-semibold">{formatUptime(uptimeSeconds)}</span>
        </div>
      </div>

      {/* Right control panel – only connection status, no toggle buttons */}
      <div className="flex items-center gap-3">
        {/* Connection pill */}
        <div className="flex items-center gap-2 bg-neutral-100/80 border border-neutral-200/50 px-3 py-1.5 rounded-full select-none text-xs font-sans">
          {connectionStatus === 'connected' && (
            <>
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-2.5 h-2.5 rounded-full bg-[#C7F000]"
              />
              <span className="text-neutral-800 font-semibold flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-neutral-800" /> Connected
              </span>
            </>
          )}
          {connectionStatus === 'connecting' && (
            <>
              <motion.span
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                className="w-2.5 h-2.5 rounded-full bg-amber-400"
              />
              <span className="text-amber-700 font-semibold">Connecting...</span>
            </>
          )}
          {connectionStatus === 'disconnected' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5 text-red-500" /> Offline
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};