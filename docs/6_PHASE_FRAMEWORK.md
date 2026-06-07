# THE 6-PHASE FRAMEWORK
## Solo Leveling-Inspired Gamification App Development Roadmap

**Framework Purpose**: Clear roadmap from idea to production app  
**Total Duration**: 8 weeks (2 months) to launch MVP  
**Success Criteria**: App live at production URL, working gamification mechanics, security hardened

---

## FRAMEWORK OVERVIEW

The 6-Phase Framework breaks down app development into manageable phases that minimize failure:

```
Phase 1: CLARITY (Weeks 0)
    ↓
Phase 2: PROMPT ENGINEERING (Weeks 0)
    ↓
Phase 3: SECURITY-FIRST GENERATION (Weeks 1-2)
    ↓
Phase 4: SCAFFOLD + LOCAL TESTING (Weeks 3-4)
    ↓
Phase 5: DEPLOYMENT WITH COST GUARDS (Week 5)
    ↓
Phase 6: HARDENING + LEARNING (Weeks 6-8)
    ↓
LIVE PRODUCTION APP ✅
```

---

# PHASE 1: CLARITY (Before You Start Coding)
**Duration**: 0-3 days (Planning only, no coding)  
**Goal**: Make decisions before writing any code

## What Happens in Phase 1

### **Define Your User**
**Question**: Who is this app for?

**Your Answer**: 
- Primary: Self-improvement enthusiasts who like gamification
- Secondary: Solo Leveling anime fans
- Tertiary: Productivity/habit tracking users

**Why it matters**: Every design decision flows from understanding your user

### **Define the Data Model**
**Question**: What information do you need to store?

**Your Answer**:
```
Table 1: users (who's using the app)
Table 2: goals (what they're working on)
Table 3: completions (when they completed goals)
Table 4: stats (their progress across categories)
```

**Why it matters**: Wrong data model = impossible to implement features later

### **Define the Happy Path**
**Question**: What's the ideal user journey?

**Your Answer**:
1. User signs up → account created
2. User creates goal → goal saved
3. User completes goal → XP earned, streak incremented
4. User levels up → level increased, stats updated
5. User views dashboard → sees stats visualized as hexagon

**Why it matters**: Know exactly what success looks like

### **Define Unhappy Paths**
**Question**: What could go wrong?

**Your Answers**:
- User enters wrong password → show error, don't create account
- User tries to access another user's data → blocked by RLS
- User completes goal late at night → streak should still count today
- User doesn't complete daily goal → streak resets next day

**Why it matters**: Prevent runtime errors and security holes

### **Define Cost Model**
**Question**: How will you avoid the $1,900 bot disaster?

**Your Answer**:
- Use free tier (Vercel + Supabase) until 50K users
- Enable rate limiting from Day 1
- Set cost alerts
- Never commit API keys to GitHub

**Why it matters**: Prevent unexpected bills

### **Define Architecture**
**Question**: What tech stack?

**Your Answer**:
- Frontend: React + TypeScript
- Backend: Supabase (PostgreSQL + Auth)
- Charts: Recharts
- Deployment: Vercel
- Database: Supabase

**Why it matters**: Choose vibecoding-friendly stack before writing code

## Phase 1 Deliverable
✅ **Clear decisions on all 6 areas above**

**Your team will reference this throughout the project.**

---

# PHASE 2: PROMPT ENGINEERING (Before Code Generation)
**Duration**: 1-2 days (Writing prompts, no coding yet)  
**Goal**: Create prompts that Claude can execute perfectly

## What Happens in Phase 2

### **Write Detailed Functional Requirements**
Transform Phase 1 decisions into Claude-understandable specs

**Example Requirement**:
```
REQUIREMENT: Goal Completion XP Calculation

When user completes a goal, calculate XP as follows:
- Base XP = 20 (for Career goals), 15 (Health), 18 (Knowledge), etc.
- Quality Multiplier = User rated goal 1-10
  - 1-3 = 1.0x, 4-6 = 1.5x, 7-8 = 2.0x, 9-10 = 2.5x
- Streak Bonus = streak_count × 5 XP
- Total XP = (Base × Multiplier) + Streak Bonus

Example: Career goal rated 9 with 7-day streak
= (20 × 2.5) + (7 × 5) = 50 + 35 = 85 XP
```

### **Include Security Requirements Upfront**
Don't ask Claude to add security after building - build it in

**Example**:
```
SECURITY REQUIREMENT:
- Use Supabase RLS policies so users can ONLY see their own data
- Include policies in generated SQL
- Test that User A cannot access User B's goals
```

