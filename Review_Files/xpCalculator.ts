/**
 * XP Calculator - Pure Functions
 * 
 * These functions:
 * - Have NO side effects (no DB, no I/O)
 * - Are deterministic (same input = same output)
 * - Are easy to unit test
 * - Can be called in isolation
 * 
 * All input validation happens BEFORE these functions are called
 * All validation errors are thrown by validation layer
 */

import {
  Category,
  Quality,
  Streak,
  QualityTier,
  InvalidCategoryError,
  XPCalculation,
  LevelUpResult,
  StreakCalculation,
  LogicError
} from './types';
import {
  BASE_XP,
  QUALITY_MULTIPLIERS,
  STREAK_BONUS_PER_DAY,
  STREAK_RESET_DAYS,
  XP_PER_LEVEL,
  floorXP,
  getQualityMultiplier,
  isValidCategory,
  isValidSubcategory,
  STREAK_CONTINUATION_HOURS
} from './constants';
import { log, logXPCalculation, startTimer } from './logger';

// ═══════════════════════════════════════════════════════════════════════
// CORE CALCULATION: XP EARNED
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculate total XP earned for a goal completion
 * 
 * Formula:
 *   XP_earned = (BaseXP × QualityMultiplier) + (Streak × 5)
 *   Final = floor(XP_earned)
 * 
 * Pure function: No side effects, deterministic
 * 
 * @param category - One of 6 categories (Career, Knowledge, Wealth, Health, Relationships, Mindfulness)
 * @param quality - Quality rating 1-10 (must already be validated)
 * @param streak - Consecutive days completed (must already be validated)
 * @returns Total XP earned (integer, floored)
 * 
 * @throws {InvalidCategoryError} If category not in enum
 * @throws {LogicError} If calculation produces invalid result
 * 
 * @example
 * // Career goal, high quality, 7-day streak
 * calculateXP('Career', 9 as Quality, 7 as Streak)
 * = floor((20 × 2.5) + (7 × 5))
 * = floor(50 + 35)
 * = 85 XP
 * 
 * @example
 * // Wealth goal, medium quality, no streak
 * calculateXP('Wealth', 5 as Quality, 0 as Streak)
 * = floor((17 × 1.5) + (0 × 5))
 * = floor(25.5 + 0)
 * = 25 XP
 */
export function calculateXP(
  category: Category,
  quality: Quality,
  streak: Streak
): number {
  const timer = startTimer('calculateXP');

  try {
    // STEP 1: Validate category
    if (!isValidCategory(category)) {
      throw new InvalidCategoryError(category);
    }

    // STEP 2: Get base XP for category
    const baseXP = BASE_XP[category];
    if (baseXP === undefined) {
      throw new LogicError(`No base XP defined for category: ${category}`);
    }

    // STEP 3: Get quality multiplier
    const multiplier = getQualityMultiplier(quality);
    if (multiplier === undefined) {
      throw new LogicError(`Invalid quality multiplier for quality: ${quality}`);
    }

    // STEP 4: Calculate base score (BaseXP × Multiplier)
    const baseScore = baseXP * multiplier;

    // STEP 5: Calculate streak bonus (Streak × 5)
    const streakBonus = streak * STREAK_BONUS_PER_DAY;

    // STEP 6: Total before flooring
    const totalBeforeFloor = baseScore + streakBonus;

    // STEP 7: Floor to integer
    const xpEarned = floorXP(totalBeforeFloor);

    // STEP 8: Sanity check
    if (!Number.isInteger(xpEarned) || xpEarned < 0) {
      throw new LogicError(
        `XP calculation produced invalid result: ${xpEarned}`
      );
    }

    // Log for debugging
    logXPCalculation(category, quality, streak, {
      baseXP,
      multiplier,
      xpEarned
    });

    timer.end();
    return xpEarned;
  } catch (error) {
    timer.end();
    throw error;
  }
}

