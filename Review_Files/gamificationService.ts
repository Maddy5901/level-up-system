/**
 * Gamification Service - Orchestration Layer
 * 
 * Coordinates:
 * - Input validation (Zod schemas)
 * - Data fetching (from Supabase)
 * - Pure calculations (xpCalculator)
 * - Database transactions (atomic updates)
 * - Result aggregation (stats, radar data)
 * - Logging (all operations)
 * 
 * This file is the bridge between:
 * - Frontend API (received via routes)
 * - Pure functions (xpCalculator)
 * - Database (Supabase)
 */

import {
  Category,
  Quality,
  Streak,
  CompleteGoalInput,
  CompletionResult,
  RadarChartData,
  Goal,
  User,
  Completion,
  Stats,
  AlreadyCompletedTodayError,
  UnauthorizedError,
  GoalNotFoundError,
  UserNotFoundError,
  DatabaseTransactionError,
  DuplicateCompletionError,
  InvalidQualityError,
  LogicError,
  createQuality,
  createStreak
} from './types';
import {
  calculateXP,
  checkLevelUp,
  calculateStreak,
  getXPBreakdown,
  wouldStreakContinue
} from './xpCalculator';
import {
  CompleteGoalInputSchema,
  validateCompleteGoalInput,
  validateCompleteGoalInputSafe,
  formatValidationErrors
} from './schemas';
import {
  log,
  logOperationStart,
  logOperationSuccess,
  logOperationFailure,
  startTimer
} from './logger';
import { isValidSubcategory } from './constants';

// ═══════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT (stub for now - replace with actual Supabase)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Placeholder for Supabase client
 * In real implementation, use: import { createClient } from '@supabase/supabase-js'
 * 
 * For now, interface shows what DB calls look like
 */
interface SupabaseClient {
  from(table: string): {
    select(): { data: any[] };
    insert(data: any): void;
    update(data: any): void;
  };
}

// TODO: Replace with actual Supabase client
// const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Mock Supabase client for testing
 * Replace this with real Supabase when integrating
 */
let supabaseClient: SupabaseClient | null = null;

export function setSupabaseClient(client: SupabaseClient) {
  supabaseClient = client;
}

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call setSupabaseClient() first.');
  }
  return supabaseClient;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN OPERATION: COMPLETE GOAL
// ═══════════════════════════════════════════════════════════════════════

/**
 * Complete a goal and handle XP calculation, level up, stats, etc.
 * 
 * This is the main entry point for goal completion.
 * 
 * PROCESS:
 * 1. Validate input (goalId, userId, quality)
 * 2. Fetch goal record (get category, frequency, last_completed_at)
 * 3. Fetch user record (get total_xp, current_level)
 * 4. Calculate streak from time gap
 * 5. Calculate XP earned using formula
 * 6. Calculate new level and check if leveled up
 * 7. DATABASE TRANSACTION:
 *    - Update user (total_xp, current_level)
 *    - Insert completion record
 *    - Update goal (streak_count, last_completed_at)
 *    - Insert stats record
 * 8. Aggregate stats for radar chart
 * 9. Return result to client
 * 
 * @param input - {goalId, userId, quality}
 * @returns CompletionResult with XP, level, stats, etc.
 * 
 * @throws {InvalidQualityError} If quality not 1-10
 * @throws {UnauthorizedError} If goal doesn't belong to user
 * @throws {AlreadyCompletedTodayError} If daily goal done today
 * @throws {GoalNotFoundError} If goal doesn't exist
 * @throws {UserNotFoundError} If user doesn't exist
 * @throws {DatabaseTransactionError} If DB operation fails
 * 
 * @example
 * const result = await completeGoal({
 *   goalId: 'g123',
 *   userId: 'u456',
 *   quality: 7
 * });
 * 
 * // Result:
 * // {
 * //   xpEarned: 85,
 * //   leveledUp: true,
 * //   newLevel: 11,
 * //   levelsGained: 1,
 * //   completionId: 'c789',
 * //   newTotalXP: 1050,
 * //   newStats: {Career: 1250, Health: 890, ...}
 * // }
 */
