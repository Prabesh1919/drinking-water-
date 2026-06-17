/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, Plus, Trash2, Sparkles, Coffee, CupSoda, Info, CalendarCheck, ChevronsUp, RefreshCw
} from 'lucide-react';
import { DbUser, DbWaterLog } from '../types';
import { formatWaterAmount, mlToOz, ozToMl, QUICK_LOG_PRESETS } from '../utils/storage';
import { playWaterSound, triggerVibration } from '../utils/audio';

interface DashboardProps {
  user: DbUser;
  logs: DbWaterLog[];
  currentStreak: number;
  longestStreak: number;
  onAddLog: (amountMl: number) => void;
  onDeleteLog: (logId: string) => void;
  onQuickPresetAdd: (amount: number, isOz: boolean) => void;
}

export default function Dashboard({
  user,
  logs,
  currentStreak,
  longestStreak,
  onAddLog,
  onDeleteLog,
  onQuickPresetAdd
}: DashboardProps) {
  const [customAmountStr, setCustomAmountStr] = useState('');
  const [showCelebrate, setShowCelebrate] = useState(false);

  // Group today's logs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs
    .filter(log => log.timestamp.split('T')[0] === todayStr)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Calculates today's intake
  const todayTotalMl = todayLogs.reduce((sum, log) => sum + log.amount_ml, 0);
  
  // Calculate goal targets based on unit
  const goalMl = user.units === 'ml' ? user.daily_goal : ozToMl(user.daily_goal);
  const percentComplete = Math.min(100, Math.round((todayTotalMl / goalMl) * 100));

  // Determine standard display strings
  const displayTotal = user.units === 'ml' ? `${todayTotalMl} ml` : `${mlToOz(todayTotalMl)} oz`;
  const displayGoal = user.units === 'ml' ? `${user.daily_goal} ml` : `${user.daily_goal} oz`;

  // Get dynamic motivational message
  const getMotivationalMessage = () => {
    if (percentComplete === 0) return "Sleep refreshed? Let's kick start your body with a brisk glass of cold water!";
    if (percentComplete < 25) return "Great start! Hydrating first thing stimulates digestion and ignites brain clarity.";
    if (percentComplete < 50) return "You are doing wonderful! Keep taking small, periodic sips to stay sharply energized.";
    if (percentComplete < 75) return "Over half-way! You are safely safeguarding yourself from fatigue and headaches.";
    if (percentComplete < 100) return "So close now! Just a couple more sips to secure your flawless hydration rank today!";
    return "Goal complete! Unrivaled discipline. Your cells are fully oxygenated, vibrant, and energetic.";
  };

  // Quick Preset options
  const presets = user.units === 'ml' ? QUICK_LOG_PRESETS.ml : QUICK_LOG_PRESETS.oz;

  const handleQuickAdd = (amount: number) => {
    onQuickPresetAdd(amount, user.units === 'oz');
    
    // Play organic feedback
    if (user.sound_pref) {
      playWaterSound(user.sound_pref);
    }
    if (user.vibration_enabled) {
      triggerVibration();
    }

    // Goal reached celebration trigger
    const newTotal = todayTotalMl + (user.units === 'oz' ? ozToMl(amount) : amount);
    if (newTotal >= goalMl && todayTotalMl < goalMl) {
      setShowCelebrate(true);
      playWaterSound('sparkle');
      setTimeout(() => setShowCelebrate(false), 5000);
    }
  };

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customAmountStr, 10);
    if (isNaN(parsed) || parsed <= 0) return;

    let amtMl = parsed;
    if (user.units === 'oz') {
      amtMl = ozToMl(parsed);
    }

    onAddLog(amtMl);
    setCustomAmountStr('');

    // Audio/tactile feedback
    if (user.sound_pref) {
      playWaterSound(user.sound_pref);
    }
    if (user.vibration_enabled) {
      triggerVibration();
    }

    // Celebration check
    if (todayTotalMl + amtMl >= goalMl && todayTotalMl < goalMl) {
      setShowCelebrate(true);
      playWaterSound('sparkle');
      setTimeout(() => setShowCelebrate(false), 5000);
    }
  };

  return (
    <div className="space-y-8" id="dashboard-tab-panel">
      {/* Target celebration screen overlay */}
      <AnimatePresence>
        {showCelebrate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-blue-900/90 flex flex-col items-center justify-center z-50 text-center p-6 backdrop-blur-sm"
            onClick={() => setShowCelebrate(false)}
            id="celebration-overlay"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              className="max-w-md bg-slate-900 border border-teal-500/30 rounded-3xl p-8 shadow-2xl space-y-4"
            >
              <div className="text-6xl animate-bounce">🏆</div>
              <h2 className="text-3xl font-sans font-bold text-white tracking-tight">Hydration Goal Met!</h2>
              <p className="text-teal-200">
                You've successfully secured your {displayGoal} target today, maintaining your streak of{' '}
                <span className="text-yellow-400 font-bold font-mono text-xl">{currentStreak}</span> consecutive days.
              </p>
              <div className="text-sm text-slate-400 italic">"Pure water is the world's first and foremost medicine."</div>
              <button
                className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-slate-950 font-bold rounded-full shadow-lg transition-transform transform hover:scale-105 active:scale-95 cursor-pointer"
                onClick={() => setShowCelebrate(false)}
              >
                Continue Hydrating
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Card containing Streaks */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 flex flex-wrap gap-4 items-center justify-between shadow-xl" id="streak-header-card">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
            <span className="text-2xl">🌱</span>
          </div>
          <div>
            <h1 className="text-lg font-sans font-bold text-slate-100 flex items-center gap-1.5">
              Welcome, Hydrator
            </h1>
            <p className="text-xs text-slate-400">Keep up the premium rhythm today</p>
          </div>
        </div>

        {/* Streaks Counters */}
        <div className="flex space-x-4 items-center" id="dashboard-streak-metrics">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2 flex items-center space-x-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
            <div>
              <div className="text-[10px] text-amber-300 font-sans tracking-wide uppercase font-medium">Current Streak</div>
              <div className="text-base font-bold font-mono text-amber-400 leading-none">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</div>
            </div>
          </div>

          <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl px-4 py-2 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-400 animate-spin" style={{ animationDuration: '6s' }} />
            <div>
              <div className="text-[10px] text-teal-300 font-sans tracking-wide uppercase font-medium">Personal Best</div>
              <div className="text-base font-bold font-mono text-teal-400 leading-none">{longestStreak} days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body: Fill Water Wave visualizer and Side panel controls in adaptive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* WAVE CONTAINER GRID VIEW - 5 cols */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 shadow-xl text-center relative overflow-hidden" id="liquid-wave-container-card">
          <h3 className="text-xs uppercase font-sans tracking-widest text-slate-400 mb-6 font-semibold">Today's Progress</h3>

          {/* Liquid Ring Animation and Wave physically rising */}
          <div className="relative w-64 h-64 rounded-full border-4 border-slate-800 flex items-center justify-center overflow-hidden bg-slate-950 shadow-inner group">
            
            {/* Inner dynamic filling layer */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-700 via-blue-500 to-teal-400 transition-all duration-1000 ease-out"
              style={{ height: `${percentComplete}%` }}
              id="water-level-fill"
            >
              {/* Subtle scrolling waves inside using CSS vector lines */}
              <div className="absolute top-0 left-0 right-0 -translate-y-[15px] h-4 overflow-hidden select-none pointer-events-none opacity-40">
                <svg viewBox="0 0 120 28" className="w-[300%] h-full fill-teal-300 animate-[wave_6s_infinite_linear]">
                  <path d="M0 15 Q 30 0, 60 15 T 120 15 T 180 15 T 240 15 v 15 h -240 z" />
                </svg>
              </div>
              <div className="absolute top-0 left-0 right-0 -translate-y-[12px] h-4 overflow-hidden select-none pointer-events-none opacity-60">
                <svg viewBox="0 0 120 28" className="w-[300%] h-full fill-blue-400 animate-[wave_4s_infinite_linear_reverse]">
                  <path d="M0 15 Q 30 0, 60 15 T 120 15 T 180 15 T 240 15 v 15 h -240 z" />
                </svg>
              </div>

              {/* Rising Air bubbles effect inside liquid */}
              {percentComplete > 0 && (
                <div className="absolute inset-0 overflow-hidden opacity-30">
                  <span className="absolute bottom-2 left-[20%] w-2 h-2 rounded-full bg-white animate-[float_4s_infinite] opacity-60"></span>
                  <span className="absolute bottom-4 left-[50%] w-3 h-3 rounded-full bg-white animate-[float_5s_infinite_1.5s] opacity-40"></span>
                  <span className="absolute bottom-6 left-[80%] w-1.5 h-1.5 rounded-full bg-white animate-[float_3.5s_infinite_0.8s] opacity-50"></span>
                </div>
              )}
            </div>

            {/* Float values inside the Center */}
            <div className="relative z-10 select-none flex flex-col items-center">
              <span className={`text-4xl font-mono font-extrabold tracking-tight transition-all duration-300 ${percentComplete > 45 ? 'text-slate-950 drop-shadow-sm' : 'text-slate-100'}`}>
                {percentComplete}%
              </span>
              <span className={`text-xs font-medium mt-1 font-mono uppercase tracking-widest ${percentComplete > 45 ? 'text-slate-950/80' : 'text-slate-400'}`}>
                Reached
              </span>
              <span className={`text-[10px] italic mt-2 ${percentComplete > 45 ? 'text-blue-950/90' : 'text-slate-500'}`}>
                {displayTotal} / {displayGoal}
              </span>
            </div>
          </div>

          <p className="text-sm font-sans text-slate-300 mt-6 leading-relaxed max-w-xs h-12" id="motivational-message">
            "{getMotivationalMessage()}"
          </p>
        </div>

        {/* CONTROLS AND HISTORY LISTS - 7 cols */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Quick Add presets */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl" id="preset-add-card">
            <h3 className="text-xs uppercase font-sans tracking-wide text-slate-400 mb-4 font-semibold flex items-center gap-2">
              <ChevronsUp className="w-4 h-4 text-blue-400" />
              Quick Logging Serving Sizes
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="preset-add-grid">
              {presets.map((presetValue) => {
                let label = '';
                let iconCode = '💧';

                if (user.units === 'ml') {
                  if (presetValue >= 1000) {
                    label = `${presetValue / 1000}L Flask`;
                    iconCode = '🧴';
                  } else if (presetValue >= 500) {
                    label = `${presetValue}ml bottle`;
                    iconCode = '🥤';
                  } else if (presetValue >= 250) {
                    label = `${presetValue}ml mug`;
                    iconCode = '☕';
                  } else {
                    label = `${presetValue}ml cup`;
                    iconCode = '🥛';
                  }
                } else {
                  // Ounces
                  if (presetValue >= 32) {
                    label = 'Flask (32 oz)';
                    iconCode = '🧴';
                  } else if (presetValue >= 16) {
                    label = 'Bottle (16 oz)';
                    iconCode = '🥤';
                  } else if (presetValue >= 12) {
                    label = 'Mug (12 oz)';
                    iconCode = '☕';
                  } else {
                    label = 'Cup (8 oz)';
                    iconCode = '🥛';
                  }
                }

                return (
                  <button
                    key={presetValue}
                    onClick={() => handleQuickAdd(presetValue)}
                    className="group bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/70 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm relative overflow-hidden active:scale-95 transition-all text-center cursor-pointer"
                  >
                    {/* Ring background pulse */}
                    <span className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />

                    <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{iconCode}</span>
                    <span className="text-white font-mono font-bold text-sm">
                      +{presetValue} {user.units}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans truncate w-full">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Log input form */}
            <form onSubmit={handleCustomAdd} className="mt-6 pt-5 border-t border-slate-800/60 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={customAmountStr}
                  onChange={(e) => setCustomAmountStr(e.target.value)}
                  placeholder={`Log custom amount (in ${user.units})...`}
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500 uppercase">
                  {user.units}
                </span>
              </div>
              <button
                type="submit"
                disabled={!customAmountStr}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 text-sm font-sans font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Save
              </button>
            </form>
          </div>

          {/* Today's logged history feed */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl" id="recent-logs-feed">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs uppercase font-sans tracking-wide text-slate-400 font-semibold flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                Today's Water Entries
              </h3>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {todayLogs.length} logged
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar" id="today-logs-list">
              <AnimatePresence initial={false}>
                {todayLogs.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl space-y-1"
                  >
                    <div>💦 Empty vessel!</div>
                    <div>No water entries recorded yet for today.</div>
                  </motion.div>
                ) : (
                  todayLogs.map((log) => {
                    const timeString = new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    // Format log entry based on target units
                    const displayAmount = formatWaterAmount(log.amount_ml, user.units);

                    return (
                      <motion.div
                        key={log.log_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between bg-slate-900/80 border border-slate-850 hover:border-slate-800 p-3 rounded-xl shadow-sm transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/25">
                            <span className="text-base">💧</span>
                          </div>
                          <div>
                            <span className="text-slate-100 font-bold font-mono text-sm leading-tight block">
                              {displayAmount}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                              Recorded at {timeString}
                            </span>
                          </div>
                        </div>

                        {/* Hover delete button */}
                        <button
                          onClick={() => onDeleteLog(log.log_id)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          title="Delete core entry"
                          id={`delete-log-${log.log_id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
