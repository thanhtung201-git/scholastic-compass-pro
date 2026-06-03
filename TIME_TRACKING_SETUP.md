# Time Tracking - Complete Setup Guide

## Overview
The Time Tracking page is now fully functional with real-time timer, manual entry, filtering, and comprehensive statistics.

## ✅ Features Implemented

### 1. **Real-Time Timer**
- ✅ Start/stop timer with live countdown
- ✅ Only one active timer per user
- ✅ Auto-converts seconds to HH:MM:SS format
- ✅ Green notification banner for active timer
- ✅ Auto-refreshes UI while timer running

### 2. **Quick Timer Controls**
- ✅ Task dropdown selector
- ✅ One-click start timer
- ✅ One-click stop timer
- ✅ Task must be selected before starting

### 3. **Manual Time Entry**
- ✅ Add past time logs manually
- ✅ Select task, start time, end time, description
- ✅ Datetime picker UI
- ✅ Optional description field
- ✅ Auto-calculates duration

### 4. **Time Log Filtering**
- ✅ Today - shows only today's logs
- ✅ This Week - shows last 7 days
- ✅ All Time - shows all logs
- ✅ Filter updates stats automatically

### 5. **Statistics Dashboard**
- ✅ Today's total hours
- ✅ Period total (filtered by date range)
- ✅ Task count in period
- ✅ Real-time updates

### 6. **Time Logs Table**
- ✅ Full details: Task, Date, Start, End, Duration
- ✅ Duration auto-calculated (HH:MM format)
- ✅ Description column
- ✅ Delete action per log
- ✅ Hover effects for better UX
- ✅ Responsive table layout

### 7. **Responsive Design**
- ✅ Works on desktop, tablet, mobile
- ✅ Scrollable table on small screens
- ✅ Grid layout adapts
- ✅ Touch-friendly buttons

## Data Structure

### task_time_logs Table
Already created in PROJECT_MANAGEMENT_SCHEMA.sql:

```sql
CREATE TABLE "task_time_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES "tasks"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Key Fields:**
- `task_id` - Which task was being worked on
- `user_id` - Who tracked the time
- `start_time` - When they started
- `end_time` - When they stopped (NULL = running)
- `duration_minutes` - Calculated duration
- `description` - Optional work notes

## Setup Instructions

### Step 1: Verify Database Schema
The schema is already in PROJECT_MANAGEMENT_SCHEMA.sql. Ensure it was applied:

1. Go to Supabase Dashboard → Table Editor
2. Look for `task_time_logs` table
3. Verify these columns exist:
   - id (UUID)
   - task_id (UUID, FK)
   - user_id (UUID, FK)
   - start_time (TIMESTAMP)
   - end_time (TIMESTAMP, nullable)
   - duration_minutes (INTEGER)
   - description (TEXT)

### Step 2: Ensure Tasks Have Assignments
For the time tracking to work, you need tasks assigned to users:

```sql
-- Check assigned tasks
SELECT id, title, assigned_to FROM tasks WHERE assigned_to IS NOT NULL LIMIT 10;

-- If no assigned tasks, assign some:
UPDATE tasks SET assigned_to = 'USER_UUID_HERE' WHERE id = 'TASK_UUID_HERE';
```

### Step 3: Test in Application

1. **Navigate to Page:**
   - `http://localhost:5173/app/time-tracking`

2. **Create Time Log (Manual):**
   - Click "Manual Entry"
   - Select a task
   - Set start time (e.g., today 9:00 AM)
   - Set end time (e.g., today 10:30 AM)
   - Add optional description
   - Click "Add Time Log"
   - Should appear in table below

3. **Start Timer:**
   - Select a task from dropdown
   - Click "Start Timer"
   - Timer should appear at top in green banner
   - Shows live countdown (HH:MM:SS)
   - Can stop anytime by clicking "Stop Timer"

4. **View Statistics:**
   - "Today" button shows hours today
   - "This Week" button shows week total
   - "All Time" button shows all-time hours
   - Stats auto-update when filtering

