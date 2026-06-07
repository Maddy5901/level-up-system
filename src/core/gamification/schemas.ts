import { z } from 'zod';
import { QUALITY_MIN, QUALITY_MAX } from './constants';

export const CompleteGoalInputSchema = z.object({
  goalId: z.string().uuid('goalId must be a valid UUID'),
  quality: z.number().int().min(QUALITY_MIN).max(QUALITY_MAX),
  completionRequestId: z.string().uuid().optional()
});

export type CompleteGoalInput = z.infer<typeof CompleteGoalInputSchema>;

export const CalculateXPInputSchema = z.object({
  category: z.string(),
  quality: z.number().int().min(QUALITY_MIN).max(QUALITY_MAX),
  streak: z.number().int().min(0).max(10000)
});

export const CheckLevelUpInputSchema = z.object({
  totalXP: z.number().int().min(0).max(10_000_000),
  currentLevel: z.number().int().min(1).max(999_999)
});

export const CalculateStreakInputSchema = z.object({
  lastCompletedAt: z.date().nullable(),
  goalFrequency: z.string()
});

export const RadarChartDataSchema = z.object({
  Career: z.number().min(0),
  Knowledge: z.number().min(0),
  Wealth: z.number().min(0),
  Health: z.number().min(0),
  Relationships: z.number().min(0),
  Mindfulness: z.number().min(0)
});

export const CompletionResultSchema = z.object({
  xpEarned: z.number().int().min(0),
  leveledUp: z.boolean(),
  newLevel: z.number().int().min(1),
  levelsGained: z.number().int().min(0),
  completionId: z.string().uuid(),
  newTotalXP: z.number().int().min(0),
  newStats: RadarChartDataSchema
});

export function validateCompleteGoalInput(input: unknown) {
  return CompleteGoalInputSchema.parse(input);
}

export function validateCompleteGoalInputSafe(input: unknown) {
  return CompleteGoalInputSchema.safeParse(input);
}

export function formatValidationErrors(error: z.ZodError): string[] {
  return error.issues.map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

export function getFirstValidationError(error: z.ZodError): string {
  return formatValidationErrors(error)[0] || 'Unknown validation error';
}
