# XP CALCULATION SYSTEM: COMPLETE PSEUDOCODE
## Solo Leveling Gamification App — Tier 1 Enterprise-Strict Implementation

---

## TABLE OF CONTENTS
1. Core Calculation Functions
2. Validation & Helper Functions
3. Main Orchestration Flow
4. Database Transaction Flow
5. Stats Aggregation
6. Error Handling

---

# CORE CALCULATION FUNCTIONS

## Function 1: CALCULATE XP (Pure Calculation)

**Purpose:** Given a category, quality rating, and streak count, return the total XP earned.

**Function Signature:**
```
calculateXP(category: string, quality: integer, streak: integer) → number
```

**Input Validation:**
```
VALIDATE quality:
  - Must be integer (reject decimals: 5.5, 7.2, etc.)
  - Must be in range 1-10 (reject -5, 0, 11, 15, etc.)
  - If invalid → THROW InvalidQualityError

VALIDATE streak:
  - Must be integer (reject decimals)
  - Must be non-negative: ≥ 0 (reject -1, -10, etc.)
  - If invalid → THROW InvalidStreakError

VALIDATE category:
  - Must be one of: [Career, Knowledge, Wealth, Health, Relationships, Mindfulness]
  - If invalid → THROW InvalidCategoryError
```

**Step-by-Step Logic:**

```
STEP 1: MAP CATEGORY TO BASE XP
  IF category == "Career" THEN
    baseXP = 20
  ELSE IF category == "Knowledge" THEN
    baseXP = 18
  ELSE IF category == "Wealth" THEN
    baseXP = 17
  ELSE IF category == "Health" THEN
    baseXP = 15
  ELSE IF category == "Relationships" THEN
    baseXP = 12
  ELSE IF category == "Mindfulness" THEN
    baseXP = 10
  ELSE
    THROW InvalidCategoryError("Unknown category: " + category)
  
STEP 2: MAP QUALITY RATING TO MULTIPLIER
  Using inclusive boundaries (≤ operator):
  
  IF quality ≤ 3 THEN
    multiplier = 1.0
  ELSE IF quality ≤ 6 THEN
    multiplier = 1.5
  ELSE IF quality ≤ 8 THEN
    multiplier = 2.0
  ELSE IF quality ≤ 10 THEN
    multiplier = 2.5
  
  NOTE: Quality 3 maps to 1.0x, NOT 1.5x (boundary at 3, not 4)
        Quality 4 maps to 1.5x (first tier boundary crossed)
        Quality 6 maps to 1.5x, NOT 2.0x (boundary at 6, not 7)
        Quality 7 maps to 2.0x (second tier boundary crossed)

STEP 3: CALCULATE BASE SCORE (with multiplier)
  baseScore = baseXP × multiplier
  EXAMPLE: Career (20) × quality 9 (2.5x) = 20 × 2.5 = 50

STEP 4: CALCULATE STREAK BONUS
  streakBonus = streak × 5
  EXAMPLE: 7-day streak = 7 × 5 = 35 XP
  EXAMPLE: 0-day streak = 0 × 5 = 0 XP (no bonus)

STEP 5: COMBINE & RETURN
  totalXP = baseScore + streakBonus
  EXAMPLE: 50 + 35 = 85 total XP earned
  
  RETURN totalXP (as integer, no rounding needed)
```

**Example Calculations:**

```
EXAMPLE 1: Mindfulness goal, quality=5, streak=0
  baseXP = 10
  multiplier = 1.5 (quality 5 ≤ 6)
  baseScore = 10 × 1.5 = 15
  streakBonus = 0 × 5 = 0
  RESULT: 15 XP earned

EXAMPLE 2: Career goal, quality=9, streak=7
  baseXP = 20
  multiplier = 2.5 (quality 9 ≤ 10)
  baseScore = 20 × 2.5 = 50
  streakBonus = 7 × 5 = 35
  RESULT: 85 XP earned

EXAMPLE 3: Health goal, quality=3, streak=1
  baseXP = 15
  multiplier = 1.0 (quality 3 ≤ 3, boundary case)
  baseScore = 15 × 1.0 = 15
  streakBonus = 1 × 5 = 5
  RESULT: 20 XP earned

EXAMPLE 4: Wealth goal, quality=4, streak=30
  baseXP = 17
  multiplier = 1.5 (quality 4 ≤ 6)
  baseScore = 17 × 1.5 = 25.5
  streakBonus = 30 × 5 = 150
  RESULT: 175.5 XP (or 175 if we floor)
```

