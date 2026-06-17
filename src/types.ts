/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DbUser {
  user_id: string;
  daily_goal: number; // stores current goal in terms of preferred unit (or ml)
  units: 'ml' | 'oz';
  timezone: string;
  created_date: string; // ISO date string
  notifications_enabled: boolean;
  vibration_enabled: boolean;
  sound_pref: 'droplet' | 'bubbles' | 'sparkle';
}

export interface DbWaterLog {
  log_id: string;
  user_id: string;
  amount_ml: number; // Always keep standard raw amount in ml for consistent DB aggregation, we convert for display if preferred unit is oz
  timestamp: string; // ISO string with time
}

export interface DbReminder {
  reminder_id: string;
  user_id: string;
  slot: 'morning' | 'midday' | 'afternoon' | 'evening' | 'custom';
  time: string; // "HH:MM"
  enabled: boolean;
  sound_pref: string;
}

export interface DbAchievement {
  achievement_id: string;
  user_id: string;
  badge_name: string;
  badge_id: string;
  unlocked_date: string; // ISO date string
  description: string;
}

export interface ApplicationState {
  user: DbUser;
  logs: DbWaterLog[];
  reminders: DbReminder[];
  achievements: DbAchievement[];
}