export async function completeGoal(
  input: unknown
): Promise<CompletionResult> {
  const timer = startTimer('completeGoal (orchestration)');

  try {
    // ─────────────────────────────────────────────────────────────
    // STEP 1: VALIDATE INPUT
    // ─────────────────────────────────────────────────────────────
    let validInput: typeof CompleteGoalInputSchema._type;
    try {
      validInput = validateCompleteGoalInput(input);
    } catch (error) {
      if (error instanceof Error) {
        const messages = formatValidationErrors(error as any);
        log.warn('CompleteGoal: Validation failed', { errors: messages });
        throw new InvalidQualityError((input as any)?.quality);
      }
      throw error;
    }

    const { goalId, userId, quality } = validInput;

    logOperationStart('completeGoal', { goalId, userId, quality });

    // Convert to branded types
    const qualityTyped = createQuality(quality);

    // ─────────────────────────────────────────────────────────────
    // STEP 2: FETCH GOAL RECORD
    // ─────────────────────────────────────────────────────────────
    log.debug('Fetching goal record', { goalId, userId });

    const goal = await fetchGoal(goalId, userId);

    if (!goal) {
      throw new GoalNotFoundError(goalId);
    }

    // Verify subcategory is valid for this category
    if (!isValidSubcategory(goal.category as Category, goal.subcategory)) {
      throw new LogicError(
        `Invalid subcategory: ${goal.subcategory} for category ${goal.category}`
      );
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: CHECK IF ALREADY COMPLETED TODAY (daily goals only)
    // ─────────────────────────────────────────────────────────────
    if (goal.frequency === 'daily') {
      const alreadyCompletedToday = await checkAlreadyCompletedToday(
        goalId,
        userId
      );

      if (alreadyCompletedToday) {
        throw new AlreadyCompletedTodayError(goalId);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 4: FETCH USER RECORD
    // ─────────────────────────────────────────────────────────────
    log.debug('Fetching user record', { userId });

    const user = await fetchUser(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 5: CALCULATE STREAK
    // ─────────────────────────────────────────────────────────────
    let streak: Streak;

    if (goal.frequency === 'daily') {
      const streakResult = calculateStreak(goal.last_completed_at, goal.streak_count);
      streak = streakResult.streak;

      if (streakResult.isReset) {
        log.debug('Streak reset', { goalId, previousStreak: goal.streak_count });
      } else {
        log.debug('Streak continued', { goalId, newStreak: streak });
      }
    } else {
      // Non-daily goals don't have streaks
      streak = 0 as Streak;
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 6: CALCULATE XP EARNED
    // ─────────────────────────────────────────────────────────────
    log.debug('Calculating XP', {
      category: goal.category,
      quality,
      streak
    });

    const xpEarned = calculateXP(goal.category as Category, qualityTyped, streak);

    // ─────────────────────────────────────────────────────────────
    // STEP 7: CALCULATE NEW TOTAL XP & CHECK LEVEL UP
    // ─────────────────────────────────────────────────────────────
    const newTotalXP = user.total_xp + xpEarned;

    log.debug('Checking level up', {
      currentTotalXP: user.total_xp,
      xpEarned,
      newTotalXP,
      currentLevel: user.current_level
    });

    const levelResult = checkLevelUp(newTotalXP, user.current_level);

    if (levelResult.leveledUp) {
      log.info('User leveled up', {
        userId,
        oldLevel: user.current_level,
        newLevel: levelResult.newLevel,
        levelsGained: levelResult.levelsGained,
        xpEarned
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 8: DATABASE TRANSACTION
    // ─────────────────────────────────────────────────────────────
    log.debug('Starting database transaction');

    let completionId: string;
    try {
      // All DB operations must succeed or all rollback
      // This is where atomicity matters (prevent partial updates)

      // 8a. Update users table
      await updateUserXP(userId, newTotalXP, levelResult.newLevel);
      log.debug('Updated user XP and level', {
        userId,
        newTotalXP,
        newLevel: levelResult.newLevel
      });

      // 8b. Insert completion record
      completionId = await insertCompletion({
        goalId,
        userId,
        xpEarned,
        quality: qualityTyped,
        streak
      });
      log.debug('Inserted completion record', { completionId });

      // 8c. Update goal streak
      if (goal.frequency === 'daily') {
        await updateGoalStreak(goalId, streak);
        log.debug('Updated goal streak', { goalId, streak });
      }

      // 8d. Insert stats record
      await insertStats({
        userId,
        category: goal.category as Category,
        subcategory: goal.subcategory,
        points: xpEarned
      });
      log.debug('Inserted stats record', {
        userId,
        category: goal.category,
        subcategory: goal.subcategory,
        points: xpEarned
      });
    } catch (error) {
      // If any DB operation fails, rollback (in real Supabase, this happens automatically)
      log.error('Database transaction failed', error instanceof Error ? error : new Error(String(error)));
      throw new DatabaseTransactionError('goal completion', error instanceof Error ? error : undefined);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 9: AGGREGATE STATS FOR RADAR CHART
    // ─────────────────────────────────────────────────────────────
    log.debug('Aggregating stats for radar chart', { userId });

    const newStats = await aggregateStats(userId);

    // ─────────────────────────────────────────────────────────────
    // STEP 10: RETURN SUCCESS RESULT
    // ─────────────────────────────────────────────────────────────
    const result: CompletionResult = {
      xpEarned,
      leveledUp: levelResult.leveledUp,
      newLevel: levelResult.newLevel,
      levelsGained: levelResult.levelsGained,
      completionId,
      newTotalXP,
      newStats
    };

    logOperationSuccess('completeGoal', {
      xpEarned,
      leveledUp: levelResult.leveledUp,
      newLevel: levelResult.newLevel,
      completionId
    });

    timer.end();
    return result;
  } catch (error) {
    logOperationFailure('completeGoal', error instanceof Error ? error : new Error(String(error)));
    timer.end();
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DATABASE HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch goal by ID and verify it belongs to user
 */
async function fetchGoal(goalId: string, userId: string): Promise<Goal | null> {
  try {
    // TODO: Replace with real Supabase query
    // const { data, error } = await supabase
    //   .from('goals')
    //   .select('*')
    //   .eq('id', goalId)
    //   .eq('user_id', userId)
    //   .single();

    // For now, return null (implement with real DB)
    return null;
  } catch (error) {
    log.error('fetchGoal failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Check if goal already completed today
 */
async function checkAlreadyCompletedToday(
  goalId: string,
  userId: string
): Promise<boolean> {
  try {
    // TODO: Replace with real Supabase query
    // const { data } = await supabase
    //   .from('completions')
    //   .select('id')
    //   .eq('goal_id', goalId)
    //   .eq('user_id', userId)
    //   .gte('completed_at', new Date().toDateString())
    //   .limit(1);

    // For now, return false (implement with real DB)
    return false;
  } catch (error) {
    log.error('checkAlreadyCompletedToday failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Fetch user by ID
 */
async function fetchUser(userId: string): Promise<User | null> {
  try {
    // TODO: Replace with real Supabase query
    // const { data, error } = await supabase
    //   .from('users')
    //   .select('id, total_xp, current_level')
    //   .eq('id', userId)
    //   .single();

    // For now, return null (implement with real DB)
    return null;
  } catch (error) {
    log.error('fetchUser failed', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Update user's total_xp and current_level
 */
async function updateUserXP(
  userId: string,
  newTotalXP: number,
  newLevel: number
): Promise<void> {
  try {
    // TODO: Replace with real Supabase query
    // const { error } = await supabase
    //   .from('users')
    //   .update({ total_xp: newTotalXP, current_level: newLevel })
    //   .eq('id', userId);

    // For now, do nothing (implement with real DB)
  } catch (error) {
    throw new DatabaseTransactionError(
      'updateUserXP',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Insert completion record
 */
async function insertCompletion(params: {
  goalId: string;
  userId: string;
  xpEarned: number;
  quality: Quality;
  streak: Streak;
}): Promise<string> {
  try {
    // TODO: Replace with real Supabase query
    // const { data, error } = await supabase
    //   .from('completions')
    //   .insert([{
    //     goal_id: params.goalId,
    //     user_id: params.userId,
    //     xp_earned: params.xpEarned,
    //     quality_rating: params.quality,
    //     streak_count: params.streak,
    //     completed_at: new Date()
    //   }])
    //   .select('id')
    //   .single();

    // For now, return mock ID (implement with real DB)
    return 'c-' + Date.now();
  } catch (error) {
    throw new DatabaseTransactionError(
      'insertCompletion',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Update goal's streak count and last_completed_at
 */
async function updateGoalStreak(
  goalId: string,
  streak: Streak
): Promise<void> {
  try {
    // TODO: Replace with real Supabase query
    // const { error } = await supabase
    //   .from('goals')
    //   .update({
    //     streak_count: streak,
    //     last_completed_at: new Date()
    //   })
    //   .eq('id', goalId);

    // For now, do nothing (implement with real DB)
  } catch (error) {
    throw new DatabaseTransactionError(
      'updateGoalStreak',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Insert stats record (for radar chart)
 */
async function insertStats(params: {
  userId: string;
  category: Category;
  subcategory: string;
  points: number;
}): Promise<void> {
  try {
    // TODO: Replace with real Supabase query
    // const { error } = await supabase
    //   .from('stats')
    //   .insert([{
    //     user_id: params.userId,
    //     category: params.category,
    //     subcategory: params.subcategory,
    //     points: params.points,
    //     completed_at: new Date()
    //   }]);

    // For now, do nothing (implement with real DB)
  } catch (error) {
    throw new DatabaseTransactionError(
      'insertStats',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Aggregate stats by category for radar chart
 */
export async function aggregateStats(userId: string): Promise<RadarChartData> {
  try {
    // TODO: Replace with real Supabase query
    // const { data } = await supabase
    //   .from('stats')
    //   .select('category, points')
    //   .eq('user_id', userId);
    //
    // const aggregated = {
    //   Career: 0,
    //   Knowledge: 0,
    //   Wealth: 0,
    //   Health: 0,
    //   Relationships: 0,
    //   Mindfulness: 0
    // };
    //
    // data.forEach(record => {
    //   aggregated[record.category] += record.points;
    // });

    // For now, return zero stats (implement with real DB)
    return {
      Career: 0,
      Knowledge: 0,
      Wealth: 0,
      Health: 0,
      Relationships: 0,
      Mindfulness: 0
    };
  } catch (error) {
    log.error('aggregateStats failed', error instanceof Error ? error : new Error(String(error)));
    // Return zeros if aggregation fails (non-critical)
    return {
      Career: 0,
      Knowledge: 0,
      Wealth: 0,
      Health: 0,
      Relationships: 0,
      Mindfulness: 0
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ADDITIONAL PUBLIC FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get user's current game state
 * 
 * @param userId - User ID
 * @returns {level, totalXP, stats}
 */
export async function getUserGameState(userId: string) {
  const user = await fetchUser(userId);
  const stats = await aggregateStats(userId);

  if (!user) {
    throw new UserNotFoundError(userId);
  }

  return {
    level: user.current_level,
    totalXP: user.total_xp,
    stats
  };
}

/**
 * Get a specific goal's information
 * 
 * @param goalId - Goal ID
 * @param userId - User ID (for authorization)
 * @returns Goal object
 */
export async function getGoal(goalId: string, userId: string): Promise<Goal> {
  const goal = await fetchGoal(goalId, userId);

  if (!goal) {
    throw new GoalNotFoundError(goalId);
  }

  return goal;
}

/**
 * Check if user can complete a goal right now
 * (used for frontend: disable/enable button)
 * 
 * @param goalId - Goal ID
 * @param userId - User ID
 * @returns {canComplete, reason}
 */
export async function canCompleteGoal(
  goalId: string,
  userId: string
): Promise<{ canComplete: boolean; reason?: string }> {
  try {
    const goal = await fetchGoal(goalId, userId);

    if (!goal) {
      return { canComplete: false, reason: 'Goal not found' };
    }

    if (goal.frequency === 'daily') {
      const alreadyDone = await checkAlreadyCompletedToday(goalId, userId);
      if (alreadyDone) {
        return { canComplete: false, reason: 'Already completed today' };
      }
    }

    return { canComplete: true };
  } catch (error) {
    log.error('canCompleteGoal failed', error instanceof Error ? error : new Error(String(error)));
    return { canComplete: false, reason: 'Error checking goal status' };
  }
}