---

## Function 2: CHECK LEVEL UP (Pure Calculation)

**Purpose:** Determine if user has leveled up based on total accumulated XP.

**Function Signature:**
```
checkLevelUp(totalXP: number, currentLevel: integer) → object
  Returns: {
    leveledUp: boolean,
    newLevel: integer,
    levelsGained: integer
  }
```

**Leveling Formula:**
```
newLevel = 1 + floor(totalXP / 100)

Explanation:
  Level 1 requires: 0-99 XP (any value where floor(XP/100) = 0)
  Level 2 requires: 100-199 XP cumulative (floor(XP/100) = 1)
  Level 3 requires: 200-299 XP cumulative (floor(XP/100) = 2)
  Level N requires: (N-1)×100 to (N×100-1) XP cumulative
  
  So: newLevel = 1 + floor(totalXP / 100)
```

**Step-by-Step Logic:**

```
STEP 1: CALCULATE CORRECT LEVEL BASED ON TOTAL XP
  newLevel = 1 + floor(totalXP / 100)
  
  EXAMPLES:
    totalXP = 99 → floor(99/100) = 0 → newLevel = 1
    totalXP = 100 → floor(100/100) = 1 → newLevel = 2
    totalXP = 199 → floor(199/100) = 1 → newLevel = 2
    totalXP = 200 → floor(200/100) = 2 → newLevel = 3
    totalXP = 500 → floor(500/100) = 5 → newLevel = 6
    totalXP = 1000 → floor(1000/100) = 10 → newLevel = 11

STEP 2: COMPARE NEW LEVEL WITH CURRENT LEVEL
  IF newLevel > currentLevel THEN
    leveledUp = true
    levelsGained = newLevel - currentLevel
  ELSE
    leveledUp = false
    levelsGained = 0

STEP 3: RETURN RESULT OBJECT
  RETURN {
    leveledUp: boolean,
    newLevel: integer,
    levelsGained: integer
  }
```

**Example Scenarios:**

```
SCENARIO 1: Normal level up
  Before: totalXP = 95, currentLevel = 1
  After earning 10 XP: newTotalXP = 105
  checkLevelUp(105, 1)
    → newLevel = 1 + floor(105/100) = 2
    → leveledUp = true (2 > 1)
    → levelsGained = 2 - 1 = 1
  RESULT: {leveledUp: true, newLevel: 2, levelsGained: 1}

SCENARIO 2: Multi-level jump
  Before: totalXP = 9800, currentLevel = 98
  After earning 300 XP: newTotalXP = 10100
  checkLevelUp(10100, 98)
    → newLevel = 1 + floor(10100/100) = 102
    → leveledUp = true (102 > 98)
    → levelsGained = 102 - 98 = 4
  RESULT: {leveledUp: true, newLevel: 102, levelsGained: 4}
  (User jumped 4 levels from a single goal completion)

SCENARIO 3: No level up
  Before: totalXP = 250, currentLevel = 3
  After earning 30 XP: newTotalXP = 280
  checkLevelUp(280, 3)
    → newLevel = 1 + floor(280/100) = 3
    → leveledUp = false (3 is not > 3)
    → levelsGained = 0
  RESULT: {leveledUp: false, newLevel: 3, levelsGained: 0}

SCENARIO 4: Boundary condition at exactly 100 XP
  Before: totalXP = 0, currentLevel = 1
  After earning 100 XP: newTotalXP = 100
  checkLevelUp(100, 1)
    → newLevel = 1 + floor(100/100) = 1 + 1 = 2
    → leveledUp = true (2 > 1)
    → levelsGained = 1
  RESULT: {leveledUp: true, newLevel: 2, levelsGained: 1}
```

---

# VALIDATION & HELPER FUNCTIONS

## Function 3: VALIDATE GOAL COMPLETION (Pre-Check)

**Purpose:** Verify user has permission to complete goal and goal hasn't been done today.

**Function Signature:**
```
validateGoalCompletion(goalId: string, userId: string, quality: number) → boolean
  Throws: InvalidQualityError, UnauthorizedError, AlreadyCompletedTodayError, GoalNotFoundError
```

**Step-by-Step Logic:**

