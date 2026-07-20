// components/DashboardTab.tsx
import React, { useState } from 'react';
import { useTelemetry } from '../services/TelemetryContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Thermometer, Droplet } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DashboardTab: React.FC = () => {
  const { state } = useTelemetry();
  const { sensorNodes, sensorHistory, metrics } = state;
  const [selectedNodeId, setSelectedNodeId] = useState<string>(sensorNodes[0]?.id || '');
  const { theme } = useTheme();

  const selectedHistory = sensorHistory[selectedNodeId] || [];
  const selectedNode = sensorNodes.find(n => n.id === selectedNodeId);

  const chartMargin = { top: 10, right: 20, left: 0, bottom: 0 };

  // Chart colours depend on theme
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#333333' : '#E5E5E5';
  const tickColor = isDark ? '#999999' : '#737373';
  const tickColorY = isDark ? '#999999' : '#404040';
  const tooltipBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#333333' : '#E5E5E5';
  const tooltipText = isDark ? '#E5E5E5' : '#111111';

  return (
    <div className="flex h-full gap-6">
      {/* Left column: 2/3 width, two charts stacked */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
        {/* Temperature Chart */}
        <div className="flex-1 bg-white/80 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-900/80 dark:border-neutral-700/60 rounded-xl p-4 shadow-xs min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold tracking-wider text-neutral-800 dark:text-neutral-200 uppercase flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-neutral-600 dark:text-neutral-400" /> Temperature (°C) – {selectedNode?.name || 'Unknown'}
            </h3>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Real-time</span>
          </div>
          <div className="h-[calc(100%-2rem)] w-full relative">
            {/* Temperature stat card */}
            {selectedNode && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-800/90 dark:border-neutral-700/60 rounded-lg px-3 py-2 shadow-md flex items-center gap-1.5 z-10">
                <Thermometer className="w-3.5 h-3.5 text-[#C7F000]" />
                <span className="font-mono text-sm font-bold text-neutral-800 dark:text-neutral-100">
                  {selectedNode.temperature}°C
                </span>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selectedHistory} margin={chartMargin}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C7F000" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#C7F000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: tickColor, fontSize: 9 }}
                  dy={6}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: tickColorY, fontSize: 9 }}
                  dx={-4}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className={`${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-900 border-neutral-800 text-white'} border rounded-lg p-3 shadow-lg`}>
                          <span className="text-[10px] text-neutral-400 block mb-1">{data.timestamp}</span>
                          <span className="font-mono text-sm font-bold text-[#C7F000]">{data.temperature} °C</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#C7F000"
                  strokeWidth={2}
                  fill="url(#tempGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Humidity Chart */}
        <div className="flex-1 bg-white/80 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-900/80 dark:border-neutral-700/60 rounded-xl p-4 shadow-xs min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold tracking-wider text-neutral-800 dark:text-neutral-200 uppercase flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-neutral-600 dark:text-neutral-400" /> Humidity (%) – {selectedNode?.name || 'Unknown'}
            </h3>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Real-time</span>
          </div>
          <div className="h-[calc(100%-2rem)] w-full relative">
            {/* Humidity stat card */}
            {selectedNode && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-800/90 dark:border-neutral-700/60 rounded-lg px-3 py-2 shadow-md flex items-center gap-1.5 z-10">
                <Droplet className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span className="font-mono text-sm font-bold text-neutral-800 dark:text-neutral-100">
                  {selectedNode.humidity}%
                </span>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selectedHistory} margin={chartMargin}>
                <defs>
                  <linearGradient id="humidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#666666" : "#737373"} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={isDark ? "#666666" : "#737373"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: tickColor, fontSize: 9 }}
                  dy={6}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: tickColorY, fontSize: 9 }}
                  dx={-4}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className={`${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-900 border-neutral-800 text-white'} border rounded-lg p-3 shadow-lg`}>
                          <span className="text-[10px] text-neutral-400 block mb-1">{data.timestamp}</span>
                          <span className="font-mono text-sm font-bold text-neutral-300">{data.humidity} %</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="humidity"
                  stroke={isDark ? "#888888" : "#525252"}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  fill="url(#humidGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right column: 1/3 width, scrollable node list */}
      <div className="w-1/3 bg-white/80 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-900/80 dark:border-neutral-700/60 rounded-xl p-4 shadow-xs overflow-y-auto flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-700 flex-shrink-0">
          <h2 className="text-sm font-semibold tracking-wider text-neutral-800 dark:text-neutral-200 uppercase">NODE PREVIEW</h2>
          <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">{sensorNodes.length} nodes</span>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {sensorNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isAbnormal = node.status === 'abnormal';
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`relative border rounded-lg p-3 flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#C7F000] ring-2 ring-[#C7F000]/10 bg-white dark:bg-neutral-800'
                    : isAbnormal
                      ? 'border-red-200/60 bg-red-50/30 dark:bg-red-950/30 dark:border-red-800/60 hover:bg-red-50/60 dark:hover:bg-red-950/50'
                      : 'border-neutral-200/60 bg-neutral-50/80 dark:border-neutral-700/60 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-700/50'
                }`}
              >
                <div>
                  <div className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">{node.name}</div>
                  <div className="flex gap-3 mt-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3" /> {node.temperature}°C
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplet className="w-3 h-3" /> {node.humidity}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      node.status === 'normal'
                        ? 'bg-[#C7F000] shadow-[0_0_6px_rgba(199,240,0,0.2)]'
                        : 'bg-red-500 shadow-[0_0_6px_rgba(255,0,0,0.15)]'
                    }`}
                    title={node.status === 'normal' ? 'Normal range' : 'Out of range'}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-700 flex-shrink-0">
          Normal range: Temp 18–30°C, Humidity 40–60%
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;