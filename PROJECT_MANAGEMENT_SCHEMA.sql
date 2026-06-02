-- ============================================
-- MCNAEdu CRM - Project Management Module
-- ============================================
-- 
-- HƯỚNG DẪN:
-- 1. Mở Supabase Dashboard → SQL Editor
-- 2. Copy toàn bộ code dưới đây
-- 3. Paste vào SQL Editor
-- 4. Click RUN
-- ============================================

BEGIN TRANSACTION;

-- ============================================
-- 1. CREATE PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "projects" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES "users"(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'Planning',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT projects_code_check CHECK (length(trim(code)) > 0),
  CONSTRAINT projects_name_check CHECK (length(trim(name)) > 0),
  CONSTRAINT projects_status_check CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled')),
  CONSTRAINT projects_progress_check CHECK (progress >= 0 AND progress <= 100)
);

-- ============================================
-- 2. MODIFY TASKS TABLE
-- ============================================
-- Add new columns to the existing tasks table
ALTER TABLE "tasks" 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES "projects"(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Temporarily drop the constraint if it exists to update priority check
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS tasks_priority_check;

-- Add updated priority check
ALTER TABLE "tasks" 
ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'));

-- Also add a column if we want Review status in kanban
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE "tasks" 
ADD CONSTRAINT tasks_status_check CHECK (status IN ('Todo', 'In Progress', 'Review', 'Done'));

-- ============================================
-- 3. CREATE TASK COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "task_comments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES "tasks"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES "task_comments"(id) ON DELETE CASCADE, -- For replies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. CREATE TASK ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "task_attachments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES "tasks"(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  uploaded_by UUID REFERENCES "users"(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. CREATE TASK TIME LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "task_time_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES "tasks"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- calculated upon stop
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_status ON "projects"(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON "tasks"(project_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON "task_comments"(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON "task_attachments"(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_id ON "task_time_logs"(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user_id ON "task_time_logs"(user_id);

-- ============================================
-- DISABLE ROW LEVEL SECURITY (Development)
-- ============================================
ALTER TABLE IF EXISTS "projects" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "task_comments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "task_attachments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "task_time_logs" DISABLE ROW LEVEL SECURITY;

COMMIT;