/**
 * Get detailed XP calculation breakdown (for UI display)
 * 
 * Returns all intermediate values for transparency
 * Useful for showing user: "50 base + 35 streak bonus = 85 XP"
 * 
 * @param category - Category enum
 * @param quality - Quality rating 1-10
 * @param streak - Streak count
 * @returns Detailed calculation object
 * 
 * @example
 * const breakdown = getXPBreakdown('Career', 9 as Quality, 7 as Streak);
 * // {
 * //   baseXP: 20,
 * //   multiplier: 2.5,
 * //   baseScore: 50,
 * //   streakBonus: 35,
 * //   totalXP: 85
 * // }
 */
export function getXPBreakdown(
  category: Category,
  quality: Quality,
  streak: Streak
): XPCalculation {
  if (!isValidCategory(category)) {
    throw new InvalidCategoryError(category);
  }

  const baseXP = BASE_XP[category];
  const multiplier = getQualityMultiplier(quality);
  const baseScore = baseXP * multiplier;
  const streakBonus = streak * STREAK_BONUS_PER_DAY;
  const totalXP = floorXP(baseScore + streakBonus);

  return {
    baseXP,
    multiplier,
    baseScore,
    streakBonus,
    totalXP
  };
}

// ═══════════════════════════════════════════════════════════════════════
// LEVEL UP CHECK
// ═══════════════════════════════════════════════════════════════════════

/**
 * Determine if user leveled up and calculate new level
 * 
 * Leveling formula:
 *   Level = 1 + floor(TotalXP / 100)
 * 
 * Examples:
 *   0-99 XP → Level 1
 *   100-199 XP → Level 2
 *   200-299 XP → Level 3
 *   500 XP → Level 6
 *   1000 XP → Level 11
 * 
 * @param totalXP - Total accumulated XP
 * @param currentLevel - Current level before this goal
 * @returns {leveledUp, newLevel, levelsGained}
 * 
 * @example
 * checkLevelUp(95, 1)
 * // → {leveledUp: false, newLevel: 1, levelsGained: 0}
 * 
 * @example
 * checkLevelUp(105, 1)
 * // → {leveledUp: true, newLevel: 2, levelsGained: 1}
 * 
 * @example
 * checkLevelUp(500, 1)
 * // → {leveledUp: true, newLevel: 6, levelsGained: 5}
 */
export function checkLevelUp(
  totalXP: number,
  currentLevel: number
): LevelUpResult {
  const timer = startTimer('checkLevelUp');

  try {
    // Calculate what level user should be at
    const newLevel = 1 + Math.floor(totalXP / XP_PER_LEVEL);

    // Check if leveled up
    const leveledUp = newLevel > currentLevel;
    const levelsGained = leveledUp ? newLevel - currentLevel : 0;

    timer.end();

    return {
      leveledUp,
      newLevel,
      levelsGained
    };
  } catch (error) {
    timer.end();
    throw error;
  }
}

/**
 * Get XP required to reach a specific level
 * 
 * @param level - Target level
 * @returns Cumulative XP needed
 * 
 * @example
 * getXPRequiredForLevel(1) → 100
 * getXPRequiredForLevel(2) → 200
 * getXPRequiredForLevel(10) → 1000
 */
export function getXPRequiredForLevel(level: number): number {
  return level * XP_PER_LEVEL;
}

/**
 * Get XP progress to next level
 * 
 * @param totalXP - Current total XP
 * @returns {currentLevel, xpInLevel, xpRequiredForLevel, progressPercent}
 * 
 * @example
 * getLevelProgress(150)
 * // → {
 * //   currentLevel: 2,
 * //   xpInLevel: 50,          (100-199 range, so 150-100=50)
 * //   xpRequiredForLevel: 100, (need 100 to go from level 2 to 3)
 * //   progressPercent: 50      (50% to level 3)
 * // }
 */
