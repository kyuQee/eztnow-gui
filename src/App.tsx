/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TelemetryProvider } from './services/TelemetryContext';
import { Header } from './components/Header';
import DashboardTab from './components/DashboardTab';
import { TelemetryTab } from './components/TelemetryTab';
import { NodesTab } from './components/NodesTab';         
import { SettingsTab } from './components/SettingsTab';

// Icons
import {
  LayoutDashboard,
  Activity,
  GitBranch,
  Settings,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabId = 'dashboard' | 'telemetry' | 'nodes' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return (
    <TelemetryProvider>
      <div className="h-screen overflow-hidden bg-[#F5F6F8] text-neutral-900 flex flex-col font-sans select-none selection:bg-[#C7F000]/30 selection:text-neutral-900">
        
        {/* Sticky Top Header */}
        <Header />

        {/* Master Content Viewport – no scroll on page, inner scrolling only */}
        <main className="flex-1 overflow-hidden w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full"
            >
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'telemetry' && <TelemetryTab />}
              {activeTab === 'nodes' && <NodesTab />}
              {activeTab === 'settings' && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating Capsule Bottom Navigation Dock */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900/90 border border-neutral-800 backdrop-blur-md px-3 py-2.5 rounded-2xl shadow-xl flex items-center gap-1.5 z-50 select-none max-w-[90vw]">
          
          {/* Navigation Items */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-tight transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#C7F000] text-black font-bold shadow-sm border border-neutral-900/10'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-tight transition-all cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-[#C7F000] text-black font-bold shadow-sm border border-neutral-900/10'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('nodes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-tight transition-all cursor-pointer ${
              activeTab === 'nodes'
                ? 'bg-[#C7F000] text-black font-bold shadow-sm border border-neutral-900/10'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span className="hidden sm:inline">Nodes</span>
          </button>

          <div className="w-px h-5 bg-neutral-800 mx-1 hidden sm:block" />

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-tight transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#C7F000] text-black font-bold shadow-sm border border-neutral-900/10'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </nav>


      </div>
    </TelemetryProvider>
  );
}