/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Save, Volume2, ShieldCheck, Heart, User, Hourglass, Bell, BellOff, Music, Sliders, Check, Globe
} from 'lucide-react';
import { DbUser, DbReminder } from '../types';
import { playWaterSound, triggerVibration } from '../utils/audio';

interface SettingsViewProps {
  user: DbUser;
  reminders: DbReminder[];
  onSaveSettings: (updatedUser: DbUser, updatedReminders: DbReminder[]) => void;
}

export default function SettingsView({
  user,
  reminders,
  onSaveSettings
}: SettingsViewProps) {
  // Current user configuration states
  const [dailyGoal, setDailyGoal] = useState<number>(user.daily_goal);
  const [units, setUnits] = useState<'ml' | 'oz'>(user.units);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(user.notifications_enabled);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(user.vibration_enabled);
  const [soundPref, setSoundPref] = useState<'droplet' | 'bubbles' | 'sparkle'>(user.sound_pref);

  // Reminders states
  const [reminderSlots, setReminderSlots] = useState<DbReminder[]>([...reminders]);

  // Handle unit swap with proper unit scale conversion of the user's active target
  const handleUnitChange = (newUnit: 'ml' | 'oz') => {
    if (newUnit === units) return;
    setUnits(newUnit);
    if (newUnit === 'oz') {
      // Convert ml to oz (e.g. 2000 ml to 68 oz)
      setDailyGoal(Math.round(dailyGoal * 0.033814));
    } else {
      // Convert oz to ml (e.g. 64 oz to 1893 ml, round to nice clean 1900 or 1900 equivalent)
      setDailyGoal(Math.round(dailyGoal / 0.033814));
    }
  };

  const handleGoalIncrement = (amount: number) => {
    setDailyGoal(prev => Math.max(100, prev + amount));
  };

  const pbToggleState = (slotId: string) => {
    setReminderSlots(prev => prev.map(rem => {
      if (rem.reminder_id === slotId) {
        return { ...rem, enabled: !rem.enabled };
      }
      return rem;
    }));
  };

  const handleTimeChange = (slotId: string, timeValue: string) => {
    setReminderSlots(prev => prev.map(rem => {
      if (rem.reminder_id === slotId) {
        return { ...rem, time: timeValue };
      }
      return rem;
    }));
  };

  // Sound selection preview
  const handleSoundSelect = (soundType: 'droplet' | 'bubbles' | 'sparkle') => {
    setSoundPref(soundType);
    playWaterSound(soundType); // instant auditory preview feedback
  };

  // Form submission dispatcher
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedUser: DbUser = {
      ...user,
      daily_goal: dailyGoal,
      units,
      notifications_enabled: notificationsEnabled,
      vibration_enabled: vibrationEnabled,
      sound_pref: soundPref
    };

    onSaveSettings(updatedUser, reminderSlots);
    playWaterSound('sparkle');
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8 animate-fade-in" id="settings-tab-panel">
      
      {/* Target goals and preferred units config */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl" id="settings-goal-container">
        <h3 className="text-sm uppercase font-sans tracking-wider text-slate-300 font-bold mb-5 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-400" />
          Hydration Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Target adjustments */}
          <div className="space-y-4">
            <label className="text-xs text-slate-400 font-sans block font-semibold uppercase tracking-wider">
              Daily Hydration Target
            </label>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleGoalIncrement(units === 'ml' ? -100 : -4)}
                className="w-12 h-12 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300 text-lg font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                -
              </button>
              
              <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-slate-100">
                  {dailyGoal}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  {units}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleGoalIncrement(units === 'ml' ? 100 : 4)}
                className="w-12 h-12 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300 text-lg font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                +
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 leading-normal">
              * Recommended target is 2000 ml (approx. 68 oz) or 8 standard glasses daily. Tailor this parameter to match your custom physical metabolic demand.
            </p>
          </div>

          {/* Unit selection preferences toggle */}
          <div className="space-y-4">
            <label className="text-xs text-slate-400 font-sans block font-semibold uppercase tracking-wider">
              Fluid Metrics Unit Standard
            </label>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleUnitChange('ml')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
                  units === 'ml'
                    ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-bold'
                    : 'bg-slate-950/40 border-slate-850/80 text-slate-500'
                }`}
              >
                <span className="text-lg">🧴</span>
                <span className="text-xs font-sans tracking-wide">Metric (ml)</span>
              </button>

              <button
                type="button"
                onClick={() => handleUnitChange('oz')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
                  units === 'oz'
                    ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-bold'
                    : 'bg-slate-950/40 border-slate-850/80 text-slate-500'
                }`}
              >
                <span className="text-lg">🥛</span>
                <span className="text-xs font-sans tracking-wide">Imperial (oz)</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Alarm times and notification slot customizer */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl" id="settings-reminders-container">
        <h3 className="text-sm uppercase font-sans tracking-wider text-slate-300 font-bold mb-5 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          Smart Reminder Chronology
        </h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl border ${notificationsEnabled ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs font-sans font-bold text-slate-200 block">Push Reminder Notifications</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Allow ambient popups to check your water levels locally</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Active slots config grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-300 ${notificationsEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {reminderSlots.map((rem) => {
              let slotDescriptor = '';
              let slotIcon = '☀️';

              if (rem.slot === 'morning') {
                slotDescriptor = 'Morning Rise Warm-up';
                slotIcon = '☀️';
              } else if (rem.slot === 'midday') {
                slotDescriptor = 'Midday Focus Guard';
                slotIcon = '🕛';
              } else if (rem.slot === 'afternoon') {
                slotDescriptor = 'Afternoon Crash Blocker';
                slotIcon = '🥤';
              } else if (rem.slot === 'evening') {
                slotDescriptor = 'Evening Recovery Ritual';
                slotIcon = '🌙';
              }

              return (
                <div
                  key={rem.reminder_id}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    rem.enabled 
                      ? 'bg-slate-900/80 border-slate-800' 
                      : 'bg-slate-950/40 border-slate-850/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => pbToggleState(rem.reminder_id)}
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm transition-all cursor-pointer ${
                        rem.enabled 
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-600'
                      }`}
                    >
                      {rem.enabled ? <Check className="w-4 h-4" /> : slotIcon}
                    </button>
                    <div>
                      <span className={`text-xs font-sans font-semibold block ${rem.enabled ? 'text-slate-200' : 'text-slate-500'}`}>
                        {slotDescriptor}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans block mt-0.5 uppercase tracking-wide">
                        {rem.slot} alert
                      </span>
                    </div>
                  </div>

                  {/* HTML Local Time Picker input */}
                  <input
                    type="time"
                    value={rem.time}
                    disabled={!rem.enabled}
                    onChange={(e) => handleTimeChange(rem.reminder_id, e.target.value)}
                    className={`bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono disabled:opacity-50 select-text`}
                  />
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Sounds and vibrations sensory parameters */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl" id="settings-sensory-container">
        <h3 className="text-sm uppercase font-sans tracking-wider text-slate-300 font-bold mb-5 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-teal-400" />
          Tactile & Sound Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Audio selector previews */}
          <div className="space-y-4">
            <label className="text-xs text-slate-400 font-sans block font-semibold uppercase tracking-wider">
              Notification Chime Theme
            </label>
            
            <div className="space-y-2.5">
              {[
                { type: 'droplet', label: 'Brisk Droplet Plink', icon: '💧' },
                { type: 'bubbles', label: 'Sparkling Carbon Fizz', icon: '🫧' },
                { type: 'sparkle', label: 'Chime Symphony Arpeggio', icon: '✨' }
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleSoundSelect(item.type as any)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                    soundPref === item.type
                      ? 'bg-teal-500/10 border-teal-500 text-teal-300 font-bold'
                      : 'bg-slate-950/40 border-slate-850/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-sans flex items-center gap-2.5">
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                  
                  {soundPref === item.type ? (
                    <span className="text-[10px] uppercase font-mono tracking-wider bg-teal-500/20 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded-md">Selected</span>
                  ) : (
                    <span className="text-[9px] uppercase font-mono tracking-wider text-slate-600">Preview</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Vibrations toggle & UTC indicator */}
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs text-slate-400 font-sans block font-semibold uppercase tracking-wider">
                Tactile Sensory Engine
              </label>

              <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
                <div>
                  <span className="text-xs font-sans font-bold text-slate-200 block">Haptic Device Vibration</span>
                  <p className="text-[10px] text-slate-500 leading-normal max-w-xs mt-0.5">
                    Trigger physical alert waveforms on smart accessories and phones upon logging hydration cups.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setVibrationEnabled(!vibrationEnabled);
                    if (!vibrationEnabled) {
                      triggerVibration();
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    vibrationEnabled ? 'bg-teal-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Timezone Indicator */}
            <div className="bg-slate-950/40 border border-slate-850/80 rounded-2xl p-4 flex items-center space-x-3 text-slate-500">
              <Globe className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-sans block uppercase font-bold tracking-wider text-slate-400 leading-none">Registered System Timezone</span>
                <span className="text-xs font-mono font-semibold text-slate-300 block mt-1 leading-none">{user.timezone}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Persistent action floating saver */}
      <div className="flex justify-end pt-4" id="save-settings-bar">
        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-slate-950 text-sm font-sans font-extrabold rounded-full transition-transform transform active:scale-95 shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Preferences
        </button>
      </div>

    </form>
  );
}
