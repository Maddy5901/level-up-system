# CLAUDE PROMPTS: COPY-PASTE READY
## All 7 Prompts for Solo Leveling Gamification App

**Purpose**: Copy-paste these directly to Claude.ai for code generation  
**Execution Order**: PROMPT 1 → PROMPT 2 → PROMPT 3 → PROMPTS 4-7  
**Note**: Run one prompt at a time. Don't combine them.

---

## PROMPT 1: Project Setup
**When to use**: Day 2 of Week 1 (after installing Node.js and VS Code)  
**What it does**: Generates terminal commands and folder structure for React project  
**Time to execute**: 2-3 hours

```
I'm building a gamified self-improvement app using React + TypeScript + Supabase.

Tech stack:
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Supabase (database + auth)
- Recharts (for hexagonal stats visualization)

Please:
1. Generate the EXACT terminal commands to create a new Vite + React + TypeScript project
2. List ALL npm packages I need to install (supabase, recharts, react-router-dom, etc.)
3. Show me the folder structure I should create (components/, pages/, utils/, types/)
4. Create a .env.example file template for Supabase credentials

Keep explanations concise. I'll paste the output directly into my terminal.
```

**After running**:
- [ ] Copy terminal commands into your terminal one by one
- [ ] Create .env and .env.example files with credentials
- [ ] Run `npm run dev` to verify project works
- [ ] Commit: `git commit -m "Initial React + TypeScript setup with Vite"`

---

## PROMPT 2: Supabase Schema Setup
**When to use**: Days 3-4 of Week 1  
**What it does**: Generates SQL for 4 tables + RLS policies  
**Time to execute**: 1-2 hours

```
I need to create 4 tables in Supabase for my gamification app:

1. users (id, email, username, current_level, total_xp, created_at)
2. goals (id, user_id, title, category, subcategory, base_xp, quality_multiplier, is_daily, streak_count, created_at, completed_at)
3. completions (id, goal_id, user_id, xp_earned, completed_at)
4. stats (id, user_id, category, subcategory, points, updated_at)

Generate the SQL CREATE TABLE statements for Supabase with:
- Proper foreign keys (user_id references users)
- Timestamps with default NOW()
- Row Level Security (RLS) policies so users can ONLY see/edit their own data
- Indexes on user_id for fast queries

CRITICAL: Include the RLS policies that prevent users from accessing other users' data.
```

**After running**:
- [ ] Copy SQL into Supabase SQL Editor
- [ ] Verify 4 tables created in Table Editor
- [ ] Test database connection from React
- [ ] Commit: `git commit -m "Add Supabase schema and RLS policies"`

---

## PROMPT 3: Authentication Flow
**When to use**: Days 5-7 of Week 1  
**What it does**: Generates signup/login/logout with protected routes  
**Time to execute**: 2-3 hours

```
Build a complete authentication system using Supabase Auth with:

1. Sign Up page (email + password)
2. Login page (email + password)
3. Protected routes (redirect to login if not authenticated)
4. Logout button

Requirements:
- Use Supabase's auth.signUp(), auth.signInWithPassword(), auth.signOut()
- Store auth state globally (React Context)
- Show loading states during auth operations
- Display error messages if login/signup fails
- Redirect to dashboard after successful login

Create:
- components/Auth/SignUp.tsx
- components/Auth/Login.tsx
- contexts/AuthContext.tsx
- App.tsx with protected route logic

Use Tailwind CSS for styling. Make it clean and minimal.
```

**After running**:
- [ ] Create Auth component files
- [ ] Update App.tsx with routing
- [ ] Test signup with: test@example.com / TestPassword123
- [ ] Verify user created in Supabase
- [ ] Test login/logout
- [ ] Test protected routes redirect
- [ ] Commit: `git commit -m "Add authentication system (signup/login/logout)"`

---

## PROMPT 4: Goal Creation Form
**When to use**: Days 8-9 of Week 2  
**What it does**: Generates goal creation form with category/subcategory logic  
**Time to execute**: 2-3 hours