export function getLevelProgress(totalXP: number) {
  const currentLevel = 1 + Math.floor(totalXP / XP_PER_LEVEL);
  const xpAtLevelStart = (currentLevel - 1) * XP_PER_LEVEL;
  const xpInLevel = totalXP - xpAtLevelStart;
  const xpRequiredForLevel = XP_PER_LEVEL;
  const progressPercent = Math.round((xpInLevel / xpRequiredForLevel) * 100);

  return {
    currentLevel,
    xpInLevel,
    xpRequiredForLevel,
    progressPercent
  };
}

// ═══════════════════════════════════════════════════════════════════════
// STREAK CALCULATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculate streak based on last completion timestamp
 * 
 * Logic:
 * - If never completed (null): streak = 1
 * - If completed yesterday: streak = previous + 1 (continue)
 * - If completed > 1 day ago: streak = 1 (reset)
 * - If completed today: This shouldn't reach here (caught earlier)
 * 
 * @param lastCompletedAt - Timestamp of last completion (or null)
 * @param previousStreak - Previous streak count (from database)
 * @returns {streak, isReset, daysGap}
 * 
 * @example
 * // Yesterday: continue streak
 * calculateStreak(DateTime.now().minus({days: 1}), 5)
 * // → {streak: 6, isReset: false, daysGap: 1}
 * 
 * @example
 * // 3 days ago: reset streak
 * calculateStreak(DateTime.now().minus({days: 3}), 5)
 * // → {streak: 1, isReset: true, daysGap: 3}
 * 
 * @example
 * // First time: new streak
 * calculateStreak(null, 0)
 * // → {streak: 1, isReset: false, daysGap: 0}
 */
export function calculateStreak(
  lastCompletedAt: Date | null,
  previousStreak: number
): StreakCalculation {
  const timer = startTimer('calculateStreak');

  try {
    // Case 1: Never completed before
    if (lastCompletedAt === null) {
      timer.end();
      return {
        streak: 1 as Streak,
        isReset: false,
        daysGap: 0
      };
    }

    // Calculate days since last completion
    const now = new Date();
    const lastDate = new Date(lastCompletedAt);
    const diffMs = now.getTime() - lastDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const daysGap = Math.floor(diffHours / 24);

    // Case 2: Completed yesterday → continue streak
    if (daysGap === 1) {
      timer.end();
      return {
        streak: (previousStreak + 1) as Streak,
        isReset: false,
        daysGap
      };
    }

    // Case 3: Completed > 1 day ago → reset streak
    if (daysGap > 1) {
      timer.end();
      return {
        streak: 1 as Streak,
        isReset: true,
        daysGap
      };
    }

    // Case 4: Same day or future (shouldn't happen)
    if (daysGap <= 0) {
      throw new LogicError(
        `Streak calculation: goal completed less than 1 day ago (${daysGap} days)`
      );
    }

    throw new LogicError('Unreachable code in calculateStreak');
  } catch (error) {
    timer.end();
    throw error;
  }
}

/**
 * Check if completing goal now would continue streak
 * Used for frontend to show user if streak will be maintained
 * 
 * @param lastCompletedAt - Last completion timestamp
 * @returns true if streak would continue, false if reset
 */
export function wouldStreakContinue(lastCompletedAt: Date | null): boolean {
  if (lastCompletedAt === null) {
    return true; // First completion, streak = 1
  }

  const now = new Date();
  const lastDate = new Date(lastCompletedAt);
  const diffMs = now.getTime() - lastDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const daysGap = Math.floor(diffHours / 24);

  return daysGap === 1;
}

/**
 * Get hours until streak resets
 * Shows user how much time they have to maintain streak
 * 
 * @param lastCompletedAt - Last completion timestamp
 * @returns Hours remaining (or -1 if already reset)
 * 
 * @example
 * // Last completed 23 hours ago
 * getHoursUntilStreakReset(DateTime.now().minus({hours: 23}))
 * // → 1 hour remaining
 */
