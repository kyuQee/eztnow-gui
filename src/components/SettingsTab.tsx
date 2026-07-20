/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTelemetry } from '../services/TelemetryContext';
import {
  Settings,
  Cpu,
  Download,
  Info,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Save,
  Radio,
  FileCode,
} from 'lucide-react';
import { motion } from 'motion/react';

export const SettingsTab: React.FC = () => {
  const { state, updateSettings, exportLogs } = useTelemetry();
  const { settings, metrics } = state;

  const [urlInput, setUrlInput] = useState(settings.connectionUrl);
  const [intervalInput, setIntervalInput] = useState(settings.telemetryIntervalMs);
  const [autoReconnectInput, setAutoReconnectInput] = useState(settings.autoReconnect);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      connectionUrl: urlInput,
      telemetryIntervalMs: intervalInput,
      autoReconnect: autoReconnectInput,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExport = () => {
    const logData = exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mawmaw-telemetry-dump-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-white/80 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-900/80 dark:border-neutral-700/60 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <form onSubmit={handleSave}>
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-neutral-100 dark:border-neutral-700">
            <div>
              <h2 className="text-sm font-semibold tracking-wider text-neutral-800 dark:text-neutral-200 uppercase font-sans flex items-center gap-2">
                <Settings className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                ENGINE PARAMETERS
              </h2>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans mt-0.5">
                Configure runtime diagnostics pipelines, socket bindings, and thread intervals
              </p>
            </div>
            {saveSuccess && (
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800 rounded-sm font-semibold uppercase animate-fade-in">
                Applied Successfully
              </span>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider font-sans">
                SOCKET CONNECTION STRING (URL)
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 rounded-lg px-3.5 py-2 font-mono text-xs text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:border-neutral-900 dark:focus:border-neutral-400 focus:bg-white dark:focus:bg-neutral-700 transition-all"
                placeholder="ws://127.0.0.1:3000/telemetry"
              />
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic">
                Binds the client telemetry receiver to the C++ WebSockets dispatcher.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider font-sans">
                  TELEMETRY INTERPOLATION REFRESH
                </label>
                <span className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {intervalInput} ms
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="500"
                value={intervalInput}
                onChange={(e) => setIntervalInput(Number(e.target.value))}
                className="w-full accent-neutral-900 dark:accent-neutral-400 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-neutral-400 dark:text-neutral-500">
                <span>500ms (High Speed)</span>
                <span>5000ms (Power Saver)</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-y border-neutral-100 dark:border-neutral-700">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 font-sans">
                  Auto-Reconnect on Dropped Sockets
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  Automatically retries connecting on SIGPIPE or connection timeouts.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoReconnectInput(!autoReconnectInput)}
                className={`w-11 h-6 rounded-full p-1 transition-all focus:outline-hidden ${
                  autoReconnectInput ? 'bg-[#C7F000]' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                <div
                  className={`bg-white dark:bg-neutral-300 w-4 h-4 rounded-full shadow-md transform transition-all ${
                    autoReconnectInput ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 font-sans">
                  Color Theme Configuration
                </span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  Currently running calibrated Light Mode (Arknights Endfield specs).
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase bg-[#C7F000]/10 text-neutral-700 dark:text-neutral-300 dark:bg-[#C7F000]/20 px-2 py-1 rounded-sm border border-[#C7F000]/20">
                INDUSTRIAL LIGHT
              </span>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-neutral-100 dark:border-neutral-700 flex justify-between gap-4">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black font-semibold text-xs px-4 py-2.5 rounded-lg border border-neutral-900 dark:border-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Diagnost Logs
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 bg-[#C7F000] text-black font-semibold text-xs px-5 py-2.5 rounded-lg border border-neutral-900/10 hover:opacity-90 transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" /> Apply Configuration
            </button>
          </div>
        </form>
      </div>

      <div className="w-full lg:w-[360px] bg-white/80 backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-900/80 dark:border-neutral-700/60 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 dark:border-neutral-700 pb-3">
            <Info className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
            <h2 className="text-sm font-semibold tracking-wider text-neutral-800 dark:text-neutral-200 uppercase font-sans">
              ABOUT MAWMAW
            </h2>
          </div>

          <div className="space-y-4 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
            <p>
              <strong className="text-neutral-800 dark:text-neutral-200">MAWMAW</strong> is a high-frequency, lock-free, ultra-low latency event routing and processing engine programmed in native C++20.
            </p>
            <p>
              Designed for high-throughput messaging pipelines, MAWMAW utilizes physical ring buffer backends and isolates user filtration scripts inside secure, JIT-compiled WebAssembly and fast Python PyBind11 environments.
            </p>

            <div className="bg-neutral-50 border border-neutral-200/40 dark:bg-neutral-800/50 dark:border-neutral-700/40 rounded-lg p-3 space-y-2 mt-4 font-mono text-[10px]">
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold block uppercase border-b border-neutral-200/60 dark:border-neutral-700/60 pb-1 mb-1">
                COMPILER PROFILE
              </span>
              <div className="flex justify-between">
                <span className="text-neutral-400 dark:text-neutral-500">CXX Compiler:</span>
                <span className="text-neutral-800 dark:text-neutral-200">GCC 13.2 / Clang 17</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 dark:text-neutral-500">Optimization:</span>
                <span className="text-neutral-800 dark:text-neutral-200">-O3 -march=native</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 dark:text-neutral-500">Memory Engine:</span>
                <span className="text-neutral-800 dark:text-neutral-200">jemalloc / Lock-Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 dark:text-neutral-500">Target Pipeline:</span>
                <span className="text-neutral-800 dark:text-neutral-200">SIMD-AVX512 / CUDA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-700 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-sans">
            <span className="text-neutral-400 dark:text-neutral-500">License:</span>
            <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">Apache-2.0 OpenSource</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-sans">
            <span className="text-neutral-400 dark:text-neutral-500">Developer Contact:</span>
            <span className="font-mono text-[#2EC5FF] hover:underline flex items-center gap-1 cursor-pointer">
              pmvx85@gmail.com <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};