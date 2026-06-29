-- ============================================================
-- AlzMedia Database Schema
-- PostgreSQL 14+
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email            VARCHAR(255) UNIQUE NOT NULL,
  password         VARCHAR(255) NOT NULL,
  full_name        VARCHAR(255) NOT NULL,
  role             VARCHAR(20)  NOT NULL CHECK (role IN ('publisher','advertiser','admin')),
  is_verified      BOOLEAN DEFAULT FALSE,
  is_banned        BOOLEAN DEFAULT FALSE,
  ban_reason       TEXT,
  refresh_token    TEXT,
  last_login       TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- ── PUBLISHERS ───────────────────────────────────────────────
CREATE TABLE publishers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  publisher_id     VARCHAR(20) UNIQUE NOT NULL,
  wallet_balance   NUMERIC(12,2) DEFAULT 0,
  total_earned     NUMERIC(12,2) DEFAULT 0,
  total_withdrawn  NUMERIC(12,2) DEFAULT 0,
  bank_name        VARCHAR(100),
  account_number   VARCHAR(20),
  account_name     VARCHAR(255),
  bank_code        VARCHAR(10),
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ── ADVERTISERS ──────────────────────────────────────────────
CREATE TABLE advertisers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  advertiser_id    VARCHAR(20) UNIQUE NOT NULL,
  wallet_balance   NUMERIC(12,2) DEFAULT 0,
  total_spent      NUMERIC(12,2) DEFAULT 0,
  total_funded     NUMERIC(12,2) DEFAULT 0,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ── PUBLISHER SITES / APPS ───────────────────────────────────
