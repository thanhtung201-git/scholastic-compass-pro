-- MCNAEdu CRM - Marketing Module Tables (Schema Only)
-- Copy and paste this code into your Supabase Dashboard -> SQL Editor and click 'RUN'

-- ============================================
-- 1. MARKETING SOURCES TABLE
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
-- 2. MARKETING LEADS TABLE
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

CREATE INDEX idx_marketing_leads_source_id ON "marketing_leads"(source_id);
CREATE INDEX idx_marketing_leads_status ON "marketing_leads"(status);
CREATE INDEX idx_marketing_leads_created_at ON "marketing_leads"(created_at);

-- ============================================
-- 3. MARKETING CAMPAIGNS TABLE
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

CREATE INDEX idx_marketing_campaigns_status ON "marketing_campaigns"(status);
CREATE INDEX idx_marketing_campaigns_channel ON "marketing_campaigns"(channel);
CREATE INDEX idx_marketing_campaigns_created_at ON "marketing_campaigns"(created_at);

-- ============================================
-- 4. MARKETING FOLLOW-UPS TABLE
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

CREATE INDEX idx_marketing_follow_ups_lead_id ON "marketing_follow_ups"(lead_id);
CREATE INDEX idx_marketing_follow_ups_status ON "marketing_follow_ups"(status);
CREATE INDEX idx_marketing_follow_ups_deadline ON "marketing_follow_ups"(deadline);
CREATE INDEX idx_marketing_follow_ups_priority ON "marketing_follow_ups"(priority);

-- ============================================
-- 5. MARKETING PROMOTIONS TABLE
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

CREATE INDEX idx_marketing_promotions_code ON "marketing_promotions"(code);
CREATE INDEX idx_marketing_promotions_status ON "marketing_promotions"(status);
CREATE INDEX idx_marketing_promotions_start_date ON "marketing_promotions"(start_date);
CREATE INDEX idx_marketing_promotions_end_date ON "marketing_promotions"(end_date);

-- ============================================
-- 6. MARKETING LEAD ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "marketing_lead_activities" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES "marketing_leads"(id) ON DELETE CASCADE,
  activity_type VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marketing_lead_activities_lead_id ON "marketing_lead_activities"(lead_id);
CREATE INDEX idx_marketing_lead_activities_created_at ON "marketing_lead_activities"(created_at);

-- ============================================
-- DISABLE ROW LEVEL SECURITY (for development)
-- ============================================
ALTER TABLE "marketing_sources" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_leads" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_campaigns" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_follow_ups" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_promotions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_lead_activities" DISABLE ROW LEVEL SECURITY;