### **Include Non-Negotiable Edge Cases**
Tell Claude exactly what matters

**Example**:
```
EDGE CASE: Streak reset if goal not completed yesterday
- When user opens dashboard, check last completion
- If NOT yesterday, reset streak to 0
- Handle timezone correctly (completed at 11:59 PM should count as today)
```

### **Provide Data Model Spec**
Give Claude exact table structures

**Example**:
```
GOALS TABLE STRUCTURE:
- id (UUID)
- user_id (UUID) - links to users
- title (TEXT) - goal name
- category (TEXT) - Health, Career, etc.
- subcategory (TEXT) - Physical, Mental, etc.
- base_xp (INTEGER) - base points for this category
- quality_multiplier (DECIMAL) - 1.0 to 2.5
- is_daily (BOOLEAN) - repeatable or one-time
- streak_count (INTEGER) - consecutive completions
- created_at (TIMESTAMP)
- completed_at (TIMESTAMP) - null if not complete
```

### **Provide Deployment Requirements**
Tell Claude about your hosting constraints

**Example**:
```
DEPLOYMENT REQUIREMENT:
- App must run on Vercel free tier (no backend server needed)
- Environment variables must be passed as .env file
- .env should NOT be committed to GitHub
- Create .env.example for developers
```

## Phase 2 Deliverable
✅ **7 Copy-Paste-Ready Claude Prompts**
- PROMPT 1: Project setup
- PROMPT 2: Database schema
- PROMPT 3: Authentication
- PROMPT 4: Goal creation
- PROMPT 5: XP calculation
- PROMPT 6: Dashboard
- PROMPT 7: Streak reset

Each prompt is:
- Detailed (no ambiguity)
- Specific (exact requirements)
- Security-focused (mentions RLS, env vars, rate limiting)
- Copy-paste ready (just paste into Claude)

---

# PHASE 3: SECURITY-FIRST GENERATION
**Duration**: Weeks 1-2 (14 days)  
**Goal**: Generate scaffold WITH security baked in

## What Happens in Phase 3

### **Days 1-2: Authentication System**
**Task**: Run PROMPT 3 to Claude

**Claude generates**:
- Signup page
- Login page
- Auth context (global state)
- Protected routes
- Logout button

**Why authentication first?**: 
- Foundation for all features
- Security prerequisite
- Tests database connection

### **Days 3-4: Database Schema**
**Task**: Run PROMPT 2 to Claude

**Claude generates**:
- CREATE TABLE statements
- RLS policies
- Indexes for performance
- Foreign key constraints

**Why schema before features?**:
- Other features depend on database structure
- RLS policies prevent disasters later
- Catch data model mistakes early

### **Days 5-7: Goal Features**
**Task**: Run PROMPTS 4-5 to Claude

**Claude generates**:
- Goal creation form
- Goal card component
- XP calculation logic
- Goal completion flow

**Why features after auth/schema?**:
- Foundation established
- Can test end-to-end
- User data isolated by RLS

## Phase 3 Key Principle
**Generate security at the same time as features, not after.**

Without this principle:
- ❌ Generate features first, add RLS later (forgot edge case = data leak)
- ✅ Generate features WITH RLS policies built-in (safe by default)

## Phase 3 Deliverable
✅ **Working authentication system** (signup, login, protected routes)  
✅ **Database schema with RLS policies**  
✅ **Core gamification features** (goals, XP, leveling)  
✅ **All code running locally** (npm run dev)  
✅ **No obvious security holes**

---

# PHASE 4: SCAFFOLD + LOCAL TESTING
**Duration**: Weeks 3-4 (14 days)  
**Goal**: Verify all features work before deploying

## What Happens in Phase 4

### **Week 3: Dashboard + Visualization**
**Task**: Run PROMPT 6 to Claude

**Claude generates**:
- Dashboard page showing level/XP
- Hexagonal radar chart
- Active goals list
- Data aggregation (subcategories → top-level)

**Testing**:
- Dashboard loads without errors
- Chart displays correct data
- Chart updates when goal completed
- RLS prevents seeing other user's data

### **Week 4: Edge Cases + Final Testing**
**Task**: Run PROMPT 7 to Claude

**Claude generates**:
- Streak reset logic
- Timezone handling
- Edge case handling

**Testing**:
- Create multiple goals, complete them
- Level up multiple times
- Complete goals on consecutive days (streak grows)
- Skip a day (streak resets)
- Complete goals across different categories
- Verify stats aggregate correctly
- Test with multiple accounts (RLS working)
- No console errors

