-- ============================================
-- MCNAEdu CRM - Marketing Module
-- Supabase SQL Commands - Copy & Paste Ready
-- ============================================
-- 
-- HƯỚNG DẪN:
-- 1. Mở Supabase Dashboard → SQL Editor
-- 2. Copy toàn bộ code dưới đây
-- 3. Paste vào SQL Editor
-- 4. Click RUN
-- 5. Chờ hoàn tất
--
-- ============================================

BEGIN TRANSACTION;

-- ============================================
-- 1. CREATE MARKETING SOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "marketing_sources" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT marketing_sources_name_check CHECK (length(trim(name)) > 0)
);

-- ============================================
-- 2. CREATE MARKETING LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "marketing_leads" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  source_id UUID REFERENCES "marketing_sources"(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'New',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT marketing_leads_full_name_check CHECK (length(trim(full_name)) > 0),
  CONSTRAINT marketing_leads_status_check CHECK (status IN ('New', 'Contacted', 'Trial Scheduled', 'Enrolled', 'Lost'))
);

-- ============================================
-- 3. CREATE MARKETING CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "marketing_campaigns" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(100) NOT NULL,
  description TEXT,
  budget DECIMAL(15, 2) DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'Planning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT marketing_campaigns_name_check CHECK (length(trim(name)) > 0),
  CONSTRAINT marketing_campaigns_channel_check CHECK (channel IN ('Facebook Ads', 'TikTok Ads', 'Google Ads', 'Workshop', 'Offline Event', 'Email', 'SMS', 'Other')),
  CONSTRAINT marketing_campaigns_status_check CHECK (status IN ('Planning', 'Running', 'Paused', 'Completed', 'Cancelled')),
  CONSTRAINT marketing_campaigns_budget_check CHECK (budget >= 0),
  CONSTRAINT marketing_campaigns_date_check CHECK (end_date IS NULL OR end_date >= start_date)
);

-- ============================================
-- 4. CREATE MARKETING FOLLOW-UPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "marketing_follow_ups" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES "marketing_leads"(id) ON DELETE CASCADE,
  assigned_staff_id UUID,
  followup_type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  note TEXT,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  priority VARCHAR(50) DEFAULT 'Medium',
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT marketing_follow_ups_followup_type_check CHECK (followup_type IN ('Call', 'Email', 'Meeting', 'Trial Class', 'Consultation', 'Task')),
  CONSTRAINT marketing_follow_ups_priority_check CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  CONSTRAINT marketing_follow_ups_status_check CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled'))
);

-- ============================================
-- 5. CREATE MARKETING PROMOTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "marketing_promotions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(50) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount_value DECIMAL(15, 2),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'Scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT marketing_promotions_code_check CHECK (length(trim(code)) > 0),
  CONSTRAINT marketing_promotions_name_check CHECK (length(trim(name)) > 0),
  CONSTRAINT marketing_promotions_discount_type_check CHECK (discount_type IN ('Percentage', 'Fixed Amount')),
  CONSTRAINT marketing_promotions_discount_value_check CHECK (discount_value > 0),
  CONSTRAINT marketing_promotions_status_check CHECK (status IN ('Active', 'Inactive', 'Expired', 'Scheduled')),
  CONSTRAINT marketing_promotions_date_check CHECK (end_date >= start_date)
);