export function getHoursUntilStreakReset(lastCompletedAt: Date | null): number {
  if (lastCompletedAt === null) {
    return STREAK_CONTINUATION_HOURS; // New goal, have full window
  }

  const now = new Date();
  const lastDate = new Date(lastCompletedAt);
  const diffMs = now.getTime() - lastDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const hoursRemaining = STREAK_CONTINUATION_HOURS - diffHours;

  return Math.max(0, Math.ceil(hoursRemaining));
}

// ═══════════════════════════════════════════════════════════════════════
// QUALITY TIER HELPERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get quality multiplier for a quality rating
 * 
 * @param quality - 1-10 rating
 * @returns 1.0, 1.5, 2.0, or 2.5
 * 
 * @example
 * getQualityMultiplier(3) → 1.0
 * getQualityMultiplier(5) → 1.5
 * getQualityMultiplier(9) → 2.5
 */
export function getMultiplierForQuality(quality: Quality): QualityTier {
  return getQualityMultiplier(quality);
}

/**
 * Get human-readable label for quality tier
 * 
 * @param quality - 1-10 rating
 * @returns "Low", "Medium", "High", or "Very High"
 */
export function getQualityLabel(quality: Quality): string {
  if (quality <= 3) return 'Low';
  if (quality <= 6) return 'Medium';
  if (quality <= 8) return 'High';
  return 'Very High';
}

/**
 * Get quality description for UI
 * 
 * @param quality - 1-10 rating
 * @returns Description string
 */
export function getQualityDescription(quality: Quality): string {
  if (quality <= 2) return 'Minimal effort, routine task';
  if (quality <= 3) return 'Basic effort, standard completion';
  if (quality <= 5) return 'Good effort, meaningful work';
  if (quality <= 6) return 'Strong effort, important achievement';
  if (quality <= 7) return 'Excellent effort, significant breakthrough';
  if (quality <= 8) return 'Outstanding effort, major accomplishment';
  if (quality <= 9) return 'Exceptional effort, transformative result';
  return 'Peak performance, life-changing achievement';
}

// ═══════════════════════════════════════════════════════════════════════
// CATEGORY HELPERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get base XP for a category
 * 
 * @param category - Category enum
 * @returns Base XP value (10-20)
 */
export function getBaseXPForCategory(category: Category): number {
  return BASE_XP[category];
}

/**
 * Get category label (for display)
 * 
 * @param category - Category enum
 * @returns Display name
 */
export function getCategoryLabel(category: Category): string {
  return category; // Already a readable string
}

/**
 * Get category description
 * 
 * @param category - Category enum
 * @returns Description string
 */
export function getCategoryDescription(category: Category): string {
  const descriptions: Record<Category, string> = {
    [Category.Career]: 'Professional growth and work achievement',
    [Category.Knowledge]: 'Learning and intellectual development',
    [Category.Wealth]: 'Financial health and security',
    [Category.Health]: 'Physical and mental wellbeing',
    [Category.Relationships]: 'Social connections and personal bonds',
    [Category.Mindfulness]: 'Mental peace and self-reflection'
  };
  return descriptions[category];
}

// ═══════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Validate quality is valid (1-10 integer)
 * Should be called by validation layer before using calculateXP
 * 
 * @param quality - Value to check
 * @returns true if valid
 */
export function isValidQualityValue(quality: any): boolean {
  return Number.isInteger(quality) && quality >= 1 && quality <= 10;
}

/**
 * Validate streak is valid (non-negative integer)
 * Should be called by validation layer before using calculateXP
 * 
 * @param streak - Value to check
 * @returns true if valid
 */
export function isValidStreakValue(streak: any): boolean {
  return Number.isInteger(streak) && streak >= 0;
}

/**
 * Validate total XP is valid
 * 
 * @param totalXP - Value to check
 * @returns true if valid
 */
export function isValidTotalXP(totalXP: any): boolean {
  return Number.isInteger(totalXP) && totalXP >= 0;
}

/**
 * Validate level is valid
 * 
 * @param level - Value to check
 * @returns true if valid
 */
export function isValidLevelValue(level: any): boolean {
  return Number.isInteger(level) && level >= 1;
}
