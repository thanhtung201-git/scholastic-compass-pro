# 🚀 Sprint Planning - IMMEDIATE ACTION PLAN

## Your Issue
Sprint Planning page shows sprints but:
- ❌ Backlog has 0 tasks
- ❌ Task dropdown is empty
- ❌ Can't assign tasks to sprints

---

## ✅ FIX IN 5 MINUTES

### Action 1️⃣: Execute SPRINT_SCHEMA.sql

**Time: 1 minute**

1. Open Supabase Dashboard: https://supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **+ New Query**
5. Open file: `SPRINT_SCHEMA.sql` (in project root)
6. Copy entire content
7. Paste into SQL Editor
8. Click **RUN**
9. ✅ Done when you see: "Sprint schema created successfully!"

**What this does:**
- Creates `sprints` table
- Adds `sprint_id` column to tasks
- Sets up indexes
- Ready to use

---

### Action 2️⃣: Create Sample Tasks (if needed)

**Time: 2 minutes**

1. Go to app: `http://localhost:5173`
2. Click **Project Management → Task Assignment**
3. Click **New Task** button
4. Fill form:
   ```
   Title: "Implement User Dashboard"
   Description: "Create dashboard page for users"
   Department: "Engineering"
   Assignee: "Your Name"
   Priority: "High"
   Due Date: "2026-06-30"
   ```
5. Click **Create Task**
6. Repeat 2-3 times with different task names
7. ✅ Done when tasks appear in table

---

### Action 3️⃣: Verify Sprint Planning Works

**Time: 2 minutes**

1. Go to: `http://localhost:5173/app/sprint-planning`
2. ✅ Check 1: See sprint list on left
3. ✅ Check 2: See backlog tasks at bottom
4. ✅ Check 3: Modal dropdown has task options

**If all 3 checks pass → You're done! ✅**

---

## 🔍 If Still Not Working

### Debug Step 1: Check Database

1. Open Supabase SQL Editor
2. Run command:
   ```sql
   SELECT COUNT(*) FROM sprints;
   SELECT COUNT(*) FROM tasks;
   SELECT COUNT(*) FROM tasks WHERE sprint_id IS NULL;
   ```
3. All should show `> 0`

**If error:** "relation does not exist"
→ Go back to **Action 1** and run SPRINT_SCHEMA.sql again

---

### Debug Step 2: Check Tasks Exist

1. Go to Task Assignment: `http://localhost:5173/app/task-assignment`
2. ✅ Should see tasks in table
3. If empty → Create tasks first (Action 2)

---

### Debug Step 3: Browser Console

1. Open: `http://localhost:5173/app/sprint-planning`
2. Press **F12** (Developer Tools)
3. Click **Console** tab
4. Look for red error messages
5. Common error: "sprints table does not exist" → Run SPRINT_SCHEMA.sql

---

## 📋 Quick Checklist

Before saying "it's broken", verify:

- [ ] SPRINT_SCHEMA.sql was executed (check Supabase Table Editor for `sprints` table)
- [ ] At least 1 sprint exists (run: `SELECT * FROM sprints LIMIT 1;`)
- [ ] At least 1 task exists (run: `SELECT * FROM tasks LIMIT 1;`)
- [ ] At least 1 task has `sprint_id IS NULL` (run: `SELECT * FROM tasks WHERE sprint_id IS NULL;`)
- [ ] Page was refreshed after changes (Ctrl+Shift+R)
- [ ] Browser cache cleared (or Ctrl+Shift+Delete)

---

## 🎯 Expected Final Result

When working correctly:

```
✅ Sprint Planning Page
│
├─ Sprints list (left panel)
│  └─ Multiple sprints visible
│
├─ Sprint details (center/right)
│  ├─ Sprint name, dates, capacity
│  ├─ Tasks in sprint: 0 initially
│  └─ [Add Task] button works
│
└─ Backlog section (bottom)
   ├─ Shows unassigned tasks
   ├─ Task cards with status/priority
   └─ Can click [Add Task] and select from dropdown
```

---

## 💡 Pro Tips

1. **Before debugging:** Refresh page (Ctrl+Shift+R)

2. **Database check:** Always run SPRINT_SCHEMA.sql if unsure

3. **Test data:** Can use SQL to add test data quickly:
   ```sql
   INSERT INTO tasks (title, status, priority)
   VALUES ('Test Task', 'Todo', 'Medium');
   ```

4. **Multiple sprints:** Create at least 2-3 sprints for better testing

5. **Save time:** After first fix, bookmark: 
   - Supabase SQL Editor
   - Sprint Planning page
   - Task Assignment page

---

## 📞 Getting Support

If still failing after all steps:

**Collect this info:**
1. Screenshots of:
   - Sprint Planning page (what you see)
   - Supabase SQL Editor (run: `SELECT * FROM sprints;`)
   - Browser console (F12 → Console tab)

2. Outputs from SQL:
   ```sql
   SELECT COUNT(*) FROM sprints;
   SELECT COUNT(*) FROM tasks;
   SELECT COUNT(*) FROM tasks WHERE sprint_id IS NULL;
   ```

3. Let me know which step failed

---

## ✨ After It Works

1. ✅ Create more sprints
2. ✅ Create more tasks
3. ✅ Assign tasks to sprints
4. ✅ Track capacity usage
5. ✅ Monitor sprint progress

---

**Start with Action 1️⃣ now!** 🚀

It should take ~5 minutes total.
