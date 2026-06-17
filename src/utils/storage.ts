/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DbUser, DbWaterLog, DbReminder, DbAchievement, ApplicationState } from '../types';

// Storage Key
const STORAGE_KEY = 'h2o_reminder_app_state';

// Constant conversion factors
export const ML_TO_OZ = 0.033814;
export const OZ_TO_ML = 29.5735;

/** Converts ml to oz rounded to nearest integer */
export function mlToOz(ml: number): number {
  return Math.round(ml * ML_TO_OZ);
}

/** Converts oz to ml rounded to nearest integer */
export function ozToMl(oz: number): number {
  return Math.round(oz * OZ_TO_ML);
}

/** Formatting utility for water amounts with units */
export function formatWaterAmount(amountMl: number, unit: 'ml' | 'oz'): string {
  if (unit === 'oz') {
    return `${mlToOz(amountMl)} oz`;
  }
  return `${amountMl} ml`;
}

// Predefined available badges
export const AVAILABLE_BADGES = [
  { id: 'first_sip', name: 'First Sip', description: 'Log your first water intake' },
  { id: 'day_one', name: 'Daily Champion', description: 'Meet your daily hydration goal for the first time' },
  { id: 'streak_3', name: 'Habit Builder', description: 'Maintain a 3-day hydration streak' },
  { id: 'streak_7', name: 'Hydration Hero', description: 'Maintain a 7-day hydration streak' },
  { id: 'super_size', name: 'Mega Miner', description: 'Log single intake of 1L (34 oz) or more' },
  { id: 'perfect_week', name: 'Perfect Week', description: 'Meet your goal 7 days in a row' },
  { id: 'night_owl', name: 'Midnight Hydrator', description: 'Log water between 10 PM and 4 AM' }
];

/** Quick log sizes template */
export const QUICK_LOG_PRESETS = {
  ml: [200, 250, 500, 1000],
  oz: [8, 12, 16, 32]
};

/** Get default system state with seeded historical logs for testing */
function getSeededState(): ApplicationState {
  const user_id = 'user_default';
  
  const user: DbUser = {
    user_id,
    daily_goal: 2000, // In ml (standard 2 Liters)
    units: 'ml',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Coordinated Universal Time',
    created_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    notifications_enabled: true,
    vibration_enabled: true,
    sound_pref: 'droplet'
  };

  const reminders: DbReminder[] = [
    { reminder_id: 'rem_morning', user_id, slot: 'morning', time: '08:00', enabled: true, sound_pref: 'droplet' },
    { reminder_id: 'rem_midday', user_id, slot: 'midday', time: '12:00', enabled: true, sound_pref: 'droplet' },
    { reminder_id: 'rem_afternoon', user_id, slot: 'afternoon', time: '15:30', enabled: true, sound_pref: 'droplet' },
    { reminder_id: 'rem_evening', user_id, slot: 'evening', time: '19:30', enabled: true, sound_pref: 'droplet' }
  ];

  const logs: DbWaterLog[] = [];
  const achievements: DbAchievement[] = [];

  // Seed historical data: Last 14 days, with some goals met and others not, to make the stats look real & beautiful
  const now = new Date();
  
  // Create logs
  for (let i = 13; i >= 0; i--) {
    const logDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    
    // We want to simulate a solid hydration history
    // Today will start with partial water logs, say 750ml, so the user can see log something today!
    if (i === 0) {
      logDate.setHours(8, 15, 0);
      logs.push({
        log_id: `log_today_1`,
        user_id,
        amount_ml: 250,
        timestamp: logDate.toISOString()
      });
      logDate.setHours(11, 30, 0);
      logs.push({
        log_id: `log_today_2`,
        user_id,
        amount_ml: 500,
        timestamp: logDate.toISOString()
      });
      continue;
    }

    // Days 1 to 13: Let's make some days fully hydrate (2000ml to 2400ml) and some slightly short (1200ml or 1500ml)
    // To generate a nice current 4-day streak ending yesterday, and some earlier streaks
    const isGoalMet = i !== 5 && i !== 6 && i !== 11; // Goal missed on day 5, 6, 11 ago; Met on all other days
    const totalAmount = isGoalMet ? (1800 + Math.floor(Math.random() * 6) * 100 + 200) : (1000 + Math.floor(Math.random() * 5) * 100);

    let loggedAmount = 0;
    let entryCount = 0;
    while (loggedAmount < totalAmount) {
      const entrySize = [200, 250, 500][Math.floor(Math.random() * 3)];
      const hour = 8 + Math.floor(Math.random() * 12); // random hour between 8 AM and 8 PM
      const minute = Math.floor(Math.random() * 60);

      const entryDate = new Date(logDate.getTime());
      entryDate.setHours(hour, minute, 0);

      logs.push({
        log_id: `seed_log_${i}_${entryCount}`,
        user_id,
        amount_ml: entrySize,
        timestamp: entryDate.toISOString()
      });
      loggedAmount += entrySize;
      entryCount++;
    }
  }

  // Pre-seed some achievements based on the seeded history
  achievements.push({
    achievement_id: 'ach_1',
    user_id,
    badge_id: 'first_sip',
    badge_name: 'First Sip',
    unlocked_date: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Log your first water intake'
  });

  achievements.push({
    achievement_id: 'ach_2',
    user_id,
    badge_id: 'day_one',
    badge_name: 'Daily Champion',
    unlocked_date: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Meet your daily hydration goal for the first time'
  });

  achievements.push({
    achievement_id: 'ach_3',
    user_id,
    badge_id: 'streak_3',
    badge_name: 'Habit Builder',
    unlocked_date: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Maintain a 3-day hydration streak'
  });

  return {
    user,
    logs,
    reminders,
    achievements
  };
}