```
STEP 1: VERIFY GOAL EXISTS AND BELONGS TO USER
  FETCH goal = SELECT id, user_id, frequency, last_completed_at FROM goals 
               WHERE id = goalId AND user_id = userId
  
  IF goal is NOT found THEN
    THROW UnauthorizedError("Goal not found or doesn't belong to user")

STEP 2: VERIFY GOAL NOT ALREADY COMPLETED TODAY (for daily goals only)
  IF goal.frequency == "daily" THEN
    FETCH lastCompletion = SELECT completed_at FROM completions
                           WHERE goal_id = goalId AND user_id = userId
                           ORDER BY completed_at DESC LIMIT 1
    
    IF lastCompletion exists THEN
      lastCompletionDate = DATE(lastCompletion.completed_at)
      todayDate = DATE(NOW())
      
      IF lastCompletionDate == todayDate THEN
        THROW AlreadyCompletedTodayError("Goal already completed today")
    END IF
  END IF

STEP 3: VALIDATE QUALITY IS INTEGER 1-10
  IF quality is NOT integer THEN
    THROW InvalidQualityError("Quality must be integer, got " + typeof(quality))
  
  IF quality < 1 OR quality > 10 THEN
    THROW InvalidQualityError("Quality must be 1-10, got " + quality)

STEP 4: RETURN TRUE (all checks passed)
  RETURN true
```

**Example Scenarios:**

```
SCENARIO 1: Valid completion
  goalId = "g123", userId = "u456", quality = 7
  Goal exists, belongs to user, frequency = "daily"
  last_completed_at = 2 days ago
  RESULT: RETURN true (proceed with completion)

SCENARIO 2: Goal already completed today
  goalId = "g123", userId = "u456", quality = 7
  Goal exists, frequency = "daily"
  last_completed_at = TODAY at 10:00 AM
  Current time = TODAY at 3:00 PM
  RESULT: THROW AlreadyCompletedTodayError

SCENARIO 3: Goal doesn't belong to user (unauthorized)
  goalId = "g123", userId = "u456", quality = 7
  Goal exists but user_id = "u789" (different user)
  RESULT: THROW UnauthorizedError

SCENARIO 4: Invalid quality rating
  goalId = "g123", userId = "u456", quality = 5.5 (decimal)
  RESULT: THROW InvalidQualityError

SCENARIO 5: Quality out of range
  goalId = "g123", userId = "u456", quality = 11
  RESULT: THROW InvalidQualityError("Quality must be 1-10, got 11")
```

---

## Function 4: CALCULATE STREAK (Helper)

**Purpose:** Determine the correct streak count based on last completion date.

**Function Signature:**
```
calculateStreak(lastCompletedAt: timestamp, goalFrequency: string) → integer
  Returns: streak count (0 or higher)
```

**Step-by-Step Logic:**

```
STEP 1: HANDLE NON-DAILY GOALS
  IF goalFrequency != "daily" THEN
    RETURN 0 (non-daily goals don't have streaks)

STEP 2: HANDLE NEVER-COMPLETED GOAL
  IF lastCompletedAt is NULL THEN
    RETURN 1 (first completion = streak of 1)

STEP 3: CALCULATE DAYS SINCE LAST COMPLETION
  lastDate = DATE(lastCompletedAt)
  todayDate = DATE(NOW())
  daysSinceCompletion = todayDate - lastDate
  
  NOTE: daysSinceCompletion is in days (integer)
        Example: completed yesterday → daysSinceCompletion = 1
        Example: completed today → daysSinceCompletion = 0 (error earlier)
        Example: completed 2 days ago → daysSinceCompletion = 2

STEP 4: DETERMINE STREAK LOGIC
  IF daysSinceCompletion == 1 THEN
    -- Completed yesterday, continuing streak
    RETURN previousStreak + 1
  ELSE IF daysSinceCompletion > 1 THEN
    -- Missed one or more days, streak broken
    RETURN 1 (reset to new streak)
  ELSE
    -- This shouldn't happen (validation caught same-day)
    THROW LogicError("Unexpected state")

STEP 5: RETURN CALCULATED STREAK
  RETURN streak (as integer)
```

**Example Scenarios:**

```
SCENARIO 1: Continuing a streak
  lastCompletedAt = 2024-06-05 (yesterday)
  Today = 2024-06-06
  previousStreak = 7
  daysSinceCompletion = 1
  RESULT: RETURN 7 + 1 = 8 (streak continues)

SCENARIO 2: Streak broken, reset to 1
  lastCompletedAt = 2024-06-04 (2 days ago)
  Today = 2024-06-06
  previousStreak = 10 (irrelevant)
  daysSinceCompletion = 2
  RESULT: RETURN 1 (streak reset)

SCENARIO 3: First-ever completion
  lastCompletedAt = NULL
  Today = 2024-06-06
  daysSinceCompletion = N/A
  RESULT: RETURN 1 (first completion)

SCENARIO 4: Long gap (365+ days)
  lastCompletedAt = 2023-06-01 (1 year ago)
  Today = 2024-06-06
  previousStreak = 100 (from last year, irrelevant)
  daysSinceCompletion = 371
  RESULT: RETURN 1 (far exceeded gap, streak reset)
```

