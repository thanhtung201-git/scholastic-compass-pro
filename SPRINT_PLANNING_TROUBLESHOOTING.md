# Sprint Planning - Complete Troubleshooting Guide

## Problem: Sprint Planning Shows Nothing / No Tasks in Backlog

Your screenshot shows:
- ✅ Sprints exist ("Gap of", "Kỳ ho")
- ❌ Backlog shows 0 tasks
- ❌ Modal dropdown is empty

---

## Root Causes & Solutions

### Cause 1: SPRINT_SCHEMA.sql Not Executed ⚠️

**Check:** Does `sprints` table exist?

```bash
# In Supabase SQL Editor, run:
SELECT COUNT(*) FROM sprints;
```

**If error:** "relation sprints does not exist"

**Fix:**
1. Go to **Supabase Dashboard**
2. Click **SQL Editor**
3. Click **+ New Query**
4. Copy entire content from `SPRINT_SCHEMA.sql` file
5. Paste into editor
6. Click **RUN**
7. Wait for success message

---

### Cause 2: sprint_id Column Missing from tasks ⚠️

**Check:** Does `sprint_id` column exist?

```bash
# In Supabase SQL Editor, run:
SELECT sprint_id FROM tasks LIMIT 1;
```

**If error:** "column sprint_id does not exist"

**Fix:**
1. Run SPRINT_SCHEMA.sql (see Cause 1 above)
2. Or manually add column:

```sql
ALTER TABLE "tasks"
ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES "sprints"(id) ON DELETE SET NULL;
```

---

### Cause 3: No Tasks in Database ⚠️

**Check:** Do tasks exist?

```bash
# In Supabase SQL Editor, run:
SELECT COUNT(*) FROM tasks;
```

**If result is 0:**

**Fix:** Create tasks first!

1. Go to **Task Assignment** page
2. Click **New Task**
3. Fill form:
   - Title (required)
   - Description (optional)
   - Department (required)
   - Assignee (required)
   - Priority (required)
   - Due Date (optional)
4. Click **Create Task**
5. Repeat for multiple tasks
6. Return to Sprint Planning and refresh

---

### Cause 4: All Tasks Already Assigned to Sprints ⚠️

**Check:** How many unassigned tasks?

```bash
# In Supabase SQL Editor, run:
SELECT COUNT(*) FROM tasks WHERE sprint_id IS NULL;
```

**If result is 0:**

**Fix:** Unassign tasks from sprints:

```sql
-- Unassign all tasks (if testing)
UPDATE tasks SET sprint_id = NULL;

-- Or unassign specific tasks
UPDATE tasks SET sprint_id = NULL 
WHERE sprint_id IS NOT NULL 
LIMIT 5;
```

---

## Step-by-Step Verification Checklist

### ✅ Step 1: Database Tables Exist

Go to **Supabase → Table Editor** and verify:

- [ ] `sprints` table visible
- [ ] `tasks` table visible
- [ ] `sprints` has: id, name, start_date, end_date, capacity, status columns
- [ ] `tasks` has: id, title, sprint_id column

### ✅ Step 2: Data Exists

In **Supabase → SQL Editor**, run:

```sql
-- Should return at least 1 row
SELECT COUNT(*) as sprint_count FROM sprints;

-- Should return at least 1 row
SELECT COUNT(*) as task_count FROM tasks;

-- Should return tasks without sprint_id
SELECT COUNT(*) as backlog_count FROM tasks WHERE sprint_id IS NULL;
```

All three should return **> 0**

### ✅ Step 3: Refresh Application

- [ ] Close browser tab with Sprint Planning
- [ ] Open new tab
- [ ] Go to `http://localhost:5173/app/sprint-planning`
- [ ] Should show sprints list
- [ ] Should show backlog tasks

### ✅ Step 4: Create Test Data (if needed)

```sql
-- Add test sprint
INSERT INTO sprints (name, start_date, end_date, capacity, status)
VALUES ('Test Sprint', '2026-06-01'::date, '2026-06-14'::date, 160, 'Planning');

-- Add test task
INSERT INTO tasks (title, description, status, priority, assigned_to, estimated_hours)
VALUES ('Test Task', 'Test description', 'Todo', 'Medium', 'UUID_HERE', 5);
```

---

