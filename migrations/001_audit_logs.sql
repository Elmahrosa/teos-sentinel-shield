-- TEOS Sentinel Audit Log Schema
-- Run in Supabase SQL Editor or via supabase db push

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL UNIQUE,
  user_id VARCHAR(128) NOT NULL DEFAULT 'anonymous',
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  verdict VARCHAR(20) NOT NULL CHECK (verdict IN ('BLOCK', 'WARN', 'ALLOW')),
  rule_id VARCHAR(10) NOT NULL DEFAULT 'R00',
  rule_name VARCHAR(100) NOT NULL DEFAULT 'R00.CLEAN',
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  command_hash VARCHAR(64) NOT NULL,
  context VARCHAR(50) DEFAULT 'shell',
  tier VARCHAR(20) DEFAULT 'free',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_verdict ON audit_logs(verdict);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_hash ON audit_logs(command_hash);
CREATE INDEX IF NOT EXISTS idx_audit_rule ON audit_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_audit_tier ON audit_logs(tier);

-- Row Level Security: authenticated users can read their own logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_read_policy ON audit_logs
  FOR SELECT
  USING (true);  -- public read: dashboard reads directly via anon key

CREATE POLICY audit_logs_write_policy ON audit_logs
  FOR INSERT
  WITH CHECK (current_setting('app.role', true) = 'service_role');

-- Retention policy: auto-delete logs older than 90 days (free tier)
-- Create a cron job or use pg_cron in production:
-- SELECT cron.schedule('audit-retention', '0 2 * * *', $$DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days'$$);