---

## Function 5: MAP QUALITY TO MULTIPLIER (Helper)

**Purpose:** Convert quality rating (1-10) to XP multiplier with boundary logic.

**Function Signature:**
```
mapQualityToMultiplier(quality: integer) → number
  Returns: 1.0, 1.5, 2.0, or 2.5
```

**Step-by-Step Logic:**

```
STEP 1: VALIDATE QUALITY
  IF quality < 1 OR quality > 10 OR quality is not integer THEN
    THROW InvalidQualityError

STEP 2: MAP USING INCLUSIVE BOUNDARIES (≤ operator)
  IF quality <= 3 THEN
    RETURN 1.0
  ELSE IF quality <= 6 THEN
    RETURN 1.5
  ELSE IF quality <= 8 THEN
    RETURN 2.0
  ELSE IF quality <= 10 THEN
    RETURN 2.5

STEP 3: UNREACHABLE (logic exhausts all cases 1-10)
  (No default needed; all integers 1-10 handled)
```

**Boundary Mapping Table:**

```
Quality Rating → Multiplier (using ≤ boundaries)

Quality 1  → 1.0x (1 ≤ 3)
Quality 2  → 1.0x (2 ≤ 3)
Quality 3  → 1.0x (3 ≤ 3)  [BOUNDARY: last value in tier 1]
Quality 4  → 1.5x (4 ≤ 6)  [BOUNDARY: first value in tier 2]
Quality 5  → 1.5x (5 ≤ 6)
Quality 6  → 1.5x (6 ≤ 6)  [BOUNDARY: last value in tier 2]
Quality 7  → 2.0x (7 ≤ 8)  [BOUNDARY: first value in tier 3]
Quality 8  → 2.0x (8 ≤ 8)  [BOUNDARY: last value in tier 3]
Quality 9  → 2.5x (9 ≤ 10) [BOUNDARY: first value in tier 4]
Quality 10 → 2.5x (10 ≤ 10)[BOUNDARY: last value in tier 4]
```

---

## Function 6: MAP CATEGORY TO BASE XP (Helper)

**Purpose:** Convert category name to base XP value.

**Function Signature:**
```
mapCategoryToBaseXP(category: string) → integer
  Returns: 20, 18, 17, 15, 12, or 10
```

**Step-by-Step Logic:**

```
STEP 1: VALIDATE CATEGORY
  validCategories = ["Career", "Knowledge", "Wealth", "Health", "Relationships", "Mindfulness"]
  
  IF category NOT in validCategories THEN
    THROW InvalidCategoryError("Unknown category: " + category)

STEP 2: MAP CATEGORY TO BASE XP
  IF category == "Career" THEN
    RETURN 20 (highest reward for career goals)
  ELSE IF category == "Knowledge" THEN
    RETURN 18
  ELSE IF category == "Wealth" THEN
    RETURN 17
  ELSE IF category == "Health" THEN
    RETURN 15
  ELSE IF category == "Relationships" THEN
    RETURN 12
  ELSE IF category == "Mindfulness" THEN
    RETURN 10 (lowest reward for mindfulness goals)
```

**Category-to-BaseXP Mapping Table:**

```
Category         → BaseXP
Career           → 20 (highest priority)
Knowledge        → 18
Wealth           → 17
Health           → 15
Relationships    → 12
Mindfulness      → 10 (lowest priority)

NOTE: Relative weights reflect importance in game design.
      Career is 2x more valuable than Mindfulness (20 vs 10).
```

---

# MAIN ORCHESTRATION FLOW

## Function 7: COMPLETE GOAL (Orchestration)

**Purpose:** Main function to handle goal completion. Coordinates validation, calculation, database updates, and stats aggregation.

**Function Signature:**
```
completeGoal(
  goalId: string,
  userId: string,
  quality: integer (1-10),
  isStreakBroken: boolean (optional, for non-daily resets)
) → object
  Returns: {
    xpEarned: number,
    leveledUp: boolean,
    newLevel: integer,
    levelsGained: integer,
    completionId: string,
    newTotalXP: number,
    newStats: object (radar chart data)
  }
```

