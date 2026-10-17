-- ============================================================================
-- EMPLOYEE ATTENDANCE SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- Execute this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Workers table
CREATE TABLE IF NOT EXISTS public.workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_name VARCHAR(120) NOT NULL,
  employee_id VARCHAR(50) UNIQUE,
  department VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active workers lookups
CREATE INDEX IF NOT EXISTS idx_workers_status ON public.workers(status);

-- 2. System Settings table (Link lock, system configuration)
CREATE TABLE IF NOT EXISTS public.settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(100) DEFAULT 'admin'
);

-- Seed default settings
INSERT INTO public.settings (key, value, updated_by)
VALUES 
  ('link_locked', 'false', 'system'),
  ('system_name', 'Employee Attendance Recording System', 'system')
ON CONFLICT (key) DO NOTHING;

-- 3. Monthly Submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE RESTRICT,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL CHECK (year BETWEEN 2000 AND 2099),
  status VARCHAR(20) NOT NULL DEFAULT 'Completed' CHECK (status IN ('Completed', 'Incomplete', 'Pending')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_worker_month_year UNIQUE (worker_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_submissions_period ON public.submissions(year, month);

-- 4. Daily Attendance Records table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE RESTRICT,
  attendance_date DATE NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL CHECK (year BETWEEN 2000 AND 2099),
  attendance_status VARCHAR(30) NOT NULL CHECK (
    attendance_status IN ('Present', 'Off Day', 'Sick Leave', 'Emergency Leave', 'Public Holiday', 'Others')
  ),
  time_arrive TIME,
  time_leave TIME,
  keterangan VARCHAR(500) DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_worker_date UNIQUE (worker_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_worker_period ON public.attendance(worker_id, year, month);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);

-- 5. Audit Log table (Admin corrections, link lock toggles, employee edits)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id TEXT,
  actor VARCHAR(100) NOT NULL DEFAULT 'admin',
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Configuration
-- Next.js API Routes utilize the SUPABASE_SERVICE_ROLE_KEY to perform privileged operations,
-- but enabling RLS ensures no unintended direct public writes through the anon key.
-- ============================================================================

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read of active workers only (for the worker dropdown)
CREATE POLICY "Allow public read active workers"
  ON public.workers
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Allow public read of system settings (to check if link is locked)
CREATE POLICY "Allow public read settings"
  ON public.settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- (All inserts, updates, and admin queries are handled securely via Next.js Server API route handlers with the service_role key)

-- ============================================================================
-- OPTIONAL SAMPLE SEED DATA
-- Uncomment to insert sample workers for testing
-- ============================================================================
/*
INSERT INTO public.workers (worker_name, employee_id, department, status) VALUES
  ('Ahmad bin Zulkifli', 'EMP001', 'Operations', 'active'),
  ('Siti Nurhaliza binti Razak', 'EMP002', 'Administration', 'active'),
  ('Tan Wei Hong', 'EMP003', 'Finance', 'active'),
  ('Muthu a/l Subramaniam', 'EMP004', 'Operations', 'active')
ON CONFLICT DO NOTHING;
*/
