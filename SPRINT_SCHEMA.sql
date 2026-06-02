-- ============================================
-- MCNAEdu CRM - Sprint Management Schema
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
-- 1. CREATE SPRINTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "sprints" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal TEXT,
  capacity DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Planning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sprints_name_check CHECK (length(trim(name)) > 0),
  CONSTRAINT sprints_status_check CHECK (status IN ('Planning', 'Active', 'Completed', 'Cancelled')),
  CONSTRAINT sprints_capacity_check CHECK (capacity >= 0),
  CONSTRAINT sprints_date_check CHECK (end_date >= start_date)
);

-- ============================================
-- 2. ADD SPRINT COLUMN TO TASKS TABLE
-- ============================================
-- Add sprint_id to tasks table if it doesn't exist
ALTER TABLE "tasks"
ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES "sprints"(id) ON DELETE SET NULL;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sprints_status ON "sprints"(status);
CREATE INDEX IF NOT EXISTS idx_sprints_start_date ON "sprints"(start_date);
CREATE INDEX IF NOT EXISTS idx_sprints_end_date ON "sprints"(end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON "tasks"(sprint_id);

-- ============================================
-- DISABLE ROW LEVEL SECURITY (Development)
-- ============================================
ALTER TABLE IF EXISTS "sprints" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- INSERT SAMPLE DATA (Optional)
-- ============================================
-- Insert sample sprints
INSERT INTO "sprints" (name, description, start_date, end_date, goal, capacity, status) 
VALUES 
  ('Sprint 1 - Jun 2026', 'First sprint of Q2', '2026-06-01'::date, '2026-06-14'::date, 'Setup core infrastructure and user management', 160, 'Active'),
  ('Sprint 2 - Jun 2026', 'Second sprint of Q2', '2026-06-15'::date, '2026-06-28'::date, 'Implement project management features', 160, 'Planning'),
  ('Sprint 3 - Jul 2026', 'Third sprint of Q2', '2026-07-01'::date, '2026-07-14'::date, 'Complete task assignment and kanban board', 160, 'Planning')
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
SELECT 'Sprint schema created successfully!' as status;

-- Count sprints
SELECT COUNT(*) as sprint_count FROM "sprints";

-- List all sprints
SELECT id, name, start_date, end_date, capacity, status FROM "sprints" ORDER BY start_date;

COMMIT;

-- ============================================
-- SUCCESS! ✅
-- ============================================
-- 
-- Nếu không có lỗi, bạn sẽ thấy:
-- • Bảng sprints được tạo
-- • Cột sprint_id được thêm vào bảng tasks
-- • 3 sample sprints được insert
--
-- Bây giờ vào ứng dụng:
-- • http://localhost:8081/app/sprint-planning
-- • Sẽ thấy danh sách sprints và backlog
--
-- ============================================