**Step-by-Step Logic:**

```
STEP 1: VALIDATE INPUTS
  CALL validateGoalCompletion(goalId, userId, quality)
  → Throws error if validation fails (goal missing, invalid quality, etc.)

STEP 2: FETCH GOAL DETAILS
  FETCH goal = SELECT id, category, frequency, streak_count, last_completed_at, user_id
               FROM goals
               WHERE id = goalId AND user_id = userId
  
  IF goal is NULL THEN
    THROW GoalNotFoundError

STEP 3: FETCH CURRENT USER STATE
  FETCH user = SELECT total_xp, current_level
               FROM users
               WHERE id = userId
  
  IF user is NULL THEN
    THROW UserNotFoundError

STEP 4: CALCULATE STREAK
  CALL calculateStreak(goal.last_completed_at, goal.frequency)
  streak = RETURN value (integer)
  
  NOTE: For daily goals, streak auto-calculated from last_completed_at
        For non-daily goals, streak = 0 (no bonus)

STEP 5: CALCULATE XP EARNED
  CALL calculateXP(goal.category, quality, streak)
  xpEarned = RETURN value (number)

STEP 6: CALCULATE NEW TOTAL XP
  newTotalXP = user.total_xp + xpEarned

STEP 7: CHECK FOR LEVEL UP
  CALL checkLevelUp(newTotalXP, user.current_level)
  levelResult = RETURN object {leveledUp, newLevel, levelsGained}

STEP 8: BEGIN DATABASE TRANSACTION
  START TRANSACTION
  (All following DB operations must succeed together or all rollback)

STEP 9: UPDATE USER TABLE
  UPDATE users
    SET total_xp = newTotalXP,
        current_level = levelResult.newLevel,
        updated_at = NOW()
    WHERE id = userId
  
  IF UPDATE failed THEN
    ROLLBACK TRANSACTION
    THROW DatabaseTransactionError

STEP 10: INSERT COMPLETION RECORD
  INSERT INTO completions (
    goal_id,
    user_id,
    xp_earned,
    quality_rating,
    streak_count,
    completed_at
  ) VALUES (
    goalId,
    userId,
    xpEarned,
    quality,
    streak,
    NOW()
  )
  
  completionId = LAST_INSERT_ID()
  
  IF INSERT failed THEN
    ROLLBACK TRANSACTION
    THROW DatabaseTransactionError

STEP 11: UPDATE GOAL STREAK (if daily goal)
  IF goal.frequency == "daily" THEN
    UPDATE goals
      SET streak_count = streak,
          last_completed_at = NOW()
      WHERE id = goalId
  ELSE
    UPDATE goals
      SET last_completed_at = NOW()
      WHERE id = goalId
  
  IF UPDATE failed THEN
    ROLLBACK TRANSACTION
    THROW DatabaseTransactionError

STEP 12: INSERT STATS RECORD
  FETCH subcategory = SELECT subcategory FROM goals WHERE id = goalId
  
  INSERT INTO stats (
    user_id,
    category,
    subcategory,
    points,
    completed_at
  ) VALUES (
    userId,
    goal.category,
    subcategory,
    xpEarned,
    NOW()
  )
  
  IF INSERT failed THEN
    ROLLBACK TRANSACTION
    THROW DatabaseTransactionError

STEP 13: COMMIT TRANSACTION
  COMMIT TRANSACTION
  (All updates now permanent in database)

STEP 14: CALCULATE UPDATED STATS (for radar chart)
  CALL aggregateStats(userId)
  newStats = RETURN object
  
  NOTE: newStats should include aggregated points per category
        Used to update hexagon radar visualization

STEP 15: LOG COMPLETION (for audit trail)
  LOG [gamification:xp_earned]
    goalId={goalId},
    userId={userId},
    category={goal.category},
    quality={quality},
    streak={streak},
    xpEarned={xpEarned},
    newTotalXP={newTotalXP},
    leveledUp={levelResult.leveledUp},
    newLevel={levelResult.newLevel},
    timestamp={NOW()}

STEP 16: RETURN RESULT
  RETURN {
    xpEarned: xpEarned,
    leveledUp: levelResult.leveledUp,
    newLevel: levelResult.newLevel,
    levelsGained: levelResult.levelsGained,
    completionId: completionId,
    newTotalXP: newTotalXP,
    newStats: newStats
  }
```