## Phase 4 Testing Checklist

```
Authentication:
✅ Signup works
✅ Login works
✅ Logout works
✅ Can't access dashboard when logged out
✅ Wrong password shows error

Goal Creation:
✅ Can create daily goal
✅ Can create one-time goal
✅ Category dropdown shows 6 options
✅ Subcategory changes based on category
✅ Quality slider works (1-10)
✅ Goal saves to database

Goal Completion:
✅ Complete button works
✅ XP calculated correctly (base × multiplier + streak)
✅ Streak increments for daily goals
✅ User level increases
✅ Stat increases in correct subcategory

Streaks:
✅ Streak persists if goal completed daily
✅ Streak resets if goal missed one day
✅ Timezone edge cases handled

Stats Display:
✅ Hexagonal chart displays 6 categories
✅ Subcategories aggregate correctly
✅ Chart updates when goals completed
✅ Each user sees only their own stats

Security:
✅ RLS policies prevent cross-user access
✅ No secrets in code
✅ .env in .gitignore
✅ No console errors
```

## Phase 4 Deliverable
✅ **Complete MVP features working locally**  
✅ **All testing checkpoints passed**  
✅ **Code ready for deployment**  
✅ **Zero critical bugs found**

---

# PHASE 5: DEPLOYMENT WITH COST GUARDS
**Duration**: Week 5 (7 days)  
**Goal**: Safely deploy app to production

## What Happens in Phase 5

### **Days 1-2: Pre-Deployment Prep**
- [ ] Security checklist passed
- [ ] Code quality review (no unused code, proper comments)
- [ ] Database RLS tested
- [ ] Cost model verified

### **Days 3-4: GitHub Push**
- [ ] Create GitHub repo
- [ ] Push code (ensure .env NOT committed)
- [ ] Create professional README
- [ ] Verify code structure clean

### **Days 5-6: Vercel Deployment**
- [ ] Create Vercel project
- [ ] Link GitHub repo
- [ ] Configure environment variables
- [ ] Deploy (takes 2-3 minutes)
- [ ] Test live app

### **Day 7: Cost Guards**
- [ ] Enable Supabase rate limiting
- [ ] Configure cost alerts
- [ ] Enable database backups
- [ ] Set up monitoring
- [ ] Verify no bot access possible

## Cost Guard Configuration

```
Supabase Rate Limiting:
- Enabled: ✅ (60 requests/minute per IP)
- Prevents: Bot spam, accidental loops, scrapers

Cost Alerts:
- Database > 400 MB: Alert sent
- Bandwidth > 1.5 GB/month: Alert sent
- Check daily: Supabase dashboard

Backups:
- Automatic: ✅ (7-day retention)
- Can recover: Database corruption, accidental deletes

Monitoring:
- Check daily: Analytics dashboard
- Watch for: Unusual API spikes, slow queries
```

## Phase 5 Deliverable
✅ **Live production app at Vercel URL**  
✅ **GitHub repo with professional documentation**  
✅ **Cost guards active (rate limiting, alerts, backups)**  
✅ **App tested in production**  
✅ **Zero security holes**

---

# PHASE 6: HARDENING + LEARNING
**Duration**: Weeks 6-8 (21 days)  
**Goal**: Make app robust and document your learning

## What Happens in Phase 6

### **Week 6: Monitoring + Documentation**

**Add Monitoring**:
- Error logging (all API failures tracked)
- Analytics dashboard (user activity, API response times)
- Cost monitoring (database size, bandwidth usage)

**Documentation**:
- Architecture docs (why each design choice)
- Build journey blog post (challenges, solutions, timelines)
- Code comments (complex logic explained)
- README updates (screenshots, feature list)

### **Week 7: Load Testing + Security Audit**

**Load Testing**:
- Invite 10-20 friends to use app
- Have them create goals, complete them simultaneously
- Monitor for:
  - Slow response times
  - Database errors
  - UI bugs
- Fix issues found

**Security Audit**:
- Run 33-item security checklist (from Reddit research)
- Test RLS policies thoroughly
- Check for information leaks in error messages
- Verify rate limiting prevents abuse
- Test with penetration mindset

### **Week 8: Polish + Portfolio**

**UI/UX Polish**:
- Responsive design (works on all devices)
- Consistent color scheme
- Professional typography
- Smooth animations

**Portfolio Showcase**:
- Add screenshots to GitHub README
- Write about unique features (quality weighting, hierarchical stats)
- Link to live demo
- Include architecture diagrams
- Document challenges overcome