```
Build a goal creation form with these fields:

1. Title (text input) - "30 min meditation"
2. Category (dropdown) - Health, Wealth, Career, Relationships, Knowledge, Mindfulness
3. Subcategory (dropdown) - depends on category (Health → Physical, Mental, Spiritual)
4. Quality Rating (slider 1-10) - user rates goal importance
5. Is Daily? (checkbox) - repeatable daily or one-time goal

Quality multiplier logic:
- Quality rating 1-3 → multiplier 1.0x
- Quality rating 4-6 → multiplier 1.5x
- Quality rating 7-8 → multiplier 2.0x
- Quality rating 9-10 → multiplier 2.5x

When submitted:
- Calculate base_xp based on category (Career = 20, Health = 15, etc.)
- Calculate quality_multiplier from quality rating
- Insert into Supabase 'goals' table
- Show success message

Create:
- components/Goals/CreateGoalForm.tsx
- Include category-to-subcategory mapping
- Use Supabase client to insert goal
```

**After running**:
- [ ] Create CreateGoalForm.tsx
- [ ] Add to dashboard page
- [ ] Test creating goals with different categories
- [ ] Verify goals appear in Supabase
- [ ] Commit: `git commit -m "Add goal creation form with quality weighting"`

---

## PROMPT 5: Goal Completion + XP Calculation
**When to use**: Days 10-11 of Week 2  
**What it does**: Generates goal completion logic with XP calculation  
**Time to execute**: 3-4 hours

```
Build the goal completion system with XP calculation:

When user clicks "Complete" on a goal:
1. Calculate total XP earned:
   - base_xp × quality_multiplier
   - + streak_bonus (if streak_count > 0: add streak_count × 5 XP)

2. Insert completion record into 'completions' table
3. Update 'goals' table:
   - Increment streak_count by 1
   - If not is_daily: set completed_at = NOW()
4. Update user's total_xp in 'users' table
5. Check if level up needed:
   - XP required to next level = current_level × 100
   - If total_xp >= required, increment level
6. Update relevant stat in 'stats' table

XP Curve:
- Level 1→2: 100 XP
- Level 2→3: 200 XP
- Level N→N+1: N × 100 XP

If user levels up:
- Increment current_level
- Show level-up animation/message

Create:
- components/Goals/GoalCard.tsx
- utils/xpCalculator.ts (XP calculation logic)
- Handle all database updates
```

**After running**:
- [ ] Create xpCalculator.ts with XP formula
- [ ] Create GoalCard.tsx component
- [ ] Create GoalList.tsx to display goals
- [ ] Test completing goals
- [ ] Verify XP calculated correctly
- [ ] Verify level up triggers
- [ ] Verify stats table updated
- [ ] Commit: `git commit -m "Add goal completion and XP calculation"`

---

## PROMPT 6: Dashboard with Hexagonal Stats
**When to use**: Days 13-16 of Week 3  
**What it does**: Generates dashboard with radar chart visualization  
**Time to execute**: 3-4 hours

```
Build a user dashboard showing:

1. User Level + XP Progress
   - "Level 5 - 487/500 XP to Level 6"
   - Progress bar showing XP towards next level

2. Hexagonal Radar Chart (6 categories)
   - Fetch all stats from 'stats' table for current user
   - Aggregate subcategory points into top-level categories
   - Display as radar chart using Recharts

3. Active Goals List
   - Show all incomplete goals
   - Show streak count for daily goals
   - Complete button for each goal

Use Recharts: <RadarChart>, <PolarGrid>, <PolarAngleAxis>, <Radar>

Create:
- pages/Dashboard.tsx
- components/Stats/HexagonalChart.tsx
- Fetch data from Supabase on mount

Make it clean and professional.
```

**After running**:
- [ ] Create Dashboard.tsx page
- [ ] Create HexagonalChart.tsx component
- [ ] Create LevelProgress.tsx if needed
- [ ] Test dashboard displays correctly
- [ ] Verify chart shows correct data
- [ ] Verify stats aggregate correctly
- [ ] Test with multiple users
- [ ] Commit: `git commit -m "Add dashboard with hexagonal stats chart"`

