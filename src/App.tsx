/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GlassWater, BarChart3, Settings, Trophy, AlertCircle, Sparkles, Check, HelpCircle, User, BellRing
} from 'lucide-react';
import { ApplicationState, DbUser, DbWaterLog, DbReminder, DbAchievement } from './types';
import { loadState, saveState, checkAchievements, calculateStreak } from './utils/storage';
import { playWaterSound } from './utils/audio';

import Dashboard from './components/Dashboard';
import StatsView from './components/StatsView';
import SettingsView from './components/SettingsView';
import RemindersOverlay from './components/RemindersOverlay';

export default function App() {
  const [state, setState] = useState<ApplicationState | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'settings'>('dashboard');
  
  // Custom Toast notification for achievement badges unlocked
  const [activeBadgeToast, setActiveBadgeToast] = useState<DbAchievement | null>(null);

  // Load state on mount
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
  }, []);

  // Handler to register a new water log
  const handleAddLog = (amountMl: number) => {
    if (!state) return;

    const newLog: DbWaterLog = {
      log_id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user_id: state.user.user_id,
      amount_ml: amountMl,
      timestamp: new Date().toISOString()
    };

    const updatedLogs = [newLog, ...state.logs];

    // Build intermediate state to test badges
    const intermediateState = {
      ...state,
      logs: updatedLogs
    };

    // Calculate badges
    const { unlockedNew, updatedAchievements } = checkAchievements(intermediateState);

    // If new badge is unlocked, pop beautiful Toast
    if (unlockedNew.length > 0) {
      setActiveBadgeToast(unlockedNew[0]);
      setTimeout(() => setActiveBadgeToast(null), 5000);
    }

    const nextState = {
      ...state,
      logs: updatedLogs,
      achievements: updatedAchievements
    };

    setState(nextState);
    saveState(nextState);
  };

  // Handler to add logs from oz quick presets
  const handleQuickPresetAdd = (amount: number, isOz: boolean) => {
    if (!state) return;
    
    let amtMl = amount;
    if (isOz) {
      // 1 oz to ml
      amtMl = Math.round(amount * 29.5735);
    }
    handleAddLog(amtMl);
  };

  // Handler to delete a log
  const handleDeleteLog = (logId: string) => {
    if (!state) return;

    const updatedLogs = state.logs.filter(l => l.log_id !== logId);

    const nextState = {
      ...state,
      logs: updatedLogs
    };

    setState(nextState);
    saveState(nextState);
  };

  // Handler to save settings page changes
  const handleSaveSettings = (updatedUser: DbUser, updatedReminders: DbReminder[]) => {
    if (!state) return;

    const intermediateState = {
      ...state,
      user: updatedUser,
      reminders: updatedReminders
    };

    // Recheck streak & badges with new goals
    const { unlockedNew, updatedAchievements } = checkAchievements(intermediateState);

    if (unlockedNew.length > 0) {
      setActiveBadgeToast(unlockedNew[0]);
      setTimeout(() => setActiveBadgeToast(null), 5000);
    }

    const nextState = {
      ...state,
      user: updatedUser,
      reminders: updatedReminders,
      achievements: updatedAchievements
    };

    setState(nextState);
    saveState(nextState);
  };

  // Register in-app snooze logging
  const handleRegisterSnooze = (minutes: number) => {
    // optional analytic tracking or simple visual feedback trigger
    console.log(`[Hydration Scheduler] Snoozed alert for ${minutes} seconds`);
  };

  // Direct Admin override: Clear everything
  const handleClearAllData = () => {
    localStorage.removeItem('h2o_reminder_app_state');
    // Force re-seed and refresh
    window.location.reload();
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-slate-500 mt-4 tracking-wider uppercase">Loading database assets...</span>
      </div>
    );
  }

  // Calculate global statistics pointers
  const { currentStreak, longestStreak } = calculateStreak(state.logs, state.user.daily_goal);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between" id="app-root-container">
      
      {/* GLOBAL ACHIEVEMENT TOAST NOTIFIER */}
      <AnimatePresence>
        {activeBadgeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 max-w-md w-full bg-slate-900 border-2 border-yellow-500/40 rounded-2xl p-4 shadow-2xl z-50 flex items-center space-x-3 backdrop-blur-md select-none"
            id="badge-toast-alert"
          >
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl border border-yellow-500/30 text-2xl flex items-center justify-center animate-bounce">
              ⭐
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-yellow-400 font-sans tracking-widest uppercase font-bold">New Badge Unlocked!</span>
              <h5 className="text-xs font-bold font-sans text-slate-100 leading-tight mt-0.5">{activeBadgeToast.badge_name}</h5>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{activeBadgeToast.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER BRAND LOGO */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl animate-pulse">💧</span>
            <div>
              <span className="text-sm font-sans font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-sky-400 to-teal-300 bg-clip-text text-transparent">
                HydroReminder
              </span>
              <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-widest leading-none mt-0.5">
                Offline Hydration Log
              </span>
            </div>
          </div>

          {/* Quick Info state indicator */}
          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[10px] text-slate-500">Local DB Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8" id="application-body-view">
        
        {/* TOP LEVEL NAVIGATION BARS */}
        <div className="flex justify-center" id="tab-controls-root">
          <div className="inline-flex bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-5 py-3 rounded-xl text-xs font-sans font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GlassWater className="w-4 h-4" />
              Tracker Dashboard
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`px-5 py-3 rounded-xl text-xs font-sans font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Trends & Badges
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-5 py-3 rounded-xl text-xs font-sans font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              Preferences
            </button>
          </div>
        </div>

        {/* ACTIVE SUB VIEW ROUTER */}
        <div className="focus:outline-none" id="primary-view-container">
          {activeTab === 'dashboard' && (
            <Dashboard
              user={state.user}
              logs={state.logs}
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              onAddLog={handleAddLog}
              onDeleteLog={handleDeleteLog}
              onQuickPresetAdd={handleQuickPresetAdd}
            />
          )}

          {activeTab === 'stats' && (
            <StatsView
              user={state.user}
              logs={state.logs}
              achievements={state.achievements}
              onClearAllData={handleClearAllData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={state.user}
              reminders={state.reminders}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </div>

      </main>

      {/* FOOTER AREA CONTAINING REMINDERS & SCHEDULERS SIMULATIONS */}
      <footer className="border-t border-slate-900 bg-slate-950 py-5 px-4 mt-12 space-y-4" id="app-footer-bar">
        
        {/* Integrated in-app scheduling helper overlay */}
        <div className="max-w-7xl mx-auto">
          <RemindersOverlay
            user={state.user}
            reminders={state.reminders}
            onLogWaterDirect={handleAddLog}
            onRegisterSnooze={handleRegisterSnooze}
          />
        </div>

        <div className="text-center text-[10px] text-slate-600 font-sans tracking-wide max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
          <span>
            © 2026 HydroReminder Offline App • Structured client-side local database representation (Users, Logs, Reminders).
          </span>
          <span className="flex items-center gap-1">
            Build Status: <span className="text-emerald-500">• Ready & Secure</span>
          </span>
        </div>
      </footer>

    </div>
  );
}