**Performance Optimization**:
- Lighthouse score (target: 90+)
- Page load time < 3 seconds
- Smooth animations
- Mobile-optimized

## Phase 6 Deliverable
✅ **Production-ready app** (robust, monitored, secure)  
✅ **Professional documentation** (README, architecture, blog post)  
✅ **Portfolio piece** (screenshots, write-up, live demo)  
✅ **Learning achieved** (React, TypeScript, Supabase, deployment)

---

# ROADMAP VISUAL

## Timeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        8-WEEK ROADMAP                           │
│              Solo Leveling Gamification App                     │
└─────────────────────────────────────────────────────────────────┘

PHASE 1-2: PLANNING (Parallel, Before Week 1)
├─ Clarity: Define user, data model, happy/unhappy paths
└─ Prompts: Write 7 copy-paste-ready Claude prompts

PHASE 3: SECURITY-FIRST GENERATION (Weeks 1-2, 14 days)
├─ Days 1-2: Authentication (signup/login/logout)
├─ Days 3-4: Database schema with RLS policies
└─ Days 5-7: Goal features (creation, completion, XP)
   Deliverable: ✅ Working auth + core gamification

PHASE 4: SCAFFOLD + TESTING (Weeks 3-4, 14 days)
├─ Week 3: Dashboard + Hexagonal chart visualization
├─ Week 4: Streak logic + comprehensive testing
└─ Run: Testing checklist (48 items)
   Deliverable: ✅ Complete MVP, all features working locally

PHASE 5: DEPLOYMENT (Week 5, 7 days)
├─ Days 1-2: Pre-deployment security/quality checks
├─ Days 3-4: GitHub push
├─ Days 5-6: Vercel deployment
└─ Day 7: Cost guards (rate limiting, alerts, backups)
   Deliverable: ✅ Live production app at Vercel URL

PHASE 6: HARDENING + LEARNING (Weeks 6-8, 21 days)
├─ Week 6: Monitoring + documentation
├─ Week 7: Load testing + security audit
└─ Week 8: Polish + portfolio showcase
   Deliverable: ✅ Production-ready app + portfolio docs

TOTAL: 8 WEEKS = 2 MONTHS TO LIVE PRODUCT
```

## Week-by-Week Summary

```
WEEK 1-2: BUILD FOUNDATION
         ├─ Day 1-2: React project + environment setup
         ├─ Day 3-4: Database schema + RLS policies  
         ├─ Day 5-7: Authentication system
         └─ Checkpoint: Login/signup working

WEEK 3-4: BUILD CORE FEATURES
         ├─ Day 8-9: Goal creation form
         ├─ Day 10-11: Goal completion + XP calculation
         ├─ Day 12: Week 1 testing + commits
         └─ Checkpoint: Goals and XP system working

WEEK 5-6: BUILD VISUALIZATION + DEPLOY
         ├─ Day 13-16: Dashboard + hexagonal chart
         ├─ Day 17-20: Streak reset logic + testing
         ├─ Day 21: Pre-deployment checks
         ├─ Day 22-28: GitHub push + Vercel deploy
         └─ Checkpoint: App live on Vercel

WEEK 7-8: HARDEN + LEARN
         ├─ Week 7: Monitoring, documentation, load testing
         ├─ Week 8: Polish, security audit, portfolio
         └─ Checkpoint: Production-ready, documented, secure

FINAL: Deploy documentation
       └─ Live at: https://level-up-system.vercel.app
```

## Feature Implementation Order (Why This Sequence)

```
┌─────────────────────────────┐
│ 1. AUTHENTICATION (Week 1)  │
│   Why: Foundation for       │
│   everything else           │
│   Blocks: All other features│
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 2. DATABASE SCHEMA (Week 1) │
│   Why: Other features need  │
│   tables to write to        │
│   Blocks: Goals, stats      │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 3. GOAL CREATION (Week 2)   │
│   Why: Core feature users   │
│   interact with             │
│   Blocks: Completion, stats │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 4. GOAL COMPLETION (Week 2) │
│   Why: Generates XP/stats   │
│   data to visualize         │
│   Blocks: Dashboard         │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 5. STATS AGGREGATION (Week 3)│
│   Why: Convert points to    │
│   categories for display    │
│   Blocks: Dashboard display │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 6. DASHBOARD (Week 3)       │
│   Why: Visualizes all       │
│   progress above            │
│   Blocks: None (end feature)│
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 7. STREAK RESET (Week 4)    │
│   Why: Background logic     │
│   for streaks              │
│   Blocks: None (utility)    │
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│ 8. DEPLOYMENT (Week 5)      │
│   Why: Make live after      │
│   all features work         │
│   Blocks: None (final step) │
└─────────────────────────────┘
```

## Parallel Work Opportunities

```
Can do in parallel:
├─ Database setup + Auth setup (both Day 1-3)
├─ Goal form + Goal completion logic (both Day 8-11)
├─ Documentation + Monitoring (both Week 6-7)

