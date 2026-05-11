-- TEOS Sentinel v2.4 — Billing Schema
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  tier VARCHAR(20) NOT NULL DEFAULT 'free',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  dodo_customer_id VARCHAR(128),
  dodo_subscription_id VARCHAR(128),
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dodo_subscription_id VARCHAR(128) NOT NULL UNIQUE,
  dodo_customer_id VARCHAR(128),
  product_id VARCHAR(128),
  plan_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  interval VARCHAR(20),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id BIGSERIAL PRIMARY KEY,
  key_id UUID REFERENCES api_keys(id),
  endpoint VARCHAR(50) NOT NULL,
  verdict VARCHAR(20),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  req_id VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_tier ON api_keys(tier);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(dodo_customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_key ON usage_logs(key_id);
CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_logs(timestamp DESC);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_read_policy ON subscriptions
  FOR SELECT
  USING (current_setting('app.role', true) = 'service_role');

CREATE POLICY api_keys_read_policy ON api_keys
  FOR SELECT
  USING (current_setting('app.role', true) = 'service_role');

CREATE POLICY api_keys_write_policy ON api_keys
  FOR INSERT
  WITH CHECK (current_setting('app.role', true) = 'service_role');

CREATE POLICY api_keys_update_policy ON api_keys
  FOR UPDATE
  USING (current_setting('app.role', true) = 'service_role');

CREATE POLICY usage_write_policy ON usage_logs
  FOR INSERT
  WITH CHECK (true);
