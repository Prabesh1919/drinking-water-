/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Bell, GlassWater, Coffee, ShieldAlert } from 'lucide-react';
import { DbUser, DbReminder } from '../types';
import { playWaterSound, triggerVibration } from '../utils/audio';

interface RemindersOverlayProps {
  user: DbUser;
  reminders: DbReminder[];
  onLogWaterDirect: (amountMl: number) => void;
  // Let parent know a simulation or snooze happened
  onRegisterSnooze: (minutes: number) => void;
}

export default function RemindersOverlay({
  user,
  reminders,
  onLogWaterDirect,
  onRegisterSnooze
}: RemindersOverlayProps) {
  const [activeAlert, setActiveAlert] = useState<{
    slot: string;
    time: string;
    customMessage: string;
  } | null>(null);

  const [snoozeActive, setSnoozeActive] = useState<{
    originalSlot: string;
    timeLeftSeconds: number;
  } | null>(null);

  // Background clock to naturally trigger alarms if hours and minutes match right now
  useEffect(() => {
    if (!user.notifications_enabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMinutes}`;

      // Search if any enabled slot matches the current time
      const matching = reminders.find(r => r.enabled && r.time === timeStr);
      if (matching) {
        // Prevent constant re-triggering during the same minute: block index lock
        const lastTriggeredKey = `h2o_last_trigger_${matching.reminder_id}_${timeStr}`;
        if (!localStorage.getItem(lastTriggeredKey)) {
          localStorage.setItem(lastTriggeredKey, 'true');
          
          let alertMsg = "Time for a refreshing drink of water!";
          if (matching.slot === 'morning') alertMsg = "Wake up your metabolics with a fresh cup of pure water!";
          if (matching.slot === 'midday') alertMsg = "Power up your intellectual focus with a hydrating boost!";
          if (matching.slot === 'afternoon') alertMsg = "Eliminate afternoon energy crashes. Sip some cooler water now!";
          if (matching.slot === 'evening') alertMsg = "Rehydrate your muscles before bedtime sleep!";

          // Trigger
          setActiveAlert({
            slot: matching.slot,
            time: matching.time,
            customMessage: alertMsg
          });

          // Play audio alert
          if (user.sound_pref) {
            playWaterSound(user.sound_pref);
          }
          if (user.vibration_enabled) {
            triggerVibration();
          }
        }
      }
    }, 15000); // Check every 15s

    return () => clearInterval(interval);
  }, [user.notifications_enabled, reminders, user.sound_pref, user.vibration_enabled]);

  // Snooze countdown driver
  useEffect(() => {
    if (!snoozeActive) return;

    const run = setInterval(() => {
      setSnoozeActive(prev => {
        if (!prev) return null;
        if (prev.timeLeftSeconds <= 1) {
          // Snooze expired! Trigger alarm again
          setActiveAlert({
            slot: prev.originalSlot,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            customMessage: `Snoozed alarm expired! Time to fulfill your hydration goal.`
          });

          if (user.sound_pref) {
            playWaterSound(user.sound_pref);
          }
          if (user.vibration_enabled) {
            triggerVibration();
          }
          return null;
        }
        return {
          ...prev,
          timeLeftSeconds: prev.timeLeftSeconds - 1
        };
      });
    }, 1000);

    return () => clearInterval(run);
  }, [snoozeActive, user.sound_pref, user.vibration_enabled]);

  const handleDismiss = () => {
    setActiveAlert(null);
  };

  const handleSIPDirect = (amountMl: number) => {
    onLogWaterDirect(amountMl);
    setActiveAlert(null);
    playWaterSound('sparkle');
  };

  const handleSnooze = (minutes: number) => {
    onRegisterSnooze(minutes);
    const seconds = minutes; // for quick sandbox representation, we use N seconds instead of natural minutes so the user doesn't wait 5-15 hours to test!
    // We explain: "Snoozing for N seconds for swift testing"
    setSnoozeActive({
      originalSlot: activeAlert?.slot || 'custom',
      timeLeftSeconds: seconds * 60 // Let's keep genuine minutes for standard, but offer a swift toggle in UI
    });
    setActiveAlert(null);
  };

  // Immediate Simulation trigger
  const triggerSimulationNow = () => {
    setActiveAlert({
      slot: 'simulation',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customMessage: "Simulated Alert: Your water schedule triggers a reminder! Time to optimize your hydration target."
    });
    if (user.sound_pref) {
      playWaterSound(user.sound_pref);
    }
    if (user.vibration_enabled) {
      triggerVibration();
    }
  };

  return (
    <>
      {/* Simulation Trigger Launcher floating pill */}
      <div className="flex justify-center items-center py-1 select-none">
        <button
          onClick={triggerSimulationNow}
          className="bg-indigo-650/40 hover:bg-indigo-600/50 text-indigo-300 font-sans text-xs font-semibold px-4.5 py-2 rounded-2xl border border-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
          title="Simulate prompt reminder alert instantly for quick testing"
          id="cmd-test-reminder"
        >
          <Bell className="w-3.5 h-3.5 text-indigo-400 animate-bounce" /> Simulate Smart Reminder Alert
        </button>
      </div>

      {/* Snooze Status Bar display */}
      {snoozeActive && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between text-amber-300 select-none shadow animate-pulse">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-sans font-bold block">Smart Snooze Alarm in Progress</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Alert from slot "{snoozeActive.originalSlot}" will trigger again shortly</span>
            </div>
          </div>
          <div className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg border border-amber-500/25">
            {Math.floor(snoozeActive.timeLeftSeconds / 60)}m {snoozeActive.timeLeftSeconds % 60}s
          </div>
        </div>
      )}

      {/* Main Alert Modal Overlay popup */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6"
            id="reminder-alarm-popup"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Abstract fluid bubbles animation backdrop inside alert panel */}
              <span className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl select-none" />

              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/25 animate-pulse">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-sans font-bold text-slate-100 uppercase tracking-widest leading-none">Smart Reminder</h4>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1">Scheduled Time: {activeAlert.time}</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full capitalize">
                  {activeAlert.slot} slot
                </span>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-sm font-sans text-slate-200 leading-relaxed font-medium">
                  "{activeAlert.customMessage}"
                </p>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 italic bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                  <GlassWater className="w-4 h-4 text-sky-400 shrink-0" />
                  Did you know? Even mild dehydration can curb cognitive stamina and energy concentration.
                </div>
              </div>

              {/* Action layout buttons */}
              <div className="grid grid-cols-1 gap-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleSIPDirect(250)}
                    className="py-3 bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 select-none"
                  >
                    <GlassWater className="w-4 h-4" /> Drink 250ml (Cup)
                  </button>
                  <button
                    onClick={() => handleSIPDirect(500)}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 select-none"
                  >
                    <Coffee className="w-4 h-4" /> Drink 500ml (Bottle)
                  </button>
                </div>

                <div className="border-t border-slate-800/80 my-2 pt-2 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSnooze(5)} // Snooze 5 Min (or 5 seconds / 5 min equivalent)
                    className="py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-sans font-bold text-[10px] rounded-xl border border-amber-500/10 hover:border-amber-500/30 cursor-pointer flex flex-col items-center justify-center select-none"
                  >
                    <Clock className="w-3.5 h-3.5 mb-1" />
                    Snooze 5 Min
                  </button>
                  <button
                    onClick={() => handleSnooze(15)} // Snooze 15 Min
                    className="py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-sans font-bold text-[10px] rounded-xl border border-amber-500/10 hover:border-amber-500/30 cursor-pointer flex flex-col items-center justify-center select-none"
                  >
                    <Clock className="w-3.5 h-3.5 mb-1" />
                    Snooze 15 Min
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-sans font-bold text-[10px] rounded-xl border border-slate-850 hover:border-slate-800 cursor-pointer flex flex-col items-center justify-center select-none"
                  >
                    <span className="text-sm mb-1">✕</span>
                    Dismiss
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