---

## PROMPT 7: Streak Reset Logic
**When to use**: Days 17-20 of Week 4  
**What it does**: Generates background streak reset function  
**Time to execute**: 1-2 hours

```
Build a background function that resets streaks if daily goals are missed:

Logic:
- Run when user opens the app
- For each daily goal (is_daily = true):
  - Get last completion from 'completions' table
  - If last completion was NOT yesterday: reset streak_count to 0
  - Update 'goals' table

Use JavaScript Date manipulation to compare dates.

Create:
- utils/streakChecker.ts
- Export function: checkAndResetStreaks(userId)
- Call this in Dashboard useEffect on mount

Handle timezone edge cases.
```

**After running**:
- [ ] Create streakChecker.ts utility
- [ ] Add to Dashboard useEffect
- [ ] Test streak reset logic
- [ ] Test streaks persist when daily
- [ ] Test timezone edge cases
- [ ] Commit: `git commit -m "Add streak reset logic and edge case handling"`

---

## PROMPT EXECUTION CHECKLIST

### **Week 1-2 Execution**
```
☐ PROMPT 1: Project setup (Day 2)
   Result: React app runs locally

☐ PROMPT 2: Database schema (Days 3-4)
   Result: 4 tables with RLS policies

☐ PROMPT 3: Authentication (Days 5-7)
   Result: Signup/login/logout working

☐ PROMPT 4: Goal creation (Days 8-9)
   Result: Can create goals with quality ratings

☐ PROMPT 5: Goal completion (Days 10-11)
   Result: Can complete goals, XP calculated, levels up

☐ PROMPT 6: Dashboard (Days 13-16)
   Result: Dashboard displays with hexagonal chart

☐ PROMPT 7: Streak reset (Days 17-20)
   Result: Streaks reset correctly
```

---

## IMPORTANT NOTES

### **Before Running Each Prompt**
1. **Read the entire prompt** - Don't just copy blindly
2. **Reference the context** - Understand what it does
3. **Have dependencies ready** - Install packages from PROMPT 1 before running others
4. **Create files manually** if Claude doesn't generate them
5. **Test after each prompt** - Don't move to next until working

### **If Claude's Output is Too Long**
1. Ask Claude to "split this into multiple messages"
2. Ask Claude to "show me just the key files, not all files"
3. Copy the code into files yourself (copy-paste still works)

### **If Something Breaks**
1. Check error in browser console (F12)
2. Reference MASTER_REFERENCE_GUIDE.md → "When You See This Error"
3. Review the specific prompt output
4. Ask Claude for help with the specific error

### **File Organization After All Prompts**
```
src/
├── components/
│   ├── Auth/
│   │   ├── SignUp.tsx
│   │   └── Login.tsx
│   ├── Goals/
│   │   ├── CreateGoalForm.tsx
│   │   ├── GoalCard.tsx
│   │   └── GoalList.tsx
│   └── Stats/
│       ├── HexagonalChart.tsx
│       └── LevelProgress.tsx
├── contexts/
│   └── AuthContext.tsx
├── pages/
│   └── Dashboard.tsx
├── utils/
│   ├── supabaseClient.ts
│   ├── xpCalculator.ts
│   └── streakChecker.ts
├── types/
│   └── (any TypeScript types)
└── App.tsx
```

---

## COPY-PASTE ORDER SUMMARY

1. **PROMPT 1** → Terminal commands + packages
2. **PROMPT 2** → SQL for tables + RLS
3. **PROMPT 3** → Auth components
4. **PROMPT 4** → Goal form
5. **PROMPT 5** → Goal completion + XP
6. **PROMPT 6** → Dashboard + chart
7. **PROMPT 7** → Streak reset

**Run in this order. Don't skip ahead.**

Each prompt depends on the previous one being complete.

---

Last Updated: May 18, 2026  
Status: Ready for immediate execution
