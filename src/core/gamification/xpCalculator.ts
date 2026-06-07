import type {
  Quality,
  Streak,
  XPCalculation,
  LevelUpResult,
  StreakCalculation
} from './types';
import {
  BASE_XP,
  STREAK_BONUS_PER_DAY,
  STREAK_MAX_BONUS_DAYS,
  STREAK_CONTINUATION_HOURS,
  floorXP,
  getQualityMultiplier
} from './constants';
import { logXPCalculation, startTimer } from './logger';
import {
  InvalidCategoryError,
  LogicError
} from './types';

const VALID_CATEGORIES = ['Career', 'Knowledge', 'Wealth', 'Health', 'Relationships', 'Mindfulness'];

export function calculateXP(
  category: string,
  quality: Quality,
  streak: Streak
): number {
  const timer = startTimer('calculateXP');

  try {
    if (!VALID_CATEGORIES.includes(category)) {
      throw new InvalidCategoryError(category);
    }

    const baseXP = BASE_XP[category];
    if (baseXP === undefined) {
      throw new LogicError(`No base XP defined for category: ${category}`);
    }

    const multiplier = getQualityMultiplier(quality);
    const baseScore = baseXP * multiplier;
    const effectiveStreakDays = Math.min(streak, STREAK_MAX_BONUS_DAYS);
    const streakBonus = effectiveStreakDays * STREAK_BONUS_PER_DAY;
    const xpEarned = floorXP(baseScore + streakBonus);

    if (!Number.isInteger(xpEarned) || xpEarned < 0) {
      throw new LogicError(`XP calculation produced invalid result: ${xpEarned}`);
    }

    logXPCalculation(category, quality, streak, { baseXP, multiplier, xpEarned });
    timer.end();
    return xpEarned;
  } catch (error) {
    timer.end();
    throw error;
  }
}

export function getXPBreakdown(
  category: string,
  quality: Quality,
  streak: Streak
): XPCalculation {
  if (!VALID_CATEGORIES.includes(category)) {
    throw new InvalidCategoryError(category);
  }

  const baseXP = BASE_XP[category] || 0;
  const multiplier = getQualityMultiplier(quality);
  const baseScore = baseXP * multiplier;
  const effectiveStreakDays = Math.min(streak, STREAK_MAX_BONUS_DAYS);
  const streakBonus = effectiveStreakDays * STREAK_BONUS_PER_DAY;
  const totalXP = floorXP(baseScore + streakBonus);

  return { baseXP, multiplier, baseScore, streakBonus, totalXP };
}

export function checkLevelUp(
  totalXP: number,
  currentLevel: number
): LevelUpResult {
  const timer = startTimer('checkLevelUp');

  try {
    if (!Number.isInteger(totalXP) || totalXP < 0 || totalXP > 10_000_000) {
      throw new LogicError(
        `Invalid totalXP for level calculation: ${totalXP}. Must be a non-negative integer ≤ 10,000,000.`
      );
    }

    if (!Number.isInteger(currentLevel) || currentLevel < 1) {
      throw new LogicError(`Invalid currentLevel: ${currentLevel}`);
    }

    const newLevel = 1 + Math.floor(totalXP / 100);
    const leveledUp = newLevel > currentLevel;
    const levelsGained = leveledUp ? newLevel - currentLevel : 0;

    timer.end();
    return { leveledUp, newLevel, levelsGained };
  } catch (error) {
    timer.end();
    throw error;
  }
}

export function getXPRequiredForLevel(level: number): number {
  return level * 100;
}

export function getLevelProgress(totalXP: number) {
  const currentLevel = 1 + Math.floor(totalXP / 100);
  const xpAtLevelStart = (currentLevel - 1) * 100;
  const xpInLevel = totalXP - xpAtLevelStart;
  const xpRequiredForLevel = 100;
  const progressPercent = Math.round((xpInLevel / xpRequiredForLevel) * 100);

  return { currentLevel, xpInLevel, xpRequiredForLevel, progressPercent };
}

export function calculateStreak(
  lastCompletedAt: Date | null,
  previousStreak: number
): StreakCalculation {
  const timer = startTimer('calculateStreak');

  try {
    if (lastCompletedAt === null) {
      timer.end();
      return { streak: 1 as Streak, isReset: false, daysGap: 0 };
    }

    const today = toCalendarDay(new Date());
    const rawLast = new Date(lastCompletedAt);
    const effectiveLast = rawLast > new Date() ? new Date() : rawLast;
    const lastDay = toCalendarDay(effectiveLast);

    const daysGap = calendarDayDiff(today, lastDay);

    if (daysGap === 0) {
      throw new LogicError(
        'calculateStreak called for same-day completion. Should have been caught earlier.'
      );
    }

    if (daysGap === 1) {
      timer.end();
      return {
        streak: (previousStreak + 1) as Streak,
        isReset: false,
        daysGap
      };
    }

    timer.end();
    return { streak: 1 as Streak, isReset: true, daysGap };
  } catch (error) {
    timer.end();
    throw error;
  }
}

function toCalendarDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calendarDayDiff(today: string, lastDay: string): number {
  const todayMs = new Date(today + 'T00:00:00').getTime();
  const lastMs = new Date(lastDay + 'T00:00:00').getTime();
  const diffMs = todayMs - lastMs;
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function wouldStreakContinue(lastCompletedAt: Date | null): boolean {
  if (lastCompletedAt === null) return true;
  const today = toCalendarDay(new Date());
  const lastDay = toCalendarDay(new Date(lastCompletedAt));
  const gap = calendarDayDiff(today, lastDay);
  return gap === 1;
}

export function getHoursUntilStreakReset(lastCompletedAt: Date | null): number {
  if (lastCompletedAt === null) return STREAK_CONTINUATION_HOURS;
  const now = new Date();
  const last = new Date(lastCompletedAt);
  const diffMs = now.getTime() - last.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.max(0, Math.ceil(STREAK_CONTINUATION_HOURS - diffHours));
}

export function getMultiplierForQuality(quality: Quality): number {
  return getQualityMultiplier(quality);
}

export function getQualityLabel(quality: number): string {
  if (quality <= 3) return 'Low';
  if (quality <= 6) return 'Medium';
  if (quality <= 8) return 'High';
  return 'Very High';
}

export function isValidQualityValue(quality: unknown): boolean {
  return Number.isInteger(quality) && (quality as number) >= 1 && (quality as number) <= 10;

}

export function isValidStreakValue(streak: unknown): boolean {
  return Number.isInteger(streak) && (streak as number) >= 0;

}

export function isValidTotalXP(totalXP: unknown): boolean {
  return Number.isInteger(totalXP) && (totalXP as number) >= 0 && (totalXP as number) <= 10_000_000;

}

export function isValidLevelValue(level: unknown): boolean {
  return Number.isInteger(level) && (level as number) >= 1;

}