---

# DATABASE TRANSACTION FLOW

## Transaction: ATOMIC GOAL COMPLETION

**Purpose:** Ensure all-or-nothing updates when goal is completed.

**Isolation Level:** READ_COMMITTED or SERIALIZABLE (prevent race conditions)

**Operations in Order:**

```
BEGIN TRANSACTION

  LOCK users WHERE id = userId (prevent concurrent updates)
  
  OPERATION 1: Update users table
    UPDATE users SET total_xp = ?, current_level = ? WHERE id = ?
    
  OPERATION 2: Insert completion record
    INSERT INTO completions (...) VALUES (...)
    
  OPERATION 3: Update goal metadata
    UPDATE goals SET streak_count = ?, last_completed_at = ? WHERE id = ?
    
  OPERATION 4: Insert stats record
    INSERT INTO stats (...) VALUES (...)

COMMIT TRANSACTION (all operations succeed)
OR
ROLLBACK TRANSACTION (if ANY operation fails, undo all)
```

**Success Criteria:**
```
✓ users.total_xp updated
✓ users.current_level updated
✓ completions record inserted
✓ goals.streak_count updated
✓ stats record inserted
✓ All 5 operations in same transaction
```

**Failure Scenarios:**

```
SCENARIO 1: Completion insert fails
  users update → SUCCESS
  completions insert → FAILS (duplicate id?)
  RESULT: ROLLBACK ENTIRE TRANSACTION
          users.total_xp reverted to original
          No loss of data, clean state

SCENARIO 2: Database connection lost mid-transaction
  users update → SUCCESS
  completions insert → SUCCESS
  goals update → CONNECTION LOST
  RESULT: ROLLBACK ALL THREE operations
          Database state unchanged
          Transaction retried or error returned to client

SCENARIO 3: Race condition: Two simultaneous completions
  Transaction A: locks users.id = u1
  Transaction B: tries to lock users.id = u1 (waits)
  Transaction A: commits successfully
  Transaction B: now executes (sees updated total_xp from A)
  RESULT: Serialized; no dirty reads or lost updates
```

---

# STATS AGGREGATION

## Function 8: AGGREGATE STATS (For Dashboard/Radar)

**Purpose:** Compute aggregated stats per category for hexagon radar chart visualization.

**Function Signature:**
```
aggregateStats(userId: string) → object
  Returns: {
    Career: number,
    Knowledge: number,
    Wealth: number,
    Health: number,
    Relationships: number,
    Mindfulness: number
  }
```

**Step-by-Step Logic:**

```
STEP 1: FETCH ALL STATS FOR USER (optional: time-window filter)
  FETCH statsRecords = SELECT category, points FROM stats
                       WHERE user_id = userId
                       AND completed_at >= NOW() - INTERVAL '30 days'
                       (optional 30-day window; adjust as needed)

STEP 2: GROUP AND SUM BY CATEGORY
  FOR EACH category in [Career, Knowledge, Wealth, Health, Relationships, Mindfulness]
    totalPoints = SUM(points) WHERE category = category
    IF totalPoints is NULL THEN totalPoints = 0
  END FOR

STEP 3: BUILD RESULT OBJECT
  RETURN {
    Career: totalPoints_Career,
    Knowledge: totalPoints_Knowledge,
    Wealth: totalPoints_Wealth,
    Health: totalPoints_Health,
    Relationships: totalPoints_Relationships,
    Mindfulness: totalPoints_Mindfulness
  }

STEP 4: OPTIONAL - CACHE RESULT
  (For performance optimization)
  INSERT OR UPDATE user_stats_cache
    SET Career = ?, Knowledge = ?, ... 
    WHERE user_id = ?
  (Avoids recalculating on every request)
```

**Example Result:**

```
User u1 has completed:
  - Career goals (3 completions): 85 + 70 + 50 = 205 XP
  - Knowledge goals (2 completions): 60 + 45 = 105 XP
  - Health goals (5 completions): 30 + 30 + 25 + 40 + 35 = 160 XP
  - Mindfulness goals (1 completion): 15 XP
  - Wealth goals (0 completions): 0 XP
  - Relationships goals (0 completions): 0 XP

aggregateStats(u1) RETURNS:
{
  Career: 205,
  Knowledge: 105,
  Wealth: 0,
  Health: 160,
  Relationships: 0,
  Mindfulness: 15
}

This feeds the hexagon radar:
  Career spoke = 205
  Knowledge spoke = 105
  Wealth spoke = 0 (visual gap)
  Health spoke = 160
  Relationships spoke = 0 (visual gap)
  Mindfulness spoke = 15
```

