// components/TelemetryTab.tsx
import React from 'react';
import { useTelemetry } from '../services/TelemetryContext';
import { Layers, Activity, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const TelemetryTab: React.FC = () => {
  const { state } = useTelemetry();
  const { streams, sensorNodes, metrics } = state;

  const totalEps = streams.reduce((sum, s) => sum + s.eventsPerSecond, 0);
  const totalDrops = streams.reduce((sum, s) => sum + s.dropsPerSecond, 0);
  const activeStreams = streams.length;
  const connectedNodes = sensorNodes.length;
  const peakThroughput = streams.reduce((max, s) => Math.max(max, s.peakRatePerSecond), 0);

  const formatEps = (num: number) => {
    if (metrics.connectionStatus !== 'connected') return '---';
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 pb-4 pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {/* Card 1: Total Throughput */}
        <div className="bg-white/80 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-900/80 dark:border-neutral-700/60 rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C7F000]" />
          <div className="flex items-center justify-between text-neutral-400 dark:text-neutral-500">
            <span className="text-xs font-semibold tracking-wider font-sans uppercase">TOTAL THROUGHPUT</span>
            <Activity className="w-4 h-4 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <motion.div
              key={totalEps}
              initial={{ opacity: 0.8, y: -1 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tracking-tight"
            >
              {formatEps(totalEps)}
            </motion.div>
            <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 font-semibold uppercase">evt/s</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
              Peak: <span className="font-mono text-neutral-700 dark:text-neutral-300">{peakThroughput.toLocaleString()}</span>
            </span>
            <span className="text-[10px] font-mono bg-[#C7F000]/10 text-neutral-700 dark:text-neutral-300 dark:bg-[#C7F000]/20 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
              ACTIVE FLOW
            </span>
          </div>
        </div>

        {/* Card 2: Total Drops */}
        <div className="bg-white/80 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-900/80 dark:border-neutral-700/60 rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
          <div className={`absolute top-0 left-0 w-1.5 h-full ${totalDrops > 0 ? 'bg-red-500' : 'bg-[#C7F000]'}`} />
          <div className="flex items-center justify-between text-neutral-400 dark:text-neutral-500">
            <span className="text-xs font-semibold tracking-wider font-sans uppercase">TOTAL DROPS</span>
            <Zap className="w-4 h-4 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <motion.div
              key={totalDrops}
              initial={{ opacity: 0.8, y: -1 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-2xl font-bold font-mono tracking-tight ${totalDrops > 0 ? 'text-red-500' : 'text-neutral-900 dark:text-neutral-100'}`}
            >
              {metrics.connectionStatus === 'connected' ? totalDrops.toLocaleString() : '---'}
            </motion.div>
            <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 font-semibold uppercase">drops/s</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
              {totalDrops > 0 ? '⚠️ Packet loss detected' : '✅ No drops'}
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm font-semibold uppercase ${
              totalDrops > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-[#C7F000]/10 text-neutral-700 dark:text-neutral-300 dark:bg-[#C7F000]/20'
            }`}>
              {totalDrops > 0 ? 'LOSS' : 'OPTIMAL'}
            </span>
          </div>
        </div>

        {/* Card 3: Connected Nodes */}
        <div className="bg-white/80 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-900/80 dark:border-neutral-700/60 rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C7F000]" />
          <div className="flex items-center justify-between text-neutral-400 dark:text-neutral-500">
            <span className="text-xs font-semibold tracking-wider font-sans uppercase">CONNECTED NODES</span>
            <Layers className="w-4 h-4 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <motion.div
              key={connectedNodes}
              initial={{ opacity: 0.8, y: -1 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tracking-tight"
            >
              {metrics.connectionStatus === 'connected' ? connectedNodes : '---'}
            </motion.div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
              All nodes reporting
            </span>
            <span className="text-[10px] font-mono bg-[#C7F000]/10 text-neutral-700 dark:text-neutral-300 dark:bg-[#C7F000]/20 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
              ONLINE
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-900/80 dark:border-neutral-700/60 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-700">
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-neutral-800 dark:text-neutral-200 uppercase font-sans flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
              TELEMETRY SUMMARY
            </h2>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans mt-0.5">
              Aggregated metrics from all active streams and nodes
            </p>
          </div>
          <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 px-2 py-0.5 rounded-xs font-semibold uppercase">
            {metrics.connectionStatus === 'connected' ? 'LIVE' : 'STANDBY'}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
          <div>
            <span className="text-neutral-400 dark:text-neutral-500 block mb-1">Avg Events/sec per Stream</span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
              {metrics.connectionStatus === 'connected' ? Math.round(totalEps / (activeStreams || 1)).toLocaleString() : '---'}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 dark:text-neutral-500 block mb-1">Total Subscribers</span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
              {metrics.connectionStatus === 'connected' ? streams.reduce((sum, s) => sum + s.subscribers, 0) : '---'}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 dark:text-neutral-500 block mb-1">Avg Buffer Utilization</span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
              {metrics.connectionStatus === 'connected' ? `${Math.round(streams.reduce((sum, s) => sum + s.bufferUtilizationPercent, 0) / (activeStreams || 1))}%` : '---'}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 dark:text-neutral-500 block mb-1">Connected Sensors</span>
            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
              {metrics.connectionStatus === 'connected' ? sensorNodes.length : '---'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};