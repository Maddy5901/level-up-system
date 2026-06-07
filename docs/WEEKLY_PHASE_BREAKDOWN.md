# WEEKLY PHASE BREAKDOWN: DETAILED IMPLEMENTATION GUIDE
## Solo Leveling-Inspired Gamification App

**Timeline**: 8 Weeks (2 months) to Production MVP  
**Format**: Week-by-week breakdown with daily tasks, checkpoints, and deliverables  
**Purpose**: Clear daily action items for sustainable, measurable progress

---

## PHASE 3: SECURITY-FIRST GENERATION (WEEKS 1-2)
### Foundation: Authentication & Database

---

## WEEK 1: PROJECT SETUP + DATABASE SCHEMA

### **Daily Breakdown**

#### **DAY 1: Environment Setup (Monday)**

**Morning (2-3 hours)**
1. **Install Node.js**
   - Go to nodejs.org
   - Download LTS version
   - Run installer
   - Verify: `node --version` (should show v20.x.x)

2. **Install VS Code**
   - Download from code.visualstudio.com
   - Install extensions:
     - ES7+ React/Redux/React-Native snippets
     - Prettier - Code formatter
     - Tailwind CSS IntelliSense

3. **Create GitHub Account** (if needed)
   - Go to github.com/signup
   - Create username (lowercase, no spaces)
   - Verify email

**Afternoon (1-2 hours)**
4. **Create Supabase Account**
   - Go to supabase.com
   - Sign up with GitHub
   - Create new project:
     - Name: `level-up-system`
     - Database Password: Create strong password (SAVE THIS)
     - Region: Choose closest to you
     - Click "Create new project"
     - WAIT 2-3 minutes for database to initialize

5. **Save Credentials Securely**
   - Go to Project Settings → API
   - Copy these values to a text file (temporarily):
     - Project URL (looks like: https://abcdefg.supabase.co)
     - anon public key (long string starting with "eyJ...")
   - These will go in `.env` file later

6. **Create Vercel Account** (if needed)
   - Go to vercel.com
   - Sign up with GitHub
   - Authorize access

**End of Day 1 Checklist**
- [ ] Node.js installed and verified
- [ ] VS Code installed with extensions
- [ ] GitHub account created
- [ ] Supabase project created
- [ ] Supabase credentials saved temporarily
- [ ] Vercel account created

**Status**: Ready for code generation tomorrow

---

#### **DAY 2: React Project Creation (Tuesday)**

**Morning (2-3 hours)**
1. **Open Terminal in VS Code**
   - Open VS Code
   - Click Terminal menu → New Terminal
   - You should see a terminal at bottom

2. **Run PROMPT 1 to Claude**
   ```
   Copy this EXACT prompt and paste into Claude.ai:

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

3. **Copy Claude's Commands**
   - Claude will give you terminal commands
   - Copy each command one at a time into your terminal
   - Press Enter after each command
   - Wait for each to complete (takes 2-3 minutes total)

4. **Create Environment Files**
   - In your project folder, create `.env` file (replace with YOUR values):
     ```
     VITE_SUPABASE_URL=https://abcdefg.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGc...VERY_LONG_STRING...
     ```
   - Create `.env.example` file (this is safe to commit):
     ```
     VITE_SUPABASE_URL=your_supabase_url_here
     VITE_SUPABASE_ANON_KEY=your_anon_key_here
     ```
   - Add to `.gitignore`:
     ```
     .env
     .env.local
     ```

5. **Verify Project Works**
   - In terminal: `npm run dev`
   - Browser should open to http://localhost:5173
   - You should see React welcome screen

**Afternoon (1-2 hours)**
6. **Create Folder Structure** (Claude might have done this)
   - If not done by Claude, create folders:
     ```
     src/
     ├── components/
     │   ├── Auth/
     │   ├── Goals/
     │   └── Stats/
     ├── pages/
     ├── contexts/
     ├── utils/
     ├── types/
     └── App.tsx
     ```

7. **First Git Commit**
   - In terminal: `git init`
   - `git add .`
   - `git commit -m "Initial React + TypeScript setup"`

**End of Day 2 Checklist**
- [ ] React project created with `npm create vite@latest`
- [ ] npm packages installed
- [ ] Project runs locally (`npm run dev`)
- [ ] .env file created with Supabase credentials
- [ ] .env added to .gitignore
- [ ] .env.example created (safe version)
- [ ] Folder structure created
- [ ] First commit to Git

**Status**: React app running locally, ready for database setup

---

#### **DAY 3-4: Supabase Database Schema (Wed-Thu)**

**Morning (3-4 hours)**
1. **Run PROMPT 2 to Claude**
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

2. **Create Tables in Supabase**
   - Go to Supabase Dashboard → SQL Editor
   - Click "+ New Query"
   - Copy Claude's CREATE TABLE statements
   - Paste them in SQL editor
   - Click "Run"
   - Wait for all 4 tables to be created

3. **Apply RLS Policies**
   - Continue in SQL Editor
   - Paste Claude's RLS policy statements
   - Click "Run"
   - Each policy should execute without error

4. **Verify Tables Created**
   - Go to Supabase Dashboard → Table Editor
   - You should see 4 tables:
     - users
     - goals
     - completions
     - stats
   - Click each table to verify columns

**Afternoon (1-2 hours)**
5. **Test Database Connection from React**
   - In your React project, create `src/utils/supabaseClient.ts`:
     ```typescript
     import { createClient } from '@supabase/supabase-js'
     
     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
     const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
     
     export const supabase = createClient(supabaseUrl, supabaseAnonKey)
     ```
   - In `src/App.tsx`, test connection:
     ```typescript
     import { supabase } from './utils/supabaseClient'
     
     useEffect(() => {
       supabase.from('users').select('*').then(data => {
         console.log('Connection successful:', data)
       })
     }, [])
     ```
   - Check browser console (F12) → should see connection message

6. **Commit to Git**
   - `git add .`
   - `git commit -m "Add Supabase schema and RLS policies"`

**End of Day 3-4 Checklist**
- [ ] 4 SQL tables created in Supabase
- [ ] All RLS policies applied successfully
- [ ] All table columns verified
- [ ] Database connection tested from React
- [ ] supabaseClient.ts created
- [ ] .env credentials working
- [ ] Git commit made

**Status**: Database ready, connection verified

---

#### **DAY 5-7: Authentication System (Fri-Sun)**

**Friday Morning (3-4 hours)**
1. **Run PROMPT 3 to Claude**
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

2. **Create Auth Files**
   - Claude will generate multiple files
   - Create each file in your `src/` folder:
     - `contexts/AuthContext.tsx`
     - `components/Auth/SignUp.tsx`
     - `components/Auth/Login.tsx`
   - Update `App.tsx` with protected routes

3. **Update App.tsx**
   - Replace entire App.tsx with Claude's version
   - This adds routing and auth protection

**Friday Afternoon (2-3 hours)**
4. **Test Signup Locally**
   - In terminal: `npm run dev`
   - Open http://localhost:5173
   - You should see signup page
   - Try signing up with:
     - Email: test@example.com
     - Password: TestPassword123
   - Click "Sign Up"
   - Check browser console for errors (F12)

5. **Verify in Supabase**
   - Go to Supabase Dashboard → Authentication → Users
   - You should see your test user listed
   - Status should be "email confirmation pending" (that's OK for testing)

**Saturday Morning (2-3 hours)**
6. **Test Login**
   - Refresh page (you should be logged out)
   - Click "Login"
   - Use same email/password from signup
   - You should be redirected to dashboard

7. **Test Logout**
   - You should see a Logout button on dashboard
   - Click it
   - You should be redirected to login page

8. **Test Protected Routes**
   - Logout first
   - Try navigating to http://localhost:5173/dashboard
   - You should be redirected to login page automatically

**Saturday Afternoon (1 hour)**
9. **Commit to Git**
   - `git add .`
   - `git commit -m "Add authentication system (signup/login/logout)"`

**Sunday (30 min)**
10. **Review Week 1 Progress**
    - ✅ React project created and running
    - ✅ Supabase database with RLS policies
    - ✅ Authentication working (signup/login/logout)
    - ✅ Protected routes working
    - ✅ All code committed to Git

**End of Week 1 Checklist**
- [ ] React project structure complete
- [ ] 4 Supabase tables with RLS policies
- [ ] Signup creates user in database
- [ ] Login authenticates user
- [ ] Logout clears session
- [ ] Protected routes redirect to login
- [ ] No errors in browser console
- [ ] All code committed to Git

**Deliverable**: Working authentication system  
**Status**: Ready for Week 2 (Goal features)

---

## WEEK 2: GOAL FEATURES + XP CALCULATION

### **Daily Breakdown**

#### **DAY 8-9: Goal Creation Form (Monday-Tuesday)**

**Monday Morning (3-4 hours)**
1. **Run PROMPT 4 to Claude**
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

2. **Create Goal Form Component**
   - Claude will generate `CreateGoalForm.tsx`
   - Create file: `src/components/Goals/CreateGoalForm.tsx`
   - Paste Claude's code

3. **Add Form to Dashboard**
   - In your dashboard page, add the CreateGoalForm component
   - Import it at top: `import CreateGoalForm from '../components/Goals/CreateGoalForm'`
   - Add to JSX

**Monday Afternoon (2 hours)**
4. **Test Goal Creation**
   - Login to your app
   - Fill out goal form:
     - Title: "30 min meditation"
     - Category: Health
     - Subcategory: Mental
     - Quality Rating: 8
     - Is Daily: checked
   - Click "Create Goal"
   - Should see success message

5. **Verify in Database**
   - Go to Supabase Dashboard → Table Editor → goals
   - You should see your new goal listed
   - Check all fields saved correctly

**Tuesday Morning (2-3 hours)**
6. **Test Multiple Goals**
   - Create 3 more goals with different categories:
     - Career goal (quality: 9)
     - Fitness goal (quality: 7)
     - Reading goal (quality: 5)
   - Verify each appears in database

7. **Commit to Git**
   - `git add .`
   - `git commit -m "Add goal creation form with quality weighting"`

**End of Days 8-9 Checklist**
- [ ] CreateGoalForm.tsx created
- [ ] Form displays all 5 fields
- [ ] Category dropdown works
- [ ] Subcategory updates based on category
- [ ] Quality slider shows value (1-10)
- [ ] Is Daily checkbox works
- [ ] Form submits without errors
- [ ] Goals appear in Supabase
- [ ] All fields saved correctly
- [ ] Success message shows

**Status**: Goals can be created, now build completion logic

---

#### **DAY 10-11: Goal Completion + XP Calculation (Wed-Thu)**

**Wednesday Morning (3-4 hours)**
1. **Run PROMPT 5 to Claude**
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

2. **Create XP Calculator Utility**
   - Claude will generate `xpCalculator.ts`
   - Create file: `src/utils/xpCalculator.ts`
   - This file contains pure functions for XP calculation (testable)

3. **Create Goal Card Component**
   - Claude will generate `GoalCard.tsx`
   - Create file: `src/components/Goals/GoalCard.tsx`
   - This shows individual goal with "Complete" button

**Wednesday Afternoon (2-3 hours)**
4. **Add GoalList Component**
   - Create `src/components/Goals/GoalList.tsx`
   - Fetches all user's goals from database
   - Maps through and renders GoalCard for each
   - Pass onComplete callback to update UI after completion

5. **Test Goal Completion**
   - Login and view your goals
   - Click "Complete" on first goal
   - Should show:
     - Success message
     - XP earned (e.g., "+50 XP")
     - Streak count updated

6. **Verify XP in Database**
   - Check `users` table → your user should have total_xp > 0
   - Check `completions` table → should have entry for completed goal
   - Check `goals` table → streak_count should be 1

**Thursday Morning (2-3 hours)**
7. **Test Leveling Up**
   - Complete goals multiple times until you reach next level
   - Should see "Level Up!" message
   - Check `users` table → current_level should increment
   - Check `stats` table → should have entries for each subcategory

8. **Test Streak System**
   - Complete a daily goal multiple times
   - Streak count should keep incrementing
   - Each completion should give streak bonus XP

**Thursday Afternoon (1-2 hours)**
9. **Commit to Git**
   - `git add .`
   - `git commit -m "Add goal completion and XP calculation"`

**End of Days 10-11 Checklist**
- [ ] xpCalculator.ts created and working
- [ ] GoalCard.tsx displays goal with Complete button
- [ ] GoalList.tsx fetches and displays all goals
- [ ] Clicking Complete calculates XP correctly
- [ ] Completion record inserted into database
- [ ] Goal streak_count increments
- [ ] User total_xp updates
- [ ] Level up triggers at correct XP threshold
- [ ] Stat entries created for each subcategory
- [ ] No database errors in Supabase logs

**Status**: Core gamification working, now build dashboard visualization

---

#### **DAY 12: Week 2 Final Testing & Commits (Friday)**

**Friday Morning (2 hours)**
1. **End-to-End Testing**
   - Sign up as new user
   - Create 5 goals across different categories
   - Complete each goal multiple times
   - Verify levels up correctly
   - Verify streaks work for daily goals

2. **Database Verification**
   - Check `users` table → verify level and total_xp
   - Check `goals` table → verify all goals have correct data
   - Check `completions` table → verify each completion recorded
   - Check `stats` table → verify subcategories have points

**Friday Afternoon (1-2 hours)**
3. **Final Commit**
   - `git add .`
   - `git commit -m "Week 2 complete: Goal creation and XP system working"`

**End of Week 2 Checklist**
- [ ] Goal creation form working
- [ ] Goal completion working
- [ ] XP calculation correct (base × multiplier + streak)
- [ ] Leveling system working
- [ ] Streak tracking working
- [ ] Stats being updated
- [ ] Database data clean and consistent
- [ ] No errors in console
- [ ] All code committed

**Deliverable**: Complete gamification core (goals, XP, levels, streaks)  
**Status**: Ready for Week 3-4 (Dashboard visualization)

---

## PHASE 4: SCAFFOLD + VISUALIZATION (WEEKS 3-4)

---

## WEEK 3: DASHBOARD + HEXAGONAL STATS

### **Monday-Wednesday: Dashboard Building (3 days)**

**Monday Morning (3-4 hours)**
1. **Run PROMPT 6 to Claude**
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

2. **Create Dashboard Components**
   - Claude will generate multiple components
   - Create:
     - `src/pages/Dashboard.tsx`
     - `src/components/Stats/HexagonalChart.tsx`
     - `src/components/Stats/LevelProgress.tsx` (if Claude suggests)

3. **Update App.tsx**
   - Replace dashboard route to use new Dashboard.tsx

**Monday Afternoon (2-3 hours)**
4. **Test Dashboard Display**
   - Login to app
   - Navigate to dashboard
   - You should see:
     - Your level and XP progress
     - Hexagonal radar chart with 6 categories
     - List of active goals

5. **Verify Chart Data**
   - Chart should show your actual stats
   - Check that subcategories aggregate to top-level correctly
   - Example: Health = Physical + Mental + Spiritual

**Tuesday Morning (2 hours)**
6. **Test Chart Updates**
   - Complete a goal (adds XP to specific subcategory)
   - Refresh dashboard
   - Chart should update to show new values

7. **Style Improvements** (if time)
   - Dashboard should look clean and professional
   - Hexagonal chart should be visually clear
   - Colors should match your brand (not Solo Leveling colors)

**Tuesday Afternoon (1 hour)**
8. **Commit to Git**
   - `git add .`
   - `git commit -m "Add dashboard with hexagonal stats chart"`

**Wednesday: Testing & Polish (1 full day)**
9. **Comprehensive Dashboard Testing**
   - Complete multiple goals across different categories
   - Verify chart updates correctly
   - Test with multiple users (create second account)
   - Verify each user only sees their own data (RLS working)

10. **Performance Check**
    - Dashboard should load in < 2 seconds
    - Chart should animate smoothly
    - No console errors

**End of Week 3 Checklist**
- [ ] Dashboard page created
- [ ] HexagonalChart component displays radar chart
- [ ] Level/XP progress bar shows correct values
- [ ] Active goals list displays
- [ ] Chart updates when goals completed
- [ ] Subcategories aggregate to top-level
- [ ] Each user only sees their own data
- [ ] No performance issues
- [ ] Professional appearance

**Status**: Dashboard working, now add streak reset logic

---

## WEEK 4: STREAK RESET + FINAL TESTING

### **Monday-Wednesday: Streak Logic (3 days)**

**Monday Morning (2-3 hours)**
1. **Run PROMPT 7 to Claude**
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

2. **Create Streak Checker Utility**
   - Claude generates `streakChecker.ts`
   - Create file: `src/utils/streakChecker.ts`
   - This function runs every time user opens dashboard

3. **Integrate Into Dashboard**
   - In Dashboard.tsx useEffect:
     ```typescript
     useEffect(() => {
       checkAndResetStreaks(userId)
     }, [userId])
     ```

**Monday Afternoon (2 hours)**
4. **Test Streak Reset**
   - Create a daily goal and complete it
   - Wait until next day (or simulate with date mocking)
   - Don't complete goal for 1 day
   - Open dashboard next day
   - Streak should reset to 0

5. **Test Ongoing Streak**
   - Complete a daily goal
   - Next day, complete it again
   - Streak should be 2
   - Keep going for 5 days
   - Streak should show 5

**Tuesday: Testing All Features (1 full day)**
6. **Complete User Journey Test**
   - Create new account
   - Create 5 goals across different categories
   - Complete each goal
   - Check level progression
   - Check stats aggregation
   - Check streaks work
   - Wait a day (or simulate)
   - Check streak reset works

7. **Multiple User Test**
   - Create second account
   - Create goals, complete them
   - Verify User A can't see User B's data
   - Verify User B has separate stats

8. **Edge Case Testing**
   - What if user completes same goal 10 times in one day?
   - What if goal quality multiplier is 2.5x?
   - What if user reaches level 10+?
   - All should work without errors

**Wednesday: Documentation & Polish (1 full day)**
9. **Code Documentation**
   - Add comments to complex logic
   - Document XP formulas in code
   - Document streak rules

10. **Final Polish**
    - Make sure UI is clean
    - Fix any styling inconsistencies
    - Ensure responsive design (works on mobile)
    - No typos in text

11. **Final Commit**
    - `git add .`
    - `git commit -m "Add streak reset logic and complete testing"`

**End of Week 4 Checklist**
- [ ] Streak reset logic implemented
- [ ] checkAndResetStreaks function working
- [ ] Streaks persist if goal completed daily
- [ ] Streaks reset if goal missed one day
- [ ] Multiple users tested (RLS verified)
- [ ] Edge cases tested
- [ ] All features working together
- [ ] No console errors
- [ ] Code well-commented
- [ ] Professional UI appearance

**Deliverable**: Complete, tested gamification MVP  
**Status**: Ready for deployment (Phase 5)

---

## PHASE 5: DEPLOYMENT WITH COST GUARDS (WEEK 5)

---

## WEEK 5: GITHUB + VERCEL DEPLOYMENT

### **Monday: Pre-Deployment Checks (1 day)**

**Monday Full Day**
1. **Security Checklist**
   - [ ] RLS enabled on all tables
   - [ ] RLS policies tested (try accessing other user's data)
   - [ ] .env file in .gitignore
   - [ ] No console.log with sensitive data
   - [ ] Supabase anon key in frontend (not service_role)
   - [ ] Rate limiting enabled in Supabase
   - [ ] Cost alerts configured in Supabase

2. **Code Quality Checklist**
   - [ ] No unused imports
   - [ ] No TODO comments
   - [ ] All functions documented
   - [ ] No hard-coded values (use constants/config)
   - [ ] Error handling for all API calls

3. **Testing Checklist**
   - [ ] Signup works
   - [ ] Login works
   - [ ] Create goal works
   - [ ] Complete goal works
   - [ ] Dashboard displays correctly
   - [ ] Stats update correctly
   - [ ] Levels up correctly
   - [ ] Streaks work correctly
   - [ ] RLS prevents cross-user data access
   - [ ] No console errors

---

### **Tuesday: GitHub Push (1 day)**

**Tuesday Full Day**
1. **Create GitHub Repository**
   - Go to github.com
   - Click "New Repository"
   - Name: `level-up-system`
   - Description: "Gamified self-improvement app using Solo Leveling mechanics"
   - Public (for portfolio)
   - Create repository (don't add README yet)

2. **Push Code to GitHub**
   - In terminal (in your project):
     ```bash
     git remote add origin https://github.com/YOUR_USERNAME/level-up-system.git
     git branch -M main
     git push -u origin main
     ```
   - This pushes all your commits to GitHub

3. **Verify on GitHub**
   - Go to your repo on github.com
   - You should see all your files
   - Verify .env is NOT there (check .gitignore worked)
   - Verify .env.example IS there

4. **Create README.md**
   - Create file: `README.md` in your project root
   - Add content:
     ```markdown
     # Level Up System
     
     A gamified self-improvement app inspired by Solo Leveling.
     
     ## Features
     - Create personal development goals
     - Earn XP and level up
     - Track progress with hierarchical statistics
     - Quality-weighted point system
     - Streak tracking
     
     ## Tech Stack
     - React + TypeScript
     - Supabase (database + auth)
     - Tailwind CSS
     - Recharts
     
     ## Getting Started
     1. Clone repo
     2. Create `.env` file with Supabase credentials
     3. Run `npm install`
     4. Run `npm run dev`
     
     ## Deployed at
     (Will add Vercel URL here)
     ```

5. **Commit and Push README**
   - `git add README.md`
   - `git commit -m "Add README documentation"`
   - `git push`

---

### **Wednesday: Vercel Deployment (1 day)**

**Wednesday Full Day**
1. **Deploy to Vercel**
   - Go to vercel.com
   - Click "Add New Project"
   - Select your GitHub repo (level-up-system)
   - Framework Preset: Vite
   - Click "Deploy"
   - Wait 2-3 minutes

2. **Configure Environment Variables in Vercel**
   - After deploy completes, go to project settings
   - Click "Environment Variables"
   - Add two variables:
     - Name: `VITE_SUPABASE_URL` → Value: your URL
     - Name: `VITE_SUPABASE_ANON_KEY` → Value: your anon key
   - Click "Save"

3. **Redeploy with Environment Variables**
   - Go back to deployments
   - Click "Redeploy" on latest deployment
   - Wait for new deploy to complete

4. **Test Production App**
   - Vercel will give you URL (like: https://level-up-system.vercel.app)
   - Click the URL to open your live app
   - Test full flow:
     - Sign up
     - Create goal
     - Complete goal
     - Check dashboard
     - Check stats update

5. **Update GitHub README**
   - Edit README.md on GitHub
   - Add your Vercel URL under "Deployed at"
   - Commit change

---

### **Thursday: Configure Cost Guards (1 day)**

**Thursday Full Day**
1. **Enable Supabase Rate Limiting**
   - Go to Supabase Dashboard
   - Click Project Settings → API
   - Rate Limiting should be enabled by default
   - Limit: 60 requests per minute per IP
   - This prevents bot attacks

2. **Configure Cost Alerts**
   - Go to Supabase Dashboard → Billing
   - Set email alerts for:
     - Database > 400 MB
     - Bandwidth > 1.5 GB/month
   - You'll get emailed if limits approach

3. **Check Database Backups**
   - Go to Settings → Database
   - Backups should be enabled automatically
   - Keep automated backups on (7-day retention)

4. **Set Up Monitoring**
   - Go to Supabase Dashboard → Analytics
   - Watch dashboard for unusual activity
   - If you see spikes, check logs

---

### **Friday: Final Verification (1 day)**

**Friday Full Day**
1. **Live App Testing**
   - Visit your Vercel URL
   - Test all features again
   - Verify everything works same as local

2. **Performance Check**
   - Open browser DevTools (F12)
   - Check Console for errors (should be none)
   - Check Network tab for slow requests

3. **Security Verification**
   - Try accessing API directly:
     - Open DevTools Console
     - Try: `fetch('https://your-supabase-url/rest/v1/goals?select=*')`
     - Should get 401 Unauthorized (good!)
   - This means RLS is working

4. **Final Git Push** (if any changes)
   - `git add .`
   - `git commit -m "Production deployment verified"`
   - `git push`

**End of Week 5 Checklist**
- [ ] GitHub repo created
- [ ] All code pushed to GitHub
- [ ] .env not committed
- [ ] README with documentation
- [ ] Vercel deployment successful
- [ ] Environment variables configured in Vercel
- [ ] Live app tested and working
- [ ] Supabase rate limiting enabled
- [ ] Cost alerts configured
- [ ] Database backups enabled
- [ ] No security vulnerabilities

**Deliverable**: Live production app at Vercel URL  
**Status**: Ready for Phase 6 (Hardening + Learning)

---

## PHASE 6: HARDENING + LEARNING (WEEKS 6-8)

---

## WEEK 6: MONITORING + DOCUMENTATION

### **Days 1-5: Add Monitoring (Monday-Friday)**

1. **Add Error Logging**
   - Create `src/utils/errorLogger.ts`
   - All API errors logged with timestamp
   - Check Supabase logs regularly for issues

2. **Set Up Analytics**
   - Go to Supabase Dashboard → Analytics
   - Check daily active users
   - Check API response times
   - Monitor for unusual spikes

3. **Create Architecture Documentation**
   - Write detailed docs about:
     - Data model (why 4 tables)
     - Auth flow (signup → dashboard)
     - XP calculation logic
     - Streak system
   - Save in `docs/` folder in GitHub

4. **Write Build Journey Blog Post**
   - Document what you learned
   - Include:
     - Challenges faced
     - How you solved them
     - Architecture decisions
     - Time spent on each phase
     - What you'd do differently

---

## WEEK 7: LOAD TESTING + SECURITY AUDIT

### **Days 1-5: Testing (Monday-Friday)**

1. **Load Test with Friends**
   - Invite 10-20 friends to use app
   - Have them create goals, complete them
   - Monitor for:
     - Slow response times
     - Database errors
     - UI bugs
   - Fix any issues found

2. **Security Checklist** (33-item from Reddit research)
   - [ ] RLS policies prevent cross-user access
   - [ ] Rate limiting prevents bot attacks
   - [ ] No secrets in code
   - [ ] Error messages don't leak system info
   - [ ] Input validation on all forms
   - [ ] Authentication required for all endpoints
   - [ ] Password minimum 8 characters
   - [ ] Timestamps validate correctly
   - [ ] Database backups working
   - [ ] And 24 more items from research...

---

## WEEK 8: FINAL POLISH + PORTFOLIO

### **Days 1-5: Polish (Monday-Friday)**

1. **UI/UX Polish**
   - Responsive design (works on mobile)
   - Consistent color scheme
   - Professional fonts
   - Smooth animations

2. **Performance Optimization**
   - Check Lighthouse score (target: 90+)
   - Optimize images
   - Minimize CSS/JS

3. **Portfolio Showcase**
   - Take screenshots of:
     - Login page
     - Dashboard with stats
     - Goal creation
     - Leveling up
   - Add screenshots to GitHub README
   - Write about unique features

4. **Final Documentation**
   - Update README with:
     - Feature list
     - Architecture overview
     - How to run locally
     - Deployment notes
   - Add links to:
     - Live demo
     - Blog post (if written)
     - Architecture docs

---

## FINAL DELIVERABLES

After 8 weeks you have:

✅ **Live Production App**
- URL: https://level-up-system.vercel.app
- Features working and tested
- Security hardened

✅ **GitHub Repository**
- Clean code with comments
- Professional README
- Architecture documentation
- Build journey documented

✅ **Portfolio Piece**
- Screenshots showing features
- Write-up of challenges and solutions
- Links to live app and GitHub

✅ **Learning Achieved**
- React + TypeScript skills
- Supabase (database + auth) skills
- Deployment and DevOps basics
- Security best practices
- Full-stack development knowledge

✅ **For Future Projects**
- Reusable code patterns
- Security-first mindset
- Testing strategies
- Deployment process documented

---

**This is your complete 8-week roadmap to a production-ready app.**

Reference this document during each week to stay on track.

Last Updated: May 17, 2026  
Timeline: 8 weeks to production MVP