## Quick Test Workflow

1. **Open Supabase SQL Editor**

2. **Run these commands:**

```sql
-- Check table exists
\dt sprints

-- Count sprints
SELECT COUNT(*) FROM sprints;

-- Count tasks
SELECT COUNT(*) FROM tasks;

-- Count unassigned tasks
SELECT COUNT(*) FROM tasks WHERE sprint_id IS NULL;

-- Show unassigned tasks
SELECT id, title, priority FROM tasks WHERE sprint_id IS NULL LIMIT 10;
```

3. **If all queries work:**
   - Refresh Sprint Planning page
   - Should see data now!

4. **If any query fails:**
   - Run SPRINT_SCHEMA.sql first
   - Then retry

---

## Browser Console Debugging

1. **Open Browser Dev Tools** - Press `F12`

2. **Go to Console tab**

3. **Look for error messages** - Will show SQL errors

4. **Common errors:**
   - `relation "sprints" does not exist` → Run SPRINT_SCHEMA.sql
   - `column "sprint_id" does not exist` → Run SPRINT_SCHEMA.sql
   - `No tasks assigned` → Create tasks in Task Assignment

---

## Expected vs Actual

### ✅ Expected (Working)

```
Sprint Planning Page
├─ Sprints List (left)
│  ├─ Sprint 1
│  ├─ Sprint 2
│  └─ [New Sprint button]
│
├─ Sprint Details (center/right)
│  ├─ Selected sprint info
│  ├─ Tasks in sprint (0 initially)
│  └─ [Add Task button]
│
└─ Backlog (bottom)
   ├─ Task 1
   ├─ Task 2
   └─ Task 3 (unassigned tasks)
```

### ❌ Actual (Broken - Your Issue)

```
Sprint Planning Page
├─ Sprints List (left)
│  ├─ Sprint 1
│  ├─ Sprint 2
│  └─ [New Sprint button]
│
├─ Sprint Details (center/right)
│  ├─ Selected sprint info
│  ├─ Tasks in sprint (0)
│  └─ [Add Task button - but disabled/no options]
│
└─ Backlog (bottom)
   └─ "0 tasks - All tasks assigned to sprints!" ❌
```

---

## Recovery Steps

### If Nothing Works

1. **Check database connection:**
   ```sql
   SELECT NOW();  -- Should show current timestamp
   ```

2. **Check table structure:**
   ```sql
   \d sprints
   \d tasks
   ```

3. **Verify foreign key:**
   ```sql
   SELECT * FROM information_schema.key_column_usage 
   WHERE table_name = 'tasks' AND column_name = 'sprint_id';
   ```

4. **If still failing:**
   - Go back to `SPRINT_SCHEMA.sql`
   - Delete entire content and re-run fresh

---

## Data Migration (if needed)

If sprints table exists but sprint_id is missing:

```sql
-- Add the column
ALTER TABLE "tasks"
ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES "sprints"(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON "tasks"(sprint_id);

-- Verify
SELECT * FROM tasks LIMIT 1;  -- Should show sprint_id column
```

---

## Testing After Fix

1. **Refresh page** - `Ctrl+Shift+R`

2. **Expected to see:**
   - [ ] Sprints list populated
   - [ ] At least one backlog task
   - [ ] Modal dropdown has task options
   - [ ] Can assign task to sprint

3. **Try complete workflow:**
   - [ ] Click sprint in list
   - [ ] Click "Add Task"
   - [ ] Select task from dropdown
   - [ ] Click "Add to Sprint"
   - [ ] Task moves from backlog to sprint
   - [ ] Capacity updates

---

## Getting Help

If still not working, provide:

1. Output from:
   ```sql
   SELECT COUNT(*) FROM sprints;
   SELECT COUNT(*) FROM tasks;
   SELECT COUNT(*) FROM tasks WHERE sprint_id IS NULL;
   ```

2. Screenshot of error message (if any)

3. Browser console errors (F12)

4. Supabase table structure (check in Table Editor)

---

## Prevention

After getting it working:

- ✅ Save SPRINT_SCHEMA.sql in safe location
- ✅ Document which SQL commands were run
- ✅ Keep sample data for testing
- ✅ Backup database regularly

---

**Last Updated:** 2026-06-02
**Status:** Troubleshooting Complete