-- ============================================
-- 6. CREATE MARKETING LEAD ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "marketing_lead_activities" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES "marketing_leads"(id) ON DELETE CASCADE,
  activity_type VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_marketing_leads_source_id ON "marketing_leads"(source_id);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_status ON "marketing_leads"(status);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_created_at ON "marketing_leads"(created_at);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON "marketing_campaigns"(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_channel ON "marketing_campaigns"(channel);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_at ON "marketing_campaigns"(created_at);

CREATE INDEX IF NOT EXISTS idx_marketing_follow_ups_lead_id ON "marketing_follow_ups"(lead_id);
CREATE INDEX IF NOT EXISTS idx_marketing_follow_ups_status ON "marketing_follow_ups"(status);
CREATE INDEX IF NOT EXISTS idx_marketing_follow_ups_deadline ON "marketing_follow_ups"(deadline);
CREATE INDEX IF NOT EXISTS idx_marketing_follow_ups_priority ON "marketing_follow_ups"(priority);

CREATE INDEX IF NOT EXISTS idx_marketing_promotions_code ON "marketing_promotions"(code);
CREATE INDEX IF NOT EXISTS idx_marketing_promotions_status ON "marketing_promotions"(status);
CREATE INDEX IF NOT EXISTS idx_marketing_promotions_start_date ON "marketing_promotions"(start_date);
CREATE INDEX IF NOT EXISTS idx_marketing_promotions_end_date ON "marketing_promotions"(end_date);

CREATE INDEX IF NOT EXISTS idx_marketing_lead_activities_lead_id ON "marketing_lead_activities"(lead_id);
CREATE INDEX IF NOT EXISTS idx_marketing_lead_activities_created_at ON "marketing_lead_activities"(created_at);

-- ============================================
-- DISABLE ROW LEVEL SECURITY (Development)
-- ============================================
ALTER TABLE IF EXISTS "marketing_sources" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "marketing_leads" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "marketing_campaigns" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "marketing_follow_ups" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "marketing_promotions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "marketing_lead_activities" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert Marketing Sources
INSERT INTO "marketing_sources" (name, description, is_active) 
VALUES 
  ('Facebook Ads', 'Leads from Facebook advertising campaigns', true),
  ('TikTok Ads', 'Leads from TikTok advertising campaigns', true),
  ('Google Ads', 'Leads from Google search and display ads', true),
  ('Instagram', 'Leads from Instagram organic and paid content', true),
  ('Website', 'Direct leads from website inquiry form', true),
  ('Referral', 'Leads from student/teacher referrals', true),
  ('Workshop Event', 'Leads from live workshop events', true),
  ('Phone Call', 'Direct phone inquiries', true),
  ('Email', 'Email inquiries and campaigns', true),
  ('Other', 'Other sources', true)
ON CONFLICT (name) DO NOTHING;

-- Insert Marketing Campaigns
INSERT INTO "marketing_campaigns" (name, channel, description, budget, start_date, end_date, status) 
VALUES
  ('Summer IELTS Intensive 2026', 'Facebook Ads', 'Campaign to promote summer IELTS intensive courses', 5000000, '2026-04-01'::timestamp, '2026-05-31'::timestamp, 'Running'),
  ('TOEIC Bootcamp Launch', 'Google Ads', 'Launch campaign for new TOEIC bootcamp program', 3000000, '2026-03-15'::timestamp, '2026-04-15'::timestamp, 'Completed'),
  ('Kids English Spring Class', 'TikTok Ads', 'Targeting parents for spring kids English classes', 2500000, '2026-02-01'::timestamp, '2026-03-31'::timestamp, 'Completed'),
  ('Business English Professional Series', 'Email', 'Email marketing for business professionals', 1000000, '2026-03-01'::timestamp, '2026-06-30'::timestamp, 'Running'),
  ('Workshop Week Grand Event', 'Offline Event', 'Free workshop week to attract new leads', 8000000, '2026-05-15'::timestamp, '2026-05-22'::timestamp, 'Planning')
ON CONFLICT DO NOTHING;

-- Insert Sample Leads
INSERT INTO "marketing_leads" (full_name, email, phone, source_id, status, notes) 
VALUES
  ('Tran Minh Duc', 'tran.duc@email.com', '0912345678', (SELECT id FROM "marketing_sources" WHERE name = 'Facebook Ads'), 'Contacted', 'Interested in IELTS 6.5+'),
  ('Nguyen Thu Ha', 'ha.nguyen@email.com', '0923456789', (SELECT id FROM "marketing_sources" WHERE name = 'Google Ads'), 'Trial Scheduled', 'Trial class scheduled for May 1'),
  ('Pham Hoang Long', 'long.pham@email.com', '0934567890', (SELECT id FROM "marketing_sources" WHERE name = 'Website'), 'New', 'First time inquirer'),
  ('Dang Thi Hoa', 'hoa.dang@email.com', '0945678901', (SELECT id FROM "marketing_sources" WHERE name = 'Referral'), 'Enrolled', 'Already enrolled in TOEIC class'),
  ('Le Van Son', 'son.le@email.com', '0956789012', (SELECT id FROM "marketing_sources" WHERE name = 'TikTok Ads'), 'New', 'Interested in business English')
ON CONFLICT DO NOTHING;

-- Insert Marketing Promotions
INSERT INTO "marketing_promotions" (code, name, description, discount_type, discount_value, start_date, end_date, status) 
VALUES
  ('SUMMER20', 'Summer 20% Off', 'Get 20% discount on summer courses', 'Percentage', 20, '2026-04-01'::timestamp, '2026-06-30'::timestamp, 'Active'),
  ('IELTS500K', 'IELTS Fixed Discount', 'Get 500,000 VND discount on IELTS courses', 'Fixed Amount', 500000, '2026-03-01'::timestamp, '2026-12-31'::timestamp, 'Active'),
  ('REFERRAL15', 'Referral Program', '15% discount for referrals', 'Percentage', 15, '2026-01-01'::timestamp, '2026-12-31'::timestamp, 'Active'),
  ('FRIEND1M', 'Friend Promotion', '1,000,000 VND off for friend signups', 'Fixed Amount', 1000000, '2026-05-01'::timestamp, '2026-05-31'::timestamp, 'Scheduled'),
  ('NEWSTUDENT30', 'New Student Special', '30% off for new students (first course only)', 'Percentage', 30, '2026-03-15'::timestamp, '2026-04-15'::timestamp, 'Expired')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables created
SELECT 'Tables Created' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'marketing_%'
ORDER BY table_name;

-- Count records in each table
SELECT 
  'marketing_sources' as table_name, COUNT(*) as record_count 
FROM "marketing_sources"
UNION ALL
SELECT 
  'marketing_leads', COUNT(*) 
FROM "marketing_leads"
UNION ALL
SELECT 
  'marketing_campaigns', COUNT(*) 
FROM "marketing_campaigns"
UNION ALL
SELECT 
  'marketing_follow_ups', COUNT(*) 
FROM "marketing_follow_ups"
UNION ALL
SELECT 
  'marketing_promotions', COUNT(*) 
FROM "marketing_promotions"
UNION ALL
SELECT 
  'marketing_lead_activities', COUNT(*) 
FROM "marketing_lead_activities"
ORDER BY table_name;

COMMIT;

-- ============================================
-- SUCCESS! ✅
-- ============================================
-- 
-- Nếu không có lỗi, bạn sẽ thấy:
-- • 6 bảng được tạo
-- • ~25 bản ghi mẫu
-- • 6 indexes được tạo
--
-- Kiểm tra trong Table Editor:
-- • Xem các bảng mới
-- • Xem dữ liệu mẫu
-- • Kiểm tra relationships
--
-- Bây giờ vào ứng dụng:
-- • http://localhost:8081/marketing/leads
-- • Sẽ thấy dữ liệu đã load
--
-- ============================================