5. **Filter Time Logs:**
   - Click "Today" - see only today's logs
   - Click "This Week" - see week's logs
   - Click "All Time" - see all logs

6. **Delete Logs:**
   - Click trash icon on any log
   - Confirm deletion

## Usage Patterns

### Daily Workflow
1. **Start of work:**
   - Select task from dropdown
   - Click "Start Timer"
   - Green banner shows running time

2. **Switch tasks:**
   - Automatic: clicking "Start Timer" on new task stops the old one
   - Manual: click "Stop Timer" then select new task

3. **End of day:**
   - Review "Today" stats
   - Verify all time is logged
   - Add manual entries if needed

### Reporting
```sql
-- Get user's hours this week
SELECT 
  u.name,
  COUNT(*) as log_count,
  SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))/3600) as total_hours,
  AVG(EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))/60) as avg_duration_minutes
FROM task_time_logs tl
JOIN users u ON tl.user_id = u.id
WHERE tl.start_time >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.name
ORDER BY total_hours DESC;
```

## Troubleshooting

### Issue: "No tasks assigned"
**Cause:** User has no assigned tasks
**Solution:**
```sql
-- Assign tasks to user
UPDATE tasks SET assigned_to = 'YOUR_USER_ID' WHERE project_id = 'PROJECT_ID';
```

### Issue: Timer won't start
**Cause:** No task selected or already a timer running
**Solution:**
- Select a task first
- Check if timer is already running (green banner)

### Issue: Times showing incorrectly
**Cause:** Timezone issues
**Solution:**
- Datetime inputs use browser timezone
- Supabase stores in UTC
- Times auto-convert on display

### Issue: Duration showing 0m
**Cause:** End time very close to start time
**Solution:**
- Create log with longer duration
- End time must be after start time

### Issue: Stats not updating
**Cause:** Page not refreshing data
**Solution:**
- Refresh browser page
- Check browser console for errors

## Performance Optimization

### Queries Optimized
- Indexes on `task_id` and `user_id` for fast lookups
- Single user filter reduces data load
- Order by `start_time DESC` for recent-first display

### Caching Strategy
- Logs fetched on page load
- Auto-refresh every 5 seconds if timer active
- Manual refresh button available

## Data Export

### Export as CSV
Query to get time data for export:

```sql
SELECT 
  t.title as task,
  to_char(tl.start_time, 'YYYY-MM-DD HH:MM') as start_time,
  to_char(tl.end_time, 'YYYY-MM-DD HH:MM') as end_time,
  EXTRACT(EPOCH FROM (tl.end_time - tl.start_time))/3600 as hours,
  tl.description
FROM task_time_logs tl
JOIN tasks t ON tl.task_id = t.id
WHERE tl.user_id = 'USER_UUID'
ORDER BY tl.start_time DESC;
```

## Advanced Features (Future)

Potential enhancements:
- [ ] Weekly burndown chart
- [ ] Estimate vs actual tracking
- [ ] Team time summary
- [ ] Export to CSV/PDF
- [ ] Time entry approval workflow
- [ ] Break time tracking
- [ ] Offline timer sync
- [ ] Mobile app integration

## Security

### Current Permissions
- Users can only see their own time logs
- Users can only track time on their assigned tasks
- Queries filtered by `user_id` from auth context

### Recommended RLS Policies
```sql
-- Users can only view their own time logs
CREATE POLICY "Users view own time logs"
  ON task_time_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create time logs for themselves
CREATE POLICY "Users create own time logs"
  ON task_time_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own time logs
CREATE POLICY "Users update own time logs"
  ON task_time_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Support

For issues:
1. Check task is assigned to user
2. Verify `task_time_logs` table exists
3. Check browser console for error messages
4. Verify user authentication is working
5. Test with simple 1-minute time log first

---

**Page URL:** `/app/time-tracking`
**Last Updated:** 2026-06-02
**Status:** ✅ Production Ready