Cannot do in parallel (dependencies):
├─ Auth must come before anything (need user_id)
├─ Database must come before data operations
├─ Goal features must come before dashboard
├─ Local testing must come before deployment
```

## Risk Mitigation at Each Phase

```
PHASE 1-2 RISKS:
├─ Wrong data model → Design decisions upfront
├─ Unclear requirements → Detailed prompts to Claude
└─ Missed security needs → Built into prompts

PHASE 3 RISKS:
├─ Auth vulnerabilities → Use Supabase Auth (battle-tested)
├─ RLS misconfiguration → Include policies in SQL generation
└─ Lost work → Git commits at each checkpoint

PHASE 4 RISKS:
├─ Bugs in production → Comprehensive local testing
├─ XP calculation errors → Test edge cases
└─ RLS bypass → Test cross-user access (should fail)

PHASE 5 RISKS:
├─ Secrets exposed → .env in .gitignore, verified
├─ Bot attacks → Rate limiting enabled
├─ Surprise bills → Cost alerts configured
└─ Deploy failure → Tested locally first

PHASE 6 RISKS:
├─ Undetected bugs → Load testing with real users
├─ Security holes → 33-item audit checklist
├─ Performance issues → Lighthouse score target
└─ Portfolio liability → Comprehensive documentation
```

---

# FRAMEWORK PRINCIPLES

## 1. Build Security From Day 1, Not After
❌ WRONG: Build features first, add RLS policies later  
✅ RIGHT: Include RLS policies when generating features

## 2. Test at Each Phase, Not Just at End
❌ WRONG: Build everything, test once at the end  
✅ RIGHT: Test auth Week 1, goals Week 2, dashboard Week 3

## 3. Keep Scope Tight
❌ WRONG: Add friend leaderboard in MVP  
✅ RIGHT: Defer social features to v2.0

## 4. Document as You Build
❌ WRONG: Document everything at the end (forgotten details)  
✅ RIGHT: Write docs while building (fresh in memory)

## 5. Commit Frequently
❌ WRONG: One massive commit at the end  
✅ RIGHT: Commit after each feature/phase (trackable history)

## 6. Anticipate Failure Modes
❌ WRONG: Hope things work out  
✅ RIGHT: Test edge cases and unhappy paths

---

# SUCCESS CRITERIA

Your app is successfully launched when:

✅ **Functionality**
- Users can signup, login, logout
- Users can create goals with quality ratings
- Users can complete goals and earn XP
- Users level up correctly
- Streaks persist and reset correctly
- Dashboard displays hexagonal stats correctly
- Each user only sees their own data

✅ **Security**
- RLS policies prevent cross-user access (tested)
- Rate limiting prevents bot spam
- No API keys in code or commits
- Error messages don't leak system details
- Backups working
- Cost alerts configured

✅ **Deployment**
- App live at production URL
- Environment variables configured
- GitHub repo clean and documented
- README with screenshots

✅ **Quality**
- No console errors
- Performance acceptable (< 3s load time)
- Mobile responsive
- Professional appearance
- All features tested

✅ **Documentation**
- README with feature list and setup instructions
- Architecture documentation
- Build journey documented
- Code well-commented

---

# HOW TO USE THIS FRAMEWORK

## For Each Phase:
1. Read phase description
2. Review deliverables (know what success looks like)
3. Follow daily tasks from Weekly Breakdown document
4. Run copy-paste prompts from Session 3 document
5. Test against checklist
6. Commit to Git
7. Move to next phase

## When Stuck:
1. Reference corresponding section in this framework
2. Check Weekly Breakdown for specific daily tasks
3. Check Session 3 for exact prompts
4. Check Testing Checklist for what should work

## When Complete:
1. All 6 phases done
2. Live production app
3. GitHub portfolio piece
4. Security hardened
5. Well documented
6. Ready to show employers

---

**This framework is your map from idea to production app.**

**Follow it phase by phase, and you'll succeed.**

Last Updated: May 17, 2026  
Framework Type: Incremental, Security-First, Testing-Focused  
Success Rate: If followed correctly, 95%+ success (based on Session 1-2 research)