---

# ERROR HANDLING

## Error Types & Handling Strategy

**Purpose:** Define all possible errors and how to handle them.

```
ERROR CATEGORY 1: Input Validation Errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

InvalidQualityError
  Cause: quality < 1 OR quality > 10 OR not integer
  Message: "Quality must be integer 1-10, got {value}"
  HTTP Status: 400 Bad Request
  User Action: Prompt user to select quality 1-10
  Retry: Yes, with corrected input

InvalidStreakError
  Cause: streak < 0 OR not integer
  Message: "Streak must be non-negative integer, got {value}"
  HTTP Status: 400 Bad Request
  User Action: Backend should calculate streak, not user
  Retry: No, code error on backend

InvalidCategoryError
  Cause: category not in [Career, Knowledge, Wealth, Health, Relationships, Mindfulness]
  Message: "Unknown category: {value}"
  HTTP Status: 400 Bad Request
  User Action: Goal must have valid category
  Retry: No, goal data corrupted

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERROR CATEGORY 2: Authorization Errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UnauthorizedError
  Cause: User trying to complete goal they don't own
  Message: "Goal not found or doesn't belong to user"
  HTTP Status: 403 Forbidden
  User Action: None (security event, log & ignore)
  Retry: No

GoalNotFoundError
  Cause: Goal ID doesn't exist in database
  Message: "Goal {goalId} not found"
  HTTP Status: 404 Not Found
  User Action: Goal may have been deleted; refresh UI
  Retry: No (permanent)

UserNotFoundError
  Cause: User ID doesn't exist in users table
  Message: "User {userId} not found"
  HTTP Status: 404 Not Found
  User Action: None (system error, shouldn't happen)
  Retry: No (critical issue)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERROR CATEGORY 3: Business Logic Errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AlreadyCompletedTodayError
  Cause: User trying to complete daily goal twice in one day
  Message: "Goal already completed today"
  HTTP Status: 409 Conflict
  User Action: Show message "You already completed this today. Come back tomorrow."
  Retry: Yes, tomorrow

StreakResetError (informational, not an error)
  Cause: User missed a day, streak resets to 1
  Message: "Your streak has been reset to 1. Complete tomorrow to rebuild."
  HTTP Status: 200 OK
  User Action: Inform user streak reset (not an error state)
  Retry: N/A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERROR CATEGORY 4: Database Errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DatabaseTransactionError
  Cause: Database operation failed (connection lost, timeout, constraint violation)
  Message: "Failed to save completion. Please try again."
  HTTP Status: 500 Internal Server Error
  User Action: Show error message, retry button
  Retry: Yes, with exponential backoff
  Handling: Log full error; don't expose DB details to client

DuplicateCompletionError
  Cause: Unique constraint violation (same goal completed at same timestamp)
  Message: "Completion already recorded"
  HTTP Status: 409 Conflict
  User Action: None (race condition, UI already disabled double-submit)
  Retry: No (idempotent, return success)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ERROR CATEGORY 5: System Errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LogicError
  Cause: Unexpected state (should never happen)
  Message: "Unexpected application state: {context}"
  HTTP Status: 500 Internal Server Error
  User Action: Report to support (rare)
  Retry: No (bug in code)
  Handling: Log stack trace; alert engineering
```

---

## Error Handling Flow Diagram

```
USER SUBMITS COMPLETION
        ↓
┌───────────────────────────┐
│ Input Validation Layer    │
├───────────────────────────┤
│ - Is quality 1-10?        │
│ - Is streak ≥ 0?          │
│ - Is category valid?      │
└───────────┬───────────────┘
            ↓
        NO  ↓  YES
        │   │
        ↓   │
   THROW    │
   Error    │
        │   │
        ├───┘
        ↓
┌───────────────────────────┐
│ Authorization Layer       │
├───────────────────────────┤
│ - Goal exists?            │
│ - Belongs to user?        │
│ - Not completed today?    │
└───────────┬───────────────┘
            ↓
        NO  ↓  YES
        │   │
        ↓   │
   THROW    │
   Error    │
        │   │
        ├───┘
        ↓
┌───────────────────────────┐
│ Calculation Layer         │
├───────────────────────────┤
│ - Calculate streak        │
│ - Calculate XP            │
│ - Check level up          │
└───────────┬───────────────┘
            ↓
┌───────────────────────────┐
│ Database Layer (TXNX)     │
├───────────────────────────┤
│ - Update users            │
│ - Insert completion       │
│ - Update goal             │
│ - Insert stats            │
└───────────┬───────────────┘
            ↓
        FAIL ↓ SUCCESS
        │    │
        ↓    │
    ROLLBACK │
    Return   │
    Error    │
        │    │
        ├────┘
        ↓
    SUCCESS ✓
    Return completion result
    to client
```

