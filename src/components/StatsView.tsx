/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, TrendingUp, Calendar, CalendarRange, Clock, Sparkles, CheckCircle2, ChevronRight, Activity, Trash
} from 'lucide-react';
import { DbUser, DbWaterLog, DbAchievement } from '../types';
import { AVAILABLE_BADGES, formatWaterAmount, mlToOz, ozToMl, calculateStreak } from '../utils/storage';

interface StatsViewProps {
  user: DbUser;
  logs: DbWaterLog[];
  achievements: DbAchievement[];
  onClearAllData: () => void;
}

export default function StatsView({
  user,
  logs,
  achievements,
  onClearAllData
}: StatsViewProps) {
  const [selectedRange, setSelectedRange] = useState<'week' | 'month'>('week');

  // Today parsing
  const today = new Date();
  const goalMl = user.units === 'ml' ? user.daily_goal : ozToMl(user.daily_goal);

  // Group logs by absolute ISO date string YYYY-MM-DD
  const dailyTotals: Record<string, number> = {};
  logs.forEach(log => {
    try {
      const dateKey = log.timestamp.split('T')[0];
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + log.amount_ml;
    } catch (e) {
      // safe bypass
    }
  });

  // Calculate current and longest streaks
  const { currentStreak, longestStreak } = calculateStreak(logs, user.daily_goal);

  // --- STATS COMPUTATIONS ---
  // Averages for Last 7 days
  const getWeeklyStats = () => {
    let sum = 0;
    let daysWithLogsCount = 0;
    const dates: { label: string; dateStr: string; amountMl: number; percent: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const amountMl = dailyTotals[dateStr] || 0;
      sum += amountMl;
      if (amountMl > 0) daysWithLogsCount++;

      // Day of week labels (Mo, Tu, We, Th, Fr, Sa, Su)
      const dayLabel = d.toLocaleDateString([], { weekday: 'short' });
      dates.push({
        label: dayLabel,
        dateStr,
        amountMl,
        percent: Math.min(100, Math.round((amountMl / goalMl) * 100))
      });
    }

    const avgMl = Math.round(sum / 7);
    return {
      avgMl,
      dailyArray: dates
    };
  };

  // Aggregation for Last 30 days
  const getMonthlyStats = () => {
    let sum = 0;
    let daysWithLogsNewCount = 0;
    let daysGoalMet = 0;
    const slots: { dateStr: string; amountMl: number; met: boolean }[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const amountMl = dailyTotals[dateStr] || 0;
      const met = amountMl >= goalMl;
      
      sum += amountMl;
      if (amountMl > 0) daysWithLogsNewCount++;
      if (met) daysGoalMet++;

      slots.push({
        dateStr,
        amountMl,
        met
      });
    }

    const avgMl = Math.round(sum / 30);
    return {
      avgMl,
      daysGoalMet,
      activeDays: daysWithLogsNewCount,
      slots
    };
  };

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  const activeAvgMl = selectedRange === 'week' ? weeklyStats.avgMl : monthlyStats.avgMl;
  const activeAvgDisplay = user.units === 'ml' ? `${activeAvgMl} ml` : `${mlToOz(activeAvgMl)} oz`;

  return (
    <div className="space-y-8" id="stats-tab-panel">
      
      {/* Top statistics summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="stats-summary-grid">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 shadow-xl flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/25">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-sans">Period Average Daily</div>
            <div className="text-xl font-bold font-mono text-slate-200 mt-1">{activeAvgDisplay}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Based on your {selectedRange} tracker</div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 shadow-xl flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-sans">Goal Completion Rate</div>
            <div className="text-xl font-bold font-mono text-slate-200 mt-1">
              {Math.round((monthlyStats.daysGoalMet / 30) * 100)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{monthlyStats.daysGoalMet} of last 30 days met</div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 shadow-xl flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/25">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-sans">Badges Earned</div>
            <div className="text-xl font-bold font-mono text-slate-200 mt-1">
              {achievements.length} / {AVAILABLE_BADGES.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Keep hydrating to unlock more</div>
          </div>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl" id="charts-main-card">
        
        {/* Toggle Range buttons & Titles */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm uppercase font-sans tracking-wider text-slate-300 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Hydration Analytics
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Visual representation of daily wellness</p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
            <button
              onClick={() => setSelectedRange('week')}
              className={`px-4 py-1.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                selectedRange === 'week' 
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 Days Week
            </button>
            <button
              onClick={() => setSelectedRange('month')}
              className={`px-4 py-1.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                selectedRange === 'month' 
                  ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/20' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30 Days Month
            </button>
          </div>
        </div>

        {/* --- WEEK BAR CHART DISPLAY --- */}
        {selectedRange === 'week' ? (
          <div className="space-y-6" id="weekly-bar-chart-container">
            <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-800">
              {weeklyStats.dailyArray.map((day, idx) => {
                const heightPercent = day.percent;
                const cappedHeight = Math.min(100, heightPercent);
                const showSuccess = heightPercent >= 100;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full group relative">
                    
                    {/* Hover detail tooltip */}
                    <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2 text-[10px] font-mono whitespace-nowrap z-25 shadow-lg select-none">
                      <div className="font-bold">{day.dateStr}</div>
                      <div>Logged: {formatWaterAmount(day.amountMl, user.units)}</div>
                      <div>Status: {day.percent}% of goal</div>
                    </div>

                    {/* Bar graphic */}
                    <div className="w-full flex items-end justify-center h-full pb-1">
                      <div className="bg-slate-950 rounded-t-xl w-full max-w-[40px] h-full flex items-end relative overflow-hidden ring-1 ring-slate-850">
                        
                        {/* The active filled portion */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${cappedHeight}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05 }}
                          className={`w-full rounded-t-lg transition-colors ${
                            showSuccess 
                              ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400' 
                              : day.amountMl > 0 
                                ? 'bg-gradient-to-t from-blue-700 via-blue-500 to-blue-400'
                                : 'bg-slate-900'
                          }`}
                        />

                        {/* Over-achievement subtle crown indicator inside */}
                        {heightPercent > 100 && (
                          <div className="absolute top-1 left-0 right-0 text-center text-[8px] filter invert select-none pointer-events-none">⭐</div>
                        )}
                      </div>
                    </div>

                    {/* Day short name Label */}
                    <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase mt-3 select-none">
                      {day.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 mt-1 select-none">
                      {day.percent}%
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 text-[10px] text-slate-400 pt-2 font-sans">
              <span className="flex items-center gap-1.5">
                <span className="w-3 pb-3 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-md block"></span>
                Goal Completed (100%+)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 pb-3 bg-gradient-to-t from-blue-700 to-blue-400 rounded-md block"></span>
                Partially Hydrated
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 pb-3 bg-slate-950 border border-slate-850 rounded-md block"></span>
                Zero Logs Recorded
              </span>
            </div>
          </div>
        ) : (
          /* --- MONTHLY CALENDAR GRID DISPLAY --- */
          <div className="space-y-6" id="monthly-grid-container">
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3" id="monthly-dashboard-grid">
              {monthlyStats.slots.map((day, idx) => {
                const dayDate = new Date(day.dateStr);
                const dayLabelStr = dayDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                const completed = day.met;
                const hasLogs = day.amountMl > 0;

                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-2xl p-2.5 flex flex-col justify-between border select-none relative group transition-all duration-300 ${
                      completed
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 shadow-sm shadow-emerald-500/5'
                        : hasLogs
                          ? 'bg-blue-500/5 border-blue-500/15 text-blue-300'
                          : 'bg-slate-950/40 border-slate-850/80 text-slate-500'
                    }`}
                  >
                    {/* Hover details */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-150 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-2 text-[10px] font-mono whitespace-nowrap z-25 shadow-lg">
                      <div className="font-bold">{dayLabelStr}</div>
                      <div>Total: {formatWaterAmount(day.amountMl, user.units)}</div>
                      <div>Status: {completed ? 'Goal Achieved 👑' : hasLogs ? 'Partial' : 'No entries'}</div>
                    </div>

                    {/* Mini Date */}
                    <span className="text-[9px] font-mono font-bold leading-none block">
                      {dayDate.getDate()}
                    </span>

                    {/* Completion Icon */}
                    <div className="text-right">
                      {completed ? (
                        <span className="text-xs">👑</span>
                      ) : hasLogs ? (
                        <span className="text-[10px] text-blue-400">💧</span>
                      ) : (
                        <span className="text-[8px] text-slate-700">●</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-slate-500 italic">
              * Showing dynamic hydration status tracking history over the past 30 days. Maintain strict daily rituals!
            </p>
          </div>
        )}
      </div>

      {/* ACHIEVEMENT BADGES ROADMAP LIST */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl" id="achievements-card">
        <h3 className="text-sm uppercase font-sans tracking-wider text-slate-300 font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Hydration Milestones & Achievement Badges
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="badges-grid-list">
          {AVAILABLE_BADGES.map((badge) => {
            const unlockedObj = achievements.find(a => a.badge_id === badge.id);
            const isUnlocked = !!unlockedObj;

            return (
              <div
                key={badge.id}
                className={`flex gap-4 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                  isUnlocked 
                    ? 'bg-slate-900 border-yellow-500/20 shadow-md shadow-yellow-500/[0.02]' 
                    : 'bg-slate-950/60 border-slate-850 text-slate-500 opacity-60'
                }`}
              >
                {/* Visual Graphic based on ID */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 select-none ${
                  isUnlocked
                    ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' 
                    : 'bg-slate-900 border border-slate-800 text-slate-600'
                }`}>
                  {badge.id === 'first_sip' && '🥛'}
                  {badge.id === 'day_one' && '🏆'}
                  {badge.id === 'streak_3' && '🔥'}
                  {badge.id === 'streak_7' && '🛡️'}
                  {badge.id === 'super_size' && '🧴'}
                  {badge.id === 'perfect_week' && '👑'}
                  {badge.id === 'night_owl' && '🦉'}
                </div>

                <div className="space-y-1">
                  <div className={`text-xs font-sans font-bold leading-tight flex items-center gap-1.5 ${isUnlocked ? 'text-slate-100' : 'text-slate-400'}`}>
                    {badge.name}
                    {isUnlocked && <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full font-mono uppercase font-semibold">Active</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">{badge.description}</p>
                  
                  {isUnlocked && unlockedObj.unlocked_date && (
                    <span className="text-[8px] font-mono text-slate-500 block pt-0.5">
                      Completed: {new Date(unlockedObj.unlocked_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RESET/CLEAR ACTIONS SECTION */}
      <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 flex items-center justify-between shadow-md">
        <div className="space-y-1">
          <h4 className="text-xs font-sans font-bold text-rose-300">Database Administration</h4>
          <p className="text-[10px] text-slate-400 max-w-md">
            Clears all saved water tracking logs, completed achievements, and customization data from local storage files. Relational schemas will reset to factory mock parameters.
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Are you absolutely sure you want to delete all historical logs and restore original templates? This operation cannot be undone.')) {
              onClearAllData();
            }
          }}
          className="bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 text-xs font-sans font-semibold px-4 py-2 border border-rose-500/20 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Trash className="w-4 h-4" /> Clear Local State
        </button>
      </div>

    </div>
  );
}