/** Load the state from LocalStorage */
export function loadState(): ApplicationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = getSeededState();
      saveState(seeded);
      return seeded;
    }
    const state = JSON.parse(raw) as ApplicationState;
    
    // Safety fallback in case fields are missing
    if (!state.user || !state.logs || !state.reminders || !state.achievements) {
      const seeded = getSeededState();
      saveState(seeded);
      return seeded;
    }
    return state;
  } catch (error) {
    console.error('Failed to parse localStorage state for H2O app', error);
    return getSeededState();
  }
}

/** Save the state to LocalStorage */
export function saveState(state: ApplicationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving state to localStorage', error);
  }
}

/** Calculates consecutive days streak of goal completion up to (and including) optionally yesterday/today */
export function calculateStreak(logs: DbWaterLog[], dailyGoalMl: number): { currentStreak: number; longestStreak: number } {
  if (logs.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Group logs by local date string 'YYYY-MM-DD'
  const dailyIntake: Record<string, number> = {};
  logs.forEach(log => {
    try {
      const dateStr = log.timestamp.split('T')[0]; // "YYYY-MM-DD"
      dailyIntake[dateStr] = (dailyIntake[dateStr] || 0) + log.amount_ml;
    } catch (e) {
      // safe bypass for malformed time
    }
  });

  // Generate sequence of dates from created_date or earliest log up to today
  const sortedDates = Object.keys(dailyIntake).sort();
  if (sortedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Let's sweep backwards or forwards to find streaks
  // Create a continuous chronological array of date strings from earliest log to today
  const start = new Date(sortedDates[0]);
  const end = new Date(); // today
  const dailyResults: { dateStr: string; met: boolean }[] = [];

  const temp = new Date(start);
  while (temp <= end) {
    const dateStr = temp.toISOString().split('T')[0];
    const intake = dailyIntake[dateStr] || 0;
    dailyResults.push({
      dateStr,
      met: intake >= dailyGoalMl
    });
    temp.setDate(temp.getDate() + 1);
  }

  // Calculate streaks
  let maxStreak = 0;
  let runningStreak = 0;
  
  dailyResults.forEach(day => {
    if (day.met) {
      runningStreak++;
      if (runningStreak > maxStreak) {
        maxStreak = runningStreak;
      }
    } else {
      // Only break running streak if it is before yesterday, OR if it's today and they already didn't meet it and it's not complete.
      // Wait, standard streak formulas:
      // If today is NOT met, but yesterday was met, we still keep the active streak alive (since today is still in progress!)
      if (day.dateStr === todayStr) {
        // Don't break current streak yet, today is still in progress.
      } else {
        runningStreak = 0;
      }
    }
  });

  // Calculate active current streak checking today/yesterday
  let currentStreak = 0;
  let checkDate = new Date(); // Start with today
  let keepChecking = true;

  while (keepChecking) {
    const checkStr = checkDate.toISOString().split('T')[0];
    const intake = dailyIntake[checkStr] || 0;
    const isToday = checkStr === todayStr;

    if (intake >= dailyGoalMl) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (isToday) {
      // If today is not met, but yesterday was met, the stream is still alive (it's yesterday's streak)
      // We check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayCheckStr = checkDate.toISOString().split('T')[0];
      const yesterdayIntake = dailyIntake[yesterdayCheckStr] || 0;
      if (yesterdayIntake >= dailyGoalMl) {
        // Keep checking from yesterday backwards
        currentStreak = 0; // reset to build up from yesterday
      } else {
        // Yesterday also not met, streak is broken
        currentStreak = 0;
        keepChecking = false;
      }
    } else {
      keepChecking = false;
    }
  }

  // Re-verify the current streak build up by doing yesterday sweep
  if (currentStreak === 0) {
    let yesterdayCheckDate = new Date();
    yesterdayCheckDate.setDate(yesterdayCheckDate.getDate() - 1);
    let checkStr = yesterdayCheckDate.toISOString().split('T')[0];
    let intake = dailyIntake[checkStr] || 0;
    
    if (intake >= dailyGoalMl) {
      let yesterdayStreak = 0;
      let tempDate = new Date(yesterdayCheckDate);
      while (true) {
        const tStr = tempDate.toISOString().split('T')[0];
        const tIntake = dailyIntake[tStr] || 0;
        if (tIntake >= dailyGoalMl) {
          yesterdayStreak++;
          tempDate.setDate(tempDate.getDate() - 1);
        } else {
          break;
        }
      }
      currentStreak = yesterdayStreak;
    }
  }

  // Make sure current doesn't exceed max
  const finalLongest = Math.max(maxStreak, currentStreak);

  return {
    currentStreak,
    longestStreak: finalLongest
  };
}

/** Check and unlock achievements if conditions are satisfied */
export function checkAchievements(state: ApplicationState): { unlockedNew: DbAchievement[]; updatedAchievements: DbAchievement[] } {
  const unlockedNew: DbAchievement[] = [];
  const updatedAchievements = [...state.achievements];
  const user_id = state.user.user_id;
  const nowStr = new Date().toISOString();

  // Helper to verify if badge is already unlocked
  const hasUnlocked = (badgeId: string) => updatedAchievements.some(a => a.badge_id === badgeId);

  // 1. First Sip: Over 0 logs
  if (state.logs.length > 0 && !hasUnlocked('first_sip')) {
    const badge = AVAILABLE_BADGES.find(b => b.id === 'first_sip')!;
    const achievement: DbAchievement = {
      achievement_id: `ach_${Date.now()}_first`,
      user_id,
      badge_id: 'first_sip',
      badge_name: badge.name,
      unlocked_date: nowStr,
      description: badge.description
    };
    unlockedNew.push(achievement);
    updatedAchievements.push(achievement);
  }

  // Calculate streaks
  const { currentStreak, longestStreak } = calculateStreak(state.logs, state.user.daily_goal);

  // 2. Day One: Met daily goal at least once
  const dailyIntake: Record<string, number> = {};
  state.logs.forEach(log => {
    const dateStr = log.timestamp.split('T')[0];
    dailyIntake[dateStr] = (dailyIntake[dateStr] || 0) + log.amount_ml;
  });
  const hasMetGoalDay = Object.values(dailyIntake).some(amount => amount >= state.user.daily_goal);

  if (hasMetGoalDay && !hasUnlocked('day_one')) {
    const badge = AVAILABLE_BADGES.find(b => b.id === 'day_one')!;
    const achievement: DbAchievement = {
      achievement_id: `ach_${Date.now()}_day_one`,
      user_id,
      badge_id: 'day_one',
      badge_name: badge.name,
      unlocked_date: nowStr,
      description: badge.description
    };
    unlockedNew.push(achievement);
    updatedAchievements.push(achievement);
  }

  // 3. Streak 3
  if (longestStreak >= 3 && !hasUnlocked('streak_3')) {
    const badge = AVAILABLE_BADGES.find(b => b.id === 'streak_3')!;
    const achievement: DbAchievement = {
      achievement_id: `ach_${Date.now()}_streak_3`,
      user_id,
      badge_id: 'streak_3',
      badge_name: badge.name,
      unlocked_date: nowStr,
      description: badge.description
    };
    unlockedNew.push(achievement);
    updatedAchievements.push(achievement);
  }

  // 4. Streak 7
  if (longestStreak >= 7 && !hasUnlocked('streak_7')) {
    const badge = AVAILABLE_BADGES.find(b => b.id === 'streak_7')!;
    const achievement: DbAchievement = {
      achievement_id: `ach_${Date.now()}_streak_7`,
      user_id,
      badge_id: 'streak_7',
      badge_name: badge.name,
      unlocked_date: nowStr,
      description: badge.description
    };
    unlockedNew.push(achievement);
    updatedAchievements.push(achievement);
  }

  // 5. Perfect Week (current streak is at least 7 - same as streak_7 but specific to continuous streak)
  if (currentStreak >= 7 && !hasUnlocked('perfect_week')) {
    const badge = AVAILABLE_BADGES.find(b => b.id === 'perfect_week')!;
    const achievement: DbAchievement = {
      achievement_id: `ach_${Date.now()}_perfect_week`,
      user_id,
      badge_id: 'perfect_week',
      badge_name: badge.name,
      unlocked_date: nowStr,
      description: badge.description
    };
    unlockedNew.push(achievement);
    updatedAchievements.push(achievement);
  }

  // 6. Super Size: Single intake of 1000ml or more
  const hasMegaLog = state.logs.some(log => log.amount_ml >= 1000);
  if (hasMegaLog && !hasUnlocked('super_size')) {
    const badge = AVAILABLE_BADGES.find(b => b.id === 'super_size')!;
    const achievement: DbAchievement = {
      achievement_id: `ach_${Date.now()}_super_size`,
      user_id,
      badge_id: 'super_size',
      badge_name: badge.name,
      unlocked_date: nowStr,
      description: badge.description
    };
    unlockedNew.push(achievement);
    updatedAchievements.push(achievement);
  }

  // 7. Night Owl: Logged water between 10 PM (22:00) and 4 AM (04:00)
  const hasNightLog = state.logs.some(log => {
    try {
      const date = new Date(log.timestamp);
      const hours = date.getHours();
      return hours >= 22 || hours < 4;
    } catch {
      return false;
    }
  });
  if (hasNightLog && !hasUnlocked('night_owl')) {
    const badge = AVAILABLE_BADGES.find(b => b.id === 'night_owl')!;
    const achievement: DbAchievement = {
      achievement_id: `ach_${Date.now()}_night_owl`,
      user_id,
      badge_id: 'night_owl',
      badge_name: badge.name,
      unlocked_date: nowStr,
      description: badge.description
    };
    unlockedNew.push(achievement);
    updatedAchievements.push(achievement);
  }

  return {
    unlockedNew,
    updatedAchievements
  };
}
