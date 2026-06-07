-- ═══════════════════════════════════════════════════════════════════════
-- XP SYSTEM: COMPLETE DATABASE MIGRATION
-- Run this in Supabase → SQL Editor
-- This creates ALL required tables + constraints + RPC function
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- TABLE 1: GOALS
-- ───────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,           -- 'Career', 'Knowledge', 'Wealth', 'Health', 'Relationships', 'Mindfulness'
  subcategory TEXT NOT NULL,        -- '18 subcategories across the 6 categories
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',  -- 'daily', 'weekly', 'monthly', 'one-time'
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_category CHECK (category IN ('Career', 'Knowledge', 'Wealth', 'Health', 'Relationships', 'Mindfulness')),
  CONSTRAINT valid_frequency CHECK (frequency IN ('daily', 'weekly', 'monthly', 'one-time')),
  CONSTRAINT positive_streak CHECK (streak_count >= 0)
);

-- Enable RLS on goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own goals
CREATE POLICY "Users can view own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_category ON public.goals(category);


-- ───────────────────────────────────────────────────────────────────────
-- TABLE 2: COMPLETIONS
-- ───────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  xp_earned INTEGER NOT NULL,
  quality_rating INTEGER NOT NULL,      -- 1-10 user quality rating
  streak_count INTEGER NOT NULL,        -- streak at time of completion
  completion_request_id UUID,           -- FIX 7: Idempotency key
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Computed column for daily uniqueness (FIX 2)
  completion_date DATE GENERATED ALWAYS AS (completed_at::date) STORED,
  
  -- Constraints
  CONSTRAINT positive_xp CHECK (xp_earned >= 0),
  CONSTRAINT valid_quality CHECK (quality_rating >= 1 AND quality_rating <= 10),
  CONSTRAINT non_negative_streak CHECK (streak_count >= 0)
);

-- Enable RLS on completions
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own completions
CREATE POLICY "Users can view own completions"
  ON public.completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON public.completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- FIX 2: Unique constraint prevents daily double-completion race condition
-- Only one completion per goal per calendar day
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_one_completion
  ON public.completions (goal_id, user_id, completion_date);

-- FIX 7: Unique constraint on idempotency key prevents replay attacks
CREATE UNIQUE INDEX IF NOT EXISTS idx_completions_idempotency
  ON public.completions (completion_request_id)
  WHERE completion_request_id IS NOT NULL;

-- Performance indexes
CREATE INDEX idx_completions_user_id ON public.completions(user_id);
CREATE INDEX idx_completions_goal_id ON public.completions(goal_id);
CREATE INDEX idx_completions_completed_at ON public.completions(completed_at);


-- ───────────────────────────────────────────────────────────────────────
-- TABLE 3: STATS (for radar chart aggregation)
-- ───────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,           -- Which of 6 categories
  subcategory TEXT NOT NULL,        -- Which of 18 subcategories
  points INTEGER NOT NULL,          -- XP earned
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_category CHECK (category IN ('Career', 'Knowledge', 'Wealth', 'Health', 'Relationships', 'Mindfulness')),
  CONSTRAINT positive_points CHECK (points >= 0)
);

-- Enable RLS on stats
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own stats
CREATE POLICY "Users can view own stats"
  ON public.stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON public.stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX idx_stats_user_id ON public.stats(user_id);
CREATE INDEX idx_stats_category ON public.stats(category);
CREATE INDEX idx_stats_completed_at ON public.stats(completed_at);


-- ───────────────────────────────────────────────────────────────────────
-- RPC FUNCTION: ATOMIC GOAL COMPLETION TRANSACTION
-- ───────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.complete_goal_transaction(
  p_user_id          UUID,
  p_goal_id          UUID,
  p_xp_earned        INTEGER,
  p_quality          INTEGER,
  p_new_streak       INTEGER,
  p_category         TEXT,
  p_subcategory      TEXT,
  p_request_id       UUID
)
RETURNS TABLE (
  completion_id      UUID,
  new_total_xp       INTEGER,
  new_level          INTEGER,
  already_done       BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completion_id    UUID;
  v_new_total_xp     INTEGER;
  v_new_level        INTEGER;
BEGIN

  -- ── IDEMPOTENCY CHECK ──────────────────────────────────────────────
  -- If this request_id was already processed, return existing result
  IF p_request_id IS NOT NULL THEN
    SELECT id INTO v_completion_id
      FROM completions
      WHERE completion_request_id = p_request_id
      LIMIT 1;

    IF FOUND THEN
      -- Already processed: return existing values
      SELECT c.id, u.total_xp, u.current_level
        INTO v_completion_id, v_new_total_xp, v_new_level
        FROM completions c
        JOIN users u ON u.id = p_user_id
        WHERE c.completion_request_id = p_request_id;

      RETURN QUERY SELECT v_completion_id, v_new_total_xp, v_new_level, true;
      RETURN;
    END IF;
  END IF;

  -- ── LOCK GOAL ROW ──────────────────────────────────────────────────
  -- FIX 5: Row lock prevents concurrent requests from reading stale streak
  PERFORM id FROM goals
    WHERE id = p_goal_id
    FOR UPDATE;

  -- ── ATOMIC XP INCREMENT ───────────────────────────────────────────
  -- FIX 3: Use total_xp + p_xp_earned, NOT a pre-read value
  UPDATE users
    SET
      total_xp      = total_xp + p_xp_earned,
      current_level = 1 + FLOOR((total_xp + p_xp_earned)::numeric / 100),
      updated_at    = NOW()
    WHERE id = p_user_id
    RETURNING total_xp, current_level
    INTO v_new_total_xp, v_new_level;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  -- ── INSERT COMPLETION RECORD ──────────────────────────────────────
  -- Unique constraint (goal_id, user_id, completion_date) is the final
  -- gate against race conditions
  INSERT INTO completions (
    goal_id,
    user_id,
    xp_earned,
    quality_rating,
    streak_count,
    completion_request_id,
    completed_at
  ) VALUES (
    p_goal_id,
    p_user_id,
    p_xp_earned,
    p_quality,
    p_new_streak,
    p_request_id,
    NOW()
  )
  RETURNING id INTO v_completion_id;

  -- ── UPDATE GOAL STREAK ─────────────────────────────────────────────
  UPDATE goals
    SET
      streak_count        = p_new_streak,
      last_completed_at   = NOW(),
      updated_at          = NOW()
    WHERE id = p_goal_id;

  -- ── INSERT STATS RECORD ───────────────────────────────────────────
  INSERT INTO stats (
    user_id,
    category,
    subcategory,
    points,
    completed_at
  ) VALUES (
    p_user_id,
    p_category,
    p_subcategory,
    p_xp_earned,
    NOW()
  );

  -- ── RETURN RESULT ──────────────────────────────────────────────────
  RETURN QUERY SELECT v_completion_id, v_new_total_xp, v_new_level, false;

EXCEPTION
  WHEN unique_violation THEN
    -- Race condition caught: daily completion already exists
    RETURN QUERY SELECT
      NULL::UUID,
      NULL::INTEGER,
      NULL::INTEGER,
      true;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_goal_transaction(
  UUID, UUID, INTEGER, INTEGER, INTEGER, TEXT, TEXT, UUID
) TO authenticated;


-- ───────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- ───────────────────────────────────────────────────────────────────────

-- Check all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check all indexes exist
SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;

-- Check RPC function exists
SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_name = 'complete_goal_transaction';
