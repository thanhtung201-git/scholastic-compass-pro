# Sprint Planning Setup Guide

## Overview
The Sprint Planning page is now fully functional with complete sprint and backlog management capabilities.

## Features Included

### 1. **Sprint Management**
- ✅ Create new sprints with name, description, dates, goals, and capacity
- ✅ View all sprints with date ranges and task counts
- ✅ Delete sprints (tasks will be unassigned)
- ✅ Select sprint to view details
- ✅ Sprint status tracking (Planning, Active, Completed, Cancelled)

### 2. **Sprint Dashboard**
For each selected sprint, view:
- Sprint overview with goals and description
- Duration (start date to end date)
- Team capacity (in hours)
- Used capacity (sum of estimated hours on assigned tasks)
- Remaining capacity (with color coding: green for available, red for over-capacity)

### 3. **Task Assignment**
- ✅ Assign tasks from backlog to sprints
- ✅ View all tasks in a sprint
- ✅ Remove tasks from sprint
- ✅ Auto-calculate capacity usage based on estimated_hours

### 4. **Backlog Management**
- ✅ View all unassigned tasks
- ✅ Display task details (status, priority, estimated hours)
- ✅ Quick view of task cards with key information

## Setup Instructions

### Step 1: Create Sprints Table in Supabase

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the entire content of `SPRINT_SCHEMA.sql`
4. Paste into SQL Editor
5. Click RUN
6. Verify the output shows "Sprint schema created successfully!"

**What gets created:**
- `sprints` table with all necessary fields
- `sprint_id` column added to `tasks` table
- Indexes for performance
- 3 sample sprints (optional)

### Step 2: Verify in Database

After running the schema:
1. Go to Table Editor in Supabase
2. Verify `sprints` table exists with these columns:
   - id (UUID)
   - name (VARCHAR)
   - description (TEXT)
   - start_date (DATE)
   - end_date (DATE)
   - goal (TEXT)
   - capacity (DECIMAL)
   - status (VARCHAR)
   - created_at, updated_at

3. Verify `tasks` table now has `sprint_id` column

### Step 3: Update Tasks with Estimated Hours

For full functionality, ensure your tasks have `estimated_hours` values:

```sql
-- Example: Set estimated hours for tasks without them
UPDATE tasks 
SET estimated_hours = 5 
WHERE estimated_hours IS NULL;
```

### Step 4: Test in Application

1. Start the development server: `npm run dev`
2. Navigate to: `http://localhost:5173/app/sprint-planning`
3. Test the following:

**Create Sprint:**
- Click "New Sprint"
- Fill in Sprint Name (e.g., "Sprint 1")
- Set Start Date and End Date
- Enter Team Capacity (e.g., 160 for 2 weeks, 40 hours/week)
- Add Sprint Goal
- Click "Create Sprint"

**View Sprint Details:**
- Click on a sprint from the list
- View capacity metrics
- See assigned tasks

**Assign Tasks:**
- Click "Add Task" on a sprint
- Select a task from backlog
- Task should appear in sprint's task list
- Capacity metrics update automatically

**Remove Tasks:**
- Click trash icon on task in sprint to unassign
- Task returns to backlog

**View Backlog:**
- Scroll to bottom
- See all unassigned tasks
- Task cards show status, priority, and estimated hours

## Data Structure

### Sprints Table
```
sprints (
  id: UUID,
  name: VARCHAR(255),
  description: TEXT,
  start_date: DATE,
  end_date: DATE,
  goal: TEXT,
  capacity: DECIMAL,
  status: VARCHAR,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### Tasks Enhanced
```
tasks (
  ...existing fields...,
  sprint_id: UUID (references sprints)
)
```

## Key Formulas

### Capacity Used
```
SUM(estimated_hours) for all tasks WHERE sprint_id = sprint.id
```

### Remaining Capacity
```
sprint.capacity - capacity_used
```

### Color Coding
- Green: `remaining_capacity >= 0` (under capacity)
- Red: `remaining_capacity < 0` (over capacity)

## Troubleshooting

### Issue: "No sprints created yet"
- **Solution**: Click "New Sprint" button to create your first sprint

### Issue: Tasks not showing in backlog
- **Solution**: Ensure tasks have `estimated_hours > 0` and `sprint_id IS NULL`

### Issue: Capacity showing as 0
- **Solution**: Ensure you set capacity when creating sprint, or update existing sprint

### Issue: Over-capacity warning not showing
- **Solution**: Ensure tasks assigned to sprint have `estimated_hours` values set

## Advanced Usage

### Bulk Import Sprints
If you have many sprints, use this SQL:

```sql
INSERT INTO sprints (name, description, start_date, end_date, goal, capacity, status)
VALUES
  ('Sprint 1', 'Q2 Sprint 1', '2026-06-01', '2026-06-14', 'Core features', 160, 'Planning'),
  ('Sprint 2', 'Q2 Sprint 2', '2026-06-15', '2026-06-28', 'Advanced features', 160, 'Planning'),
  ('Sprint 3', 'Q2 Sprint 3', '2026-07-01', '2026-07-14', 'Testing & polish', 160, 'Planning');
```

### Export Sprint Report
Query to get sprint summary:

```sql
SELECT 
  s.name,
  COUNT(t.id) as task_count,
  SUM(t.estimated_hours) as total_hours,
  (s.capacity - SUM(t.estimated_hours)) as remaining_capacity,
  s.status
FROM sprints s
LEFT JOIN tasks t ON t.sprint_id = s.id
GROUP BY s.id
ORDER BY s.start_date;
```

## Future Enhancements

Potential features to add:
- [ ] Drag-drop tasks between sprints
- [ ] Sprint completion with velocity tracking
- [ ] Burndown chart visualization
- [ ] Team member workload distribution
- [ ] Sprint reports and metrics
- [ ] Historical velocity tracking
- [ ] Risk assessment tools

## Support

For issues or questions:
1. Check SPRINT_SCHEMA.sql was successfully applied
2. Verify tasks have sprint_id column
3. Ensure estimated_hours are set on tasks
4. Check browser console for error messages

---

**Created**: 2026-06-01
**Updated**: 2026-06-01
