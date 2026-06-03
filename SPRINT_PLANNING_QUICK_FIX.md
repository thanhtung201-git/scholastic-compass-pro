# Sprint Planning - Quick Fix Guide

## ❌ Issue: Sprint Planning shows no tasks

### Root Cause
The `sprints` table might not be created, or the `sprint_id` column might not exist in the `tasks` table.

---

## ✅ Step-by-Step Fix

### Step 1: Run SPRINT_SCHEMA.sql

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "+ New Query"

3. **Copy and Paste**
   - Copy the entire content from: `SPRINT_SCHEMA.sql`
   - Paste into the SQL Editor

4. **Execute**
   - Click "RUN" button
   - Wait for success message

5. **Verify in Table Editor**
   - Go to "Table Editor"
   - Look for `sprints` table ✓
   - Look for `sprint_id` column in `tasks` table ✓

---

### Step 2: Verify Database Setup

```sql
-- Check if sprints table exists
SELECT * FROM sprints LIMIT 5;

-- Check if sprint_id exists in tasks
SELECT column_name FROM information_schema.columns 
WHERE table_name='tasks' AND column_name='sprint_id';
```

If both queries work, database is ready!

---

### Step 3: Create Sample Data (if needed)

If you want to test with sample data:

```sql
-- Create a sprint
INSERT INTO sprints (name, description, start_date, end_date, goal, capacity, status)
VALUES 
  ('Sprint 1 - Test', 'Test sprint', '2026-06-01', '2026-06-14', 'Test goal', 160, 'Planning');

-- Assign a task to the sprint (optional)
UPDATE tasks 
SET sprint_id = (SELECT id FROM sprints LIMIT 1)
WHERE id = 'TASK_UUID_HERE';
```

---

### Step 4: Create Tasks (if none exist)

Go to **Task Assignment** page and create some tasks:
- Click "New Task"
- Fill in title, description, priority, due date
- Task will be created without a sprint (in backlog)

---

### Step 5: Go to Sprint Planning

Visit: `http://localhost:5173/app/sprint-planning`

You should now see:
- ✅ List of sprints on the left
- ✅ Backlog with unassigned tasks at the bottom
- ✅ Ability to assign tasks to sprints

---

## 🔍 Troubleshooting

### Error: "sprints table does not exist"
**Solution:** Run SPRINT_SCHEMA.sql in Supabase SQL Editor

### Error: "column sprint_id does not exist"  
**Solution:** Run SPRINT_SCHEMA.sql - it adds the column

### Backlog shows 0 tasks
**Solution:** 
- Create tasks in Task Assignment page first
- OR check if all tasks already have sprint_id assigned
- Check with: `SELECT COUNT(*) FROM tasks WHERE sprint_id IS NULL;`

### Modal dropdown empty when adding tasks
**Solution:**
- Create more tasks first
- OR make sure tasks have `sprint_id = NULL`

### Still not working?
**Debug steps:**
1. Open browser console (F12)
2. Check for error messages
3. Go to Supabase Table Editor
4. Verify `sprints` table has data
5. Verify `tasks` table has `sprint_id` column
6. Refresh page (Ctrl+Shift+R)

---

## 📋 Checklist

- [ ] SPRINT_SCHEMA.sql executed in Supabase
- [ ] `sprints` table visible in Table Editor
- [ ] `sprint_id` column exists in `tasks` table  
- [ ] At least one sprint created
- [ ] At least one task created in Task Assignment
- [ ] Tasks show in backlog (sprint_id IS NULL)
- [ ] Can assign tasks to sprint

---

## 🎯 Expected Workflow After Fix

1. **Visit Sprint Planning** → See sprints list ✓
2. **Click sprint** → See sprint details ✓
3. **Click "Add Task"** → Modal opens ✓
4. **Select task** → Dropdown has options ✓
5. **Click "Add to Sprint"** → Task moves from backlog to sprint ✓
6. **View stats** → Capacity updates ✓

---

## 📝 If You Still Have Issues

Check these SQL queries in Supabase SQL Editor:

```sql
-- Check sprints exist
SELECT * FROM sprints;

-- Check tasks exist
SELECT id, title, sprint_id FROM tasks LIMIT 10;

-- Check unassigned tasks (for backlog)
SELECT COUNT(*) as unassigned_tasks FROM tasks WHERE sprint_id IS NULL;

-- Check assigned tasks
SELECT COUNT(*) as assigned_tasks FROM tasks WHERE sprint_id IS NOT NULL;
```

All should return results without errors.

---

**Quick Start:** Run SPRINT_SCHEMA.sql → Create tasks → Visit Sprint Planning ✅
