import type {
  CompletionResult,
  RadarChartData,
  Goal
} from './types';
import {
  AlreadyCompletedTodayError,
  GoalNotFoundError,
  UserNotFoundError,
  DatabaseTransactionError,
  InvalidQualityError
} from './types';
import {
  calculateXP,
  checkLevelUp,
  calculateStreak
} from './xpCalculator';
import {
  validateCompleteGoalInput,
  formatValidationErrors,
  type CompleteGoalInput
} from './schemas';
import {
  logOperationStart,
  logOperationSuccess,
  logOperationFailure,
  startTimer
} from './logger';

interface SupabaseClient {
  auth: {
    getUser(): Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  from(table: string): unknown;
  rpc(fn: string, params: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}

let supabaseClient: SupabaseClient | null = null;

export function setSupabaseClient(client: SupabaseClient) {
  supabaseClient = client;
}

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialised. Call setSupabaseClient() first.');
  }
  return supabaseClient;
}

export async function completeGoal(input: unknown): Promise<CompletionResult> {
  const timer = startTimer('completeGoal');

  try {
    let validInput: CompleteGoalInput;
    try {
      validInput = validateCompleteGoalInput(input);
    } catch (error) {
      formatValidationErrors(error as unknown as any);

      throw new InvalidQualityError((input as any)?.quality);
    }

    const { goalId, quality, completionRequestId } = validInput;

    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      throw new UserNotFoundError('(unauthenticated)');
    }

    const userId = authData.user.id;

    logOperationStart('completeGoal', { goalId, userId, quality });

    const goal = await fetchGoal(goalId, userId);
    if (!goal) throw new GoalNotFoundError(goalId);

    if (goal.frequency === 'daily') {
      const alreadyDone = await checkAlreadyCompletedToday(goalId, userId);
      if (alreadyDone) throw new AlreadyCompletedTodayError(goalId);
    }

    let streak = 0;
    if (goal.frequency === 'daily') {
      const streakResult = calculateStreak(goal.last_completed_at, goal.streak_count);
      streak = streakResult.streak;
    }

    const xpEarned = calculateXP(goal.category, quality as any, streak as any);

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'complete_goal_transaction',
      {
        p_user_id: userId,
        p_goal_id: goalId,
        p_xp_earned: xpEarned,
        p_quality: quality,
        p_new_streak: streak,
        p_category: goal.category,
        p_subcategory: goal.subcategory,
        p_request_id: completionRequestId ?? null
      }
    );

    if (rpcError) {
      throw new DatabaseTransactionError('complete_goal_transaction');
    }

    const result = rpcResult as any;
    if (result?.already_done) {
      throw new AlreadyCompletedTodayError(goalId);
    }

    const { completion_id, new_total_xp, new_level } = result;
    const levelResult = checkLevelUp(new_total_xp, goal.streak_count);

    const newStats = await aggregateStats(userId);

    const completionResult: CompletionResult = {
      xpEarned,
      leveledUp: levelResult.leveledUp,
      newLevel: new_level,
      levelsGained: levelResult.levelsGained,
      completionId: completion_id,
      newTotalXP: new_total_xp,
      newStats
    };

    logOperationSuccess('completeGoal', {
      xpEarned,
      leveledUp: levelResult.leveledUp,
      newLevel: new_level,
      completionId: completion_id
    });

    timer.end();
    return completionResult;
  } catch (error) {
    logOperationFailure('completeGoal', error instanceof Error ? error : new Error(String(error)));
    timer.end();
    throw error;
  }
}

async function fetchGoal(goalId: string, userId: string): Promise<Goal | null> {
  const supabase = getSupabaseClient();
  try {
    const query = supabase.from('goals') as any;
    const { data, error } = await query
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

async function checkAlreadyCompletedToday(
  goalId: string,
  userId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  try {
    const query = supabase.from('completions') as any;
    const { data, error } = await query
      .select('id')
      .eq('goal_id', goalId)
      .eq('user_id', userId)
      .gte('completed_at', today)
      .lt('completed_at', nextDay(today))
      .limit(1);

    if (error) throw error;
    return data !== null && Array.isArray(data) && data.length > 0;
  } catch (error) {
    throw new DatabaseTransactionError('checkAlreadyCompletedToday');
  }
}

export async function aggregateStats(userId: string): Promise<RadarChartData> {
  const supabase = getSupabaseClient();
  try {
    const query = supabase.from('stats') as any;
    const { data, error } = await query
      .select('category, points')
      .eq('user_id', userId);

    if (error) throw error;

    const result: RadarChartData = {
      Career: 0,
      Knowledge: 0,
      Wealth: 0,
      Health: 0,
      Relationships: 0,
      Mindfulness: 0
    };

    (data ?? []).forEach((row: any) => {
      if (row.category in result) {
        (result as any)[row.category] += row.points;
      }
    });

    return result;
  } catch (error) {
    throw new DatabaseTransactionError('aggregateStats');
  }
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