---

# COMPLETE PSEUDOCODE REFERENCE

## All Functions Quick Reference

| Function | Purpose | Input | Output | Errors |
|----------|---------|-------|--------|--------|
| **calculateXP** | Core formula | category, quality, streak | XP earned | InvalidQuality, InvalidStreak, InvalidCategory |
| **checkLevelUp** | Level determination | totalXP, currentLevel | leveledUp, newLevel, levelsGained | None (pure math) |
| **validateGoalCompletion** | Pre-check | goalId, userId, quality | boolean | UnauthorizedError, AlreadyCompletedTodayError, InvalidQualityError, GoalNotFoundError |
| **calculateStreak** | Streak logic | lastCompletedAt, goalFrequency | streak count | None (pure logic) |
| **mapQualityToMultiplier** | Quality→multiplier | quality | 1.0, 1.5, 2.0, or 2.5 | InvalidQualityError |
| **mapCategoryToBaseXP** | Category→baseXP | category | 20, 18, 17, 15, 12, or 10 | InvalidCategoryError |
| **completeGoal** | Main orchestration | goalId, userId, quality | completion result | All error types |
| **aggregateStats** | Radar data | userId | {Career, Knowledge, ...} | DatabaseError |

---

## Call Hierarchy

```
completeGoal (main entry point)
  ├─ validateGoalCompletion (pre-check authorization)
  │   └─ (database fetch: goal details)
  ├─ (database fetch: user state)
  ├─ calculateStreak (helper)
  │   └─ (date math)
  ├─ calculateXP (core calculation)
  │   ├─ mapCategoryToBaseXP (helper)
  │   ├─ mapQualityToMultiplier (helper)
  │   └─ (arithmetic)
  ├─ checkLevelUp (core calculation)
  │   └─ (floor division)
  ├─ (database transaction START)
  │   ├─ UPDATE users
  │   ├─ INSERT completions
  │   ├─ UPDATE goals
  │   └─ INSERT stats
  ├─ (database transaction COMMIT)
  ├─ aggregateStats (radar calculation)
  │   └─ (database fetch + SUM)
  └─ (log & return result)
```

---

## Testing Checklist

```
UNIT TESTS (Pure Functions)
═══════════════════════════════════════════
☐ calculateXP: All 8 quality boundaries (1,3,4,6,7,8,9,10)
☐ calculateXP: Streak values (0, 1, 7, 30, 365)
☐ calculateXP: All 6 categories
☐ calculateXP: Invalid inputs (floats, negatives, unknown category)
☐ checkLevelUp: All thresholds (99→100, 199→200, etc.)
☐ checkLevelUp: Multi-level jumps (level 1→6, 98→102)
☐ checkLevelUp: No level up (same level)
☐ mapQualityToMultiplier: All boundaries
☐ mapCategoryToBaseXP: All categories
☐ calculateStreak: Continuing streak, reset, first-ever, long gap

INTEGRATION TESTS (Orchestration)
═══════════════════════════════════════════
☐ completeGoal: Successful flow (auth + calc + DB + stats)
☐ completeGoal: Authorization errors (goal not found, not owned)
☐ completeGoal: Daily goal already completed today
☐ completeGoal: Non-daily goals (no streak)
☐ completeGoal: Multi-level jump (verify all levels awarded)
☐ completeGoal: Transaction rollback on DB error
☐ aggregateStats: Correct aggregation per category
☐ aggregateStats: Zero values for completed-less categories

EDGE CASE TESTS
═══════════════════════════════════════════
☐ Career quality 9 + 7-day streak = 85 XP
☐ Health quality 3 + 1-day streak = 20 XP (boundary quality 3)
☐ User level 98 → 102 in one completion
☐ Duplicate completion (race condition protection)
☐ Database connection lost mid-transaction
☐ Decimal quality rejection (5.5, 7.2)
☐ Negative inputs rejection (-5, -1)
☐ Unknown category rejection
```

---

END OF PSEUDOCODE DOCUMENT