CREATE TABLE publisher_sites (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publisher_id     UUID REFERENCES publishers(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  url              VARCHAR(500),
  platform_type    VARCHAR(30)  CHECK (platform_type IN ('website','android','ios','mobile_app','windows','telegram','whatsapp','youtube','other')),
  status           VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  rejection_reason TEXT,
  monthly_traffic  VARCHAR(50),
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ── AD SLOTS ─────────────────────────────────────────────────
CREATE TABLE ad_slots (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id          UUID REFERENCES publisher_sites(id) ON DELETE CASCADE,
  publisher_id     UUID REFERENCES publishers(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  slot_type        VARCHAR(30)  CHECK (slot_type IN ('banner','in-content','video','native')),
  size             VARCHAR(30),
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ── CAMPAIGNS ────────────────────────────────────────────────
CREATE TABLE campaigns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advertiser_id    UUID REFERENCES advertisers(id) ON DELETE CASCADE,
  campaign_id      VARCHAR(20) UNIQUE NOT NULL,
  name             VARCHAR(255) NOT NULL,
  budget           NUMERIC(12,2) NOT NULL,
  daily_limit      NUMERIC(12,2),
  spent            NUMERIC(12,2) DEFAULT 0,
  daily_spent      NUMERIC(12,2) DEFAULT 0,
  daily_reset_at   TIMESTAMP,
  bid_type         VARCHAR(10)  CHECK (bid_type IN ('cpm','cpc')),
  bid_amount       NUMERIC(10,2) NOT NULL,
  target_device    VARCHAR(20)  DEFAULT 'all' CHECK (target_device IN ('all','web','mobile','app')),
  start_date       DATE,
  end_date         DATE,
  status           VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','active','paused','completed','rejected','budget_exhausted')),
  rejection_reason TEXT,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- ── AD CREATIVES ─────────────────────────────────────────────
CREATE TABLE ad_creatives (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id      UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  creative_type    VARCHAR(20)  CHECK (creative_type IN ('image','video','text')),
  file_url         TEXT,
  telegram_file_id TEXT,
  headline         VARCHAR(255),
  description      TEXT,
  click_url        TEXT NOT NULL,
  status           VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ── IMPRESSIONS ──────────────────────────────────────────────
CREATE TABLE impressions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creative_id      UUID REFERENCES ad_creatives(id),
  campaign_id      UUID REFERENCES campaigns(id),
  slot_id          UUID REFERENCES ad_slots(id),
  publisher_id     UUID REFERENCES publishers(id),
  ip_hash          VARCHAR(128),
  user_agent_hash  VARCHAR(128),
  device_type      VARCHAR(20),
  country          VARCHAR(10),
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ── CLICKS ───────────────────────────────────────────────────
CREATE TABLE clicks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creative_id      UUID REFERENCES ad_creatives(id),
  campaign_id      UUID REFERENCES campaigns(id),
  slot_id          UUID REFERENCES ad_slots(id),
  publisher_id     UUID REFERENCES publishers(id),
  impression_id    UUID REFERENCES impressions(id),
  ip_hash          VARCHAR(128),
  user_agent_hash  VARCHAR(128),
  is_fraud         BOOLEAN DEFAULT FALSE,
  fraud_reason     VARCHAR(100),
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ── TRANSACTIONS ─────────────────────────────────────────────
CREATE TABLE transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES users(id),
  type             VARCHAR(30)  CHECK (type IN ('fund_wallet','ad_spend','publisher_earn','withdrawal','platform_fee','refund')),
  amount           NUMERIC(12,2) NOT NULL,
  reference        VARCHAR(255) UNIQUE,
  status           VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  meta             JSONB,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ── WITHDRAWALS ──────────────────────────────────────────────
CREATE TABLE withdrawals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publisher_id     UUID REFERENCES publishers(id),
  amount           NUMERIC(12,2) NOT NULL,
  bank_name        VARCHAR(100),
  account_number   VARCHAR(20),
  account_name     VARCHAR(255),
  paystack_ref     VARCHAR(255),
  status           VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','processing','success','failed')),
  failure_reason   TEXT,
  created_at       TIMESTAMP DEFAULT NOW(),
  processed_at     TIMESTAMP
);

-- ── PLATFORM SETTINGS ────────────────────────────────────────
CREATE TABLE settings (
  key              VARCHAR(100) PRIMARY KEY,
  value            TEXT NOT NULL,
  updated_at       TIMESTAMP DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('platform_cut',   '30'),
  ('publisher_cut',  '70'),
  ('min_withdrawal', '1000'),
  ('default_cpm',    '500'),
  ('default_cpc',    '10'),
  ('max_file_size',  '2048');

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX idx_impressions_campaign    ON impressions(campaign_id);
CREATE INDEX idx_impressions_publisher   ON impressions(publisher_id);
CREATE INDEX idx_impressions_created     ON impressions(created_at);
CREATE INDEX idx_clicks_campaign         ON clicks(campaign_id);
CREATE INDEX idx_clicks_publisher        ON clicks(publisher_id);
CREATE INDEX idx_clicks_ip               ON clicks(ip_hash);
CREATE INDEX idx_clicks_created          ON clicks(created_at);
CREATE INDEX idx_transactions_user       ON transactions(user_id);
CREATE INDEX idx_transactions_type       ON transactions(type);
CREATE INDEX idx_campaigns_advertiser    ON campaigns(advertiser_id);
CREATE INDEX idx_campaigns_status        ON campaigns(status);
CREATE INDEX idx_ad_slots_publisher      ON ad_slots(publisher_id);
CREATE INDEX idx_ad_slots_site           ON ad_slots(site_id);
CREATE INDEX idx_publisher_sites_pub     ON publisher_sites(publisher_id);
CREATE INDEX idx_users_email             ON users(email);
CREATE INDEX idx_withdrawals_publisher   ON withdrawals(publisher_id);

-- ── EMAIL VERIFICATION CODES ────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  code        VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);

-- ── USER ONBOARDING EXTRAS ──────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'none'
  CHECK (verification_status IN ('none','pending','approved','rejected'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_doc_telegram_id TEXT;
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS site_name VARCHAR(255);
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS platform_type VARCHAR(30);
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS traffic_estimate VARCHAR(50);
ALTER TABLE publishers ADD COLUMN IF NOT EXISTS content_category VARCHAR(100);
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS budget_range VARCHAR(50);
ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS what_to_advertise TEXT;

-- ── PLATFORM TYPE EXPANSION (migration for existing DBs) ─────
ALTER TABLE publisher_sites DROP CONSTRAINT IF EXISTS publisher_sites_platform_type_check;
ALTER TABLE publisher_sites ADD CONSTRAINT publisher_sites_platform_type_check
  CHECK (platform_type IN ('website','android','ios','mobile_app','windows','telegram','whatsapp','youtube','other'));

-- ── SEED TRACKING ────────────────────────────────────────────
-- seed_v1_done is inserted at runtime by startup/seed.js
-- Change to seed_v2_done in seed.js to trigger a fresh reset on next deploy
