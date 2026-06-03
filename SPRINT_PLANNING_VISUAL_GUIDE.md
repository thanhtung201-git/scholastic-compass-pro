# Sprint Planning - Visual Fix Guide

## Your Current Issue

```
┌─────────────────────────────────────────┐
│ Sprint Planning Page                     │
├─────────────────────────────────────────┤
│                                         │
│ Sprints (left)          Sprint Details  │
│ ├─ Gap of              ├─ Sprint info   │
│ ├─ Kỳ ho               └─ No tasks ❌   │
│ └─ [New Sprint]                         │
│                                         │
│ Backlog (bottom)                        │
│ "0 tasks" ❌                            │
│ "All tasks assigned"                    │
│                                         │
└─────────────────────────────────────────┘
```

**Problem:** Database tables missing or incomplete

---

## The Fix (3 Steps, 5 Minutes)

### STEP 1️⃣: Run Database Schema

```
📌 Where: Supabase Dashboard
📝 What: Execute SPRINT_SCHEMA.sql
⏱️ Time: 1 minute

BEFORE:
  ❌ sprints table missing
  ❌ sprint_id column missing

AFTER:
  ✅ sprints table created
  ✅ sprint_id added to tasks
  ✅ Ready to use
```

**How To:**
```
1. Supabase.com → Your Project
2. SQL Editor → New Query
3. Copy: SPRINT_SCHEMA.sql
4. Paste into editor
5. RUN
6. ✅ "Success!" message
```

---

### STEP 2️⃣: Create Sample Tasks

```
📌 Where: Task Assignment Page
📝 What: Create 3+ test tasks
⏱️ Time: 2 minutes

BEFORE:
  ❌ Database empty
  ❌ Nothing to assign

AFTER:
  ✅ Tasks created
  ✅ Backlog populated
  ✅ Ready to assign
```

**How To:**
```
1. http://localhost:5173/app/task-assignment
2. Click [New Task]
3. Fill: Title, Dept, Assignee, Priority
4. Create
5. Repeat 3 times
```

---

### STEP 3️⃣: Refresh Sprint Planning

```
📌 Where: Sprint Planning Page
📝 What: Hard refresh + verify
⏱️ Time: 30 seconds

BEFORE:
  ❌ Backlog: 0 tasks
  ❌ Dropdown: empty

AFTER:
  ✅ Backlog: 3+ tasks
  ✅ Dropdown: has options
  ✅ Everything works!
```

**How To:**
```
1. Go to: http://localhost:5173/app/sprint-planning
2. Refresh: Ctrl+Shift+R
3. Check: See tasks in backlog? ✅
4. Try: Assign task to sprint
5. Result: Works! 🎉
```

---

## Expected Result

### AFTER FIX ✅

```
┌─────────────────────────────────────────┐
│ Sprint Planning Page ✅                  │
├─────────────────────────────────────────┤
│                                         │
│ Sprints (left)          Sprint Details  │
│ ├─ Gap of              ├─ Sprint name   │
│ ├─ Kỳ ho               ├─ Dates         │
│ └─ [New Sprint]        ├─ Capacity      │
│   Click to select      ├─ 0 tasks       │
│                        └─ [Add Task] ✅  │
│                                         │
│ Backlog (bottom) ✅                     │
│ ├─ Task 1: Implement Dashboard          │
│ ├─ Task 2: Fix User Auth                │
│ └─ Task 3: Add Reports                  │
│                                         │
│ Can assign to sprint ✅                 │
│ Modal dropdown has options ✅           │
│                                         │
└─────────────────────────────────────────┘
```

---

## Common Issues & Fixes

### Issue 1: "sprints table does not exist"

```
❌ Error:    relation "sprints" does not exist
✅ Fix:     Run SPRINT_SCHEMA.sql
⏱️ Time:    1 minute
```

### Issue 2: "sprint_id column does not exist"

```
❌ Error:    column "sprint_id" does not exist
✅ Fix:     Run SPRINT_SCHEMA.sql
⏱️ Time:    1 minute
```

### Issue 3: "No tasks in backlog"

```
❌ Error:    Backlog shows 0 tasks
✅ Fix:     Create tasks in Task Assignment
⏱️ Time:    2 minutes
```

### Issue 4: "Modal dropdown still empty"

```
❌ Error:    No options in select
✅ Fix:     Refresh page (Ctrl+Shift+R)
⏱️ Time:    30 seconds
```

### Issue 5: "All tasks assigned to sprints"

```
❌ Error:    Can't find unassigned tasks
✅ Fix:     SQL: UPDATE tasks SET sprint_id = NULL;
⏱️ Time:    1 minute
```

---

## Quick Reference

### What Gets Created

```
SPRINT_SCHEMA.sql creates:

✅ sprints table
   ├─ id
   ├─ name
   ├─ start_date
   ├─ end_date
   ├─ capacity
   ├─ goal
   ├─ status
   └─ timestamps

✅ Adds to tasks table
   └─ sprint_id (FK)

✅ Creates indexes
   └─ For fast queries
```

### What You Provide

```
You create:

✅ Sprints (in Sprint Planning)
   └─ Click [New Sprint]

✅ Tasks (in Task Assignment)
   └─ Click [New Task]

✅ Assignments (in Sprint Planning)
   └─ Click [Add Task]
```

---

## Testing Checklist

- [ ] SPRINT_SCHEMA.sql executed
- [ ] Supabase Table Editor shows `sprints` table
- [ ] Supabase Table Editor shows `sprint_id` in tasks
- [ ] Created 3+ test tasks
- [ ] Sprint Planning page has backlog tasks
- [ ] Can open "Add Task" modal
- [ ] Modal dropdown has task options
- [ ] Can assign task to sprint
- [ ] Task moves to sprint
- [ ] Capacity updates

**All checked?** → ✅ You're done!

---

## Success Indicators

You'll know it's working when:

```
✅ Sprint Planning page loads
✅ Sprints visible in list
✅ Backlog shows tasks
✅ Modal dropdown has options
✅ Can assign tasks
✅ Capacity calculates
✅ Can delete tasks
✅ Can remove tasks from sprint
```

---

## Getting Help

If stuck:

1. **Check:** Have you run SPRINT_SCHEMA.sql? (Most likely forgotten)
2. **Verify:** Does `sprints` table exist in Supabase?
3. **Create:** Do you have any tasks? Create some first!
4. **Refresh:** Browser cache? Ctrl+Shift+R to clear
5. **Console:** F12 → Console for error messages

---

## Time Estimate

- [ ] Step 1 (Database): 1 min
- [ ] Step 2 (Tasks): 2 min  
- [ ] Step 3 (Refresh): 30 sec
- [ ] Testing: 1 min

**Total: 5 minutes** ⏱️

---

**Ready? Start with Step 1️⃣!** 🚀

Find SPRINT_SCHEMA.sql in project root → Copy → Supabase SQL Editor → RUN → ✅ Done!
