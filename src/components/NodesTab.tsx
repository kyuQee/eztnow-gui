/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTelemetry } from '../services/TelemetryContext';
import { Thermometer, Droplet, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const NodesTab: React.FC = () => {
  const { state } = useTelemetry();
  const { sensorNodes, sensorHistory, metrics } = state;

  const lastUpdate =
    sensorHistory && Object.values(sensorHistory).length > 0
      ? Object.values(sensorHistory)[0]?.[Object.values(sensorHistory)[0]?.length - 1]?.timestamp
      : '--:--:--';

  return (
    <div className="h-full overflow-y-auto pb-4 pr-1">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-neutral-800 dark:text-neutral-200 uppercase">SENSOR NODES</h2>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans mt-0.5">
            {sensorNodes.length} nodes reporting • Last update: {lastUpdate}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-200/40 dark:border-neutral-700/40">
          <span className="w-2 h-2 rounded-full bg-[#C7F000] animate-pulse" />
          <span>{metrics.connectionStatus === 'connected' ? 'LIVE' : 'STANDBY'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {sensorNodes.map((node) => {
          const history = sensorHistory[node.id] || [];
          const latest = history.length > 0 ? history[history.length - 1] : null;
          const isNormal = node.status === 'normal';
          const StatusIcon = isNormal ? CheckCircle : XCircle;
          const statusColor = isNormal ? 'text-[#C7F000]' : 'text-red-500';

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white/80 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-900/80 dark:border-neutral-700/60 rounded-xl p-5 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-600 transition-all flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-neutral-900 dark:text-neutral-100">{node.name}</span>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-xs">
                    {node.id}
                  </span>
                </div>
                <StatusIcon className={`w-5 h-5 ${statusColor}`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-50/70 border border-neutral-200/40 dark:bg-neutral-800/50 dark:border-neutral-700/40 rounded-lg p-3 flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>Temperature</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                      {metrics.connectionStatus === 'connected' ? node.temperature : '--'}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">°C</span>
                  </div>
                  <div className="mt-1 h-1 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C7F000] rounded-full transition-all duration-500"
                      style={{
                        width: metrics.connectionStatus === 'connected'
                          ? `${Math.min(100, ((node.temperature - 15) / 25) * 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-1">
                    range 18–30°C
                  </span>
                </div>

                <div className="bg-neutral-50/70 border border-neutral-200/40 dark:bg-neutral-800/50 dark:border-neutral-700/40 rounded-lg p-3 flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                    <Droplet className="w-3.5 h-3.5" />
                    <span>Humidity</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                      {metrics.connectionStatus === 'connected' ? node.humidity : '--'}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">%</span>
                  </div>
                  <div className="mt-1 h-1 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C7F000] rounded-full transition-all duration-500"
                      style={{
                        width: metrics.connectionStatus === 'connected'
                          ? `${Math.min(100, ((node.humidity - 20) / 60) * 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-1">
                    range 40–60%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between text-[10px] font-sans">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isNormal ? 'bg-[#C7F000]' : 'bg-red-500'}`} />
                  <span className={`font-semibold ${isNormal ? 'text-[#C7F000]' : 'text-red-500'}`}>
                    {isNormal ? 'NORMAL' : 'ABNORMAL'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500">
                  <Clock className="w-3 h-3" />
                  <span>{latest?.timestamp || '--:--:--'}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {sensorNodes.length === 0 && (
        <div className="flex items-center justify-center h-64 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-400 dark:text-neutral-500 text-sm">
          No sensor nodes available.
        </div>
      )}
    </div>
  );
};