
export const BASE_XP: Record<string, number> = {
  Career: 20,
  Knowledge: 18,
  Wealth: 17,
  Health: 15,
  Relationships: 12,
  Mindfulness: 10
};

export const QUALITY_MULTIPLIERS: Record<number, number> = {
  1: 1.0, 2: 1.0, 3: 1.0,
  4: 1.5, 5: 1.5, 6: 1.5,
  7: 2.0, 8: 2.0,
  9: 2.5, 10: 2.5
};

export const QUALITY_MIN = 1;
export const QUALITY_MAX = 10;
export const STREAK_BONUS_PER_DAY = 5;
export const STREAK_MAX_BONUS_DAYS = 30;
export const STREAK_CONTINUATION_HOURS = 24;
export const XP_PER_LEVEL = 100;

export const SUBCATEGORIES: Record<string, string[]> = {
  Career: ['Skill Development', 'Networking', 'Performance'],
  Knowledge: ['Reading', 'Courses', 'Practice'],
  Wealth: ['Income', 'Savings', 'Investment'],
  Health: ['Physical', 'Mental', 'Spiritual'],
  Relationships: ['Family', 'Friends', 'Romance'],
  Mindfulness: ['Meditation', 'Gratitude', 'Reflection']
};

export function isValidSubcategory(category: string, subcategory: string): boolean {
  return SUBCATEGORIES[category]?.includes(subcategory) ?? false;
}

export function getQualityMultiplier(quality: number): number {
  if (quality <= 3) return 1.0;
  if (quality <= 6) return 1.5;
  if (quality <= 8) return 2.0;
  return 2.5;
}

export function floorXP(value: number): number {
  return Math.floor(value);
}

export function calculateLevel(totalXP: number): number {
  return 1 + Math.floor(totalXP / XP_PER_LEVEL);
}
