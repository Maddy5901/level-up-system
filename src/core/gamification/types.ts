/**
 * Gamification Type System
 */

export type Quality = number & { readonly __brand: 'Quality' };
export function createQuality(value: number): Quality {
  if (!Number.isInteger(value) || value < 1 || value > 10) {
    throw new InvalidQualityError(value);
  }
  return value as Quality;
}

export type Streak = number & { readonly __brand: 'Streak' };
export function createStreak(value: number): Streak {
  if (!Number.isInteger(value) || value < 0) {
    throw new InvalidStreakError(value);
  }
  return value as Streak;
}

// Use const objects instead of enums (erasableSyntaxOnly compatible)
export const Category = {
  CAREER: 'Career',
  KNOWLEDGE: 'Knowledge',
  WEALTH: 'Wealth',
  HEALTH: 'Health',
  RELATIONSHIPS: 'Relationships',
  MINDFULNESS: 'Mindfulness'
} as const;
export type Category = typeof Category[keyof typeof Category];

export const GoalFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ONE_TIME: 'one-time'
} as const;
export type GoalFrequency = typeof GoalFrequency[keyof typeof GoalFrequency];

export const QualityTier = {
  LOW: 1.0,
  MEDIUM: 1.5,
  HIGH: 2.0,
  VERY_HIGH: 2.5
} as const;
export type QualityTier = typeof QualityTier[keyof typeof QualityTier];

// INPUT/OUTPUT
export interface CompleteGoalInput {
  goalId: string;
  quality: number;
  completionRequestId?: string;
}

export interface XPCalculation {
  baseXP: number;
  multiplier: number;
  baseScore: number;
  streakBonus: number;
  totalXP: number;
}

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel: number;
  levelsGained: number;
}

export interface StreakCalculation {
  streak: Streak;
  isReset: boolean;
  daysGap: number;
}

export interface CompletionResult {
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
  levelsGained: number;
  completionId: string;
  newTotalXP: number;
  newStats: RadarChartData;
}

export interface RadarChartData {
  Career: number;
  Knowledge: number;
  Wealth: number;
  Health: number;
  Relationships: number;
  Mindfulness: number;
}

// DATABASE TYPES
export interface User {
  id: string;
  email: string;
  username: string;
  total_xp: number;
  current_level: number;
}

export interface Goal {
  id: string;
  user_id: string;
  category: string;
  subcategory: string;
  title: string;
  frequency: string;
  streak_count: number;
  last_completed_at: Date | null;
}

// ERROR CLASSES
export class InvalidQualityError extends Error {
  constructor(value: any) {
    super(`Invalid quality: ${value}. Must be 1-10.`);
    this.name = 'InvalidQualityError';
  }
}

export class InvalidStreakError extends Error {
  constructor(value: any) {
    super(`Invalid streak: ${value}. Must be non-negative.`);
    this.name = 'InvalidStreakError';
  }
}

export class InvalidCategoryError extends Error {
  constructor(value: any) {
    super(`Invalid category: ${value}`);
    this.name = 'InvalidCategoryError';
  }
}

export class GoalNotFoundError extends Error {
  constructor(goalId: string) {
    super(`Goal not found: ${goalId}`);
    this.name = 'GoalNotFoundError';
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class AlreadyCompletedTodayError extends Error {
  constructor(goalId: string) {
    super(`Already completed today: ${goalId}`);
    this.name = 'AlreadyCompletedTodayError';
  }
}

export class DatabaseTransactionError extends Error {
  constructor(operation: string) {
    super(`DB transaction failed: ${operation}`);
    this.name = 'DatabaseTransactionError';
  }
}

export class LogicError extends Error {
  constructor(message: string) {
    super(`Logic error: ${message}`);
    this.name = 'LogicError';
  }
}

export function isValidCategory(value: any): value is Category {
  return Object.values(Category).includes(value);
}
