-- Accounting Module Tables
-- Copy and paste this code into your Supabase Dashboard -> SQL Editor and click 'RUN'

-- ============================================
-- 1. TUITION PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "tuition_payments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES "tuition_invoices"(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES "students"(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tuition_payments_invoice_id ON "tuition_payments"(invoice_id);
CREATE INDEX idx_tuition_payments_student_id ON "tuition_payments"(student_id);

-- ============================================
-- 2. INVOICE INSTALLMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "invoice_installments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES "tuition_invoices"(id) ON DELETE CASCADE,
  amount_due DECIMAL(15, 2) NOT NULL,
  amount_paid DECIMAL(15, 2) DEFAULT 0,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Unpaid', -- Paid, Partial, Unpaid, Overdue
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_installments_invoice_id ON "invoice_installments"(invoice_id);

-- ============================================
-- 3. EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "expenses" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL, -- Marketing, Rent, Utilities, Salary, Equipment, Other
  amount DECIMAL(15, 2) NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT,
  created_by VARCHAR(255),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_category ON "expenses"(category);
CREATE INDEX idx_expenses_date ON "expenses"(expense_date);

-- ============================================
-- 4. PAYROLL SLIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "payroll_slips" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES "teachers"(id) ON DELETE CASCADE,
  period_month VARCHAR(10) NOT NULL, -- e.g. "2026-05"
  base_salary DECIMAL(15, 2) DEFAULT 0,
  bonus DECIMAL(15, 2) DEFAULT 0,
  deductions DECIMAL(15, 2) DEFAULT 0,
  total_salary DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Draft', -- Draft, Approved, Paid
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payroll_slips_teacher_id ON "payroll_slips"(teacher_id);
CREATE INDEX idx_payroll_slips_period ON "payroll_slips"(period_month);

-- ============================================
-- DISABLE ROW LEVEL SECURITY (for development)
-- ============================================
ALTER TABLE "tuition_payments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_installments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_slips" DISABLE ROW LEVEL SECURITY;
