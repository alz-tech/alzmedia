/**
 * AlzMedia — One-time startup seed
 *
 * On every cold start it checks the `settings` table for the key
 * `seed_v1_done`. If missing it:
 *   1. Wipes all user-owned data (users + cascades)
 *   2. Creates the permanent admin account
 *   3. Creates publisher + advertiser profiles for the admin
 *   4. Writes `seed_v1_done = true` so it never runs again
 *
 * Change the key to `seed_v2_done` whenever you want a fresh reset on
 * the next deploy, then revert after it's done.
 */

const db            = require('../config/db');
const { hashPassword } = require('../utils/hash');
const { generatePublisherId, generateAdvertiserId } = require('../utils/generateId');

const SEED_KEY      = 'seed_v2_done';
const ADMIN_EMAIL   = 'confidencerich97@gmail.com';
const ADMIN_NAME    = 'AlzMedia Admin';
const ADMIN_PASS    = process.env.ADMIN_PASSWORD || 'AlzMedia@Admin2025!';

async function runSeed() {
  try {
    // ── Check if already seeded ──────────────────────────────
    const check = await db.query(
      "SELECT value FROM settings WHERE key = $1",
      [SEED_KEY]
    ).catch(() => ({ rows: [] }));

    if (check.rows.length && check.rows[0].value === 'true') {
      console.log('✅ Seed already done — skipping');
      return;
    }

    console.log('🌱 Running first-time seed...');

    // ── 0. Run any missing migrations first ──────────────────
    // These are safe to run on existing DBs (IF NOT EXISTS / IF NOT EXISTS pattern)
    const migrations = [
      `ALTER TABLE publishers ADD COLUMN IF NOT EXISTS site_name VARCHAR(255)`,
      `ALTER TABLE publishers ADD COLUMN IF NOT EXISTS platform_type VARCHAR(30)`,
      `ALTER TABLE publishers ADD COLUMN IF NOT EXISTS traffic_estimate VARCHAR(50)`,
      `ALTER TABLE publishers ADD COLUMN IF NOT EXISTS content_category VARCHAR(100)`,
      `ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)`,
      `ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS industry VARCHAR(100)`,
      `ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS budget_range VARCHAR(50)`,
      `ALTER TABLE advertisers ADD COLUMN IF NOT EXISTS what_to_advertise TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'none'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS id_doc_telegram_id TEXT`,
      `CREATE TABLE IF NOT EXISTS email_verifications (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        code        VARCHAR(6) NOT NULL,
        expires_at  TIMESTAMP NOT NULL,
        used        BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMP DEFAULT NOW()
      )`,
      `ALTER TABLE publisher_sites DROP CONSTRAINT IF EXISTS publisher_sites_platform_type_check`,
      `ALTER TABLE publisher_sites ADD CONSTRAINT publisher_sites_platform_type_check
        CHECK (platform_type IN ('website','android','ios','mobile_app','windows','telegram','whatsapp','youtube','other'))`,
    ];
    for (const sql of migrations) {
      await db.query(sql).catch(e => console.warn('   Migration skipped:', e.message));
    }
    console.log('   ✅ Migrations applied');

    // ── 1. Wipe all users (cascades to publishers, advertisers, etc.) ──
    await db.query('DELETE FROM users');
    console.log('   🗑  Cleared all users');

    // ── 2. Create permanent admin ─────────────────────────────
    const hashed = await hashPassword(ADMIN_PASS);
    const { rows: [admin] } = await db.query(
      `INSERT INTO users (email, password, full_name, role, is_verified)
       VALUES ($1, $2, $3, 'admin', true)
       RETURNING id`,
      [ADMIN_EMAIL, hashed, ADMIN_NAME]
    );
    console.log(`   👤  Admin created: ${ADMIN_EMAIL}`);

    // ── 3. Create publisher profile for admin ─────────────────
    await db.query(
      `INSERT INTO publishers (user_id, publisher_id, site_name, platform_type)
       VALUES ($1, $2, 'AlzMedia Official', 'website')`,
      [admin.id, generatePublisherId()]
    );
    console.log('   📰  Publisher profile created for admin');

    // ── 4. Create advertiser profile for admin ────────────────
    await db.query(
      `INSERT INTO advertisers (user_id, advertiser_id, company_name)
       VALUES ($1, $2, 'AlzMedia Official')`,
      [admin.id, generateAdvertiserId()]
    );
    console.log('   📢  Advertiser profile created for admin');

    // ── 5. Mark seed as done ──────────────────────────────────
    await db.query(
      `INSERT INTO settings (key, value)
       VALUES ($1, 'true')
       ON CONFLICT (key) DO UPDATE SET value='true', updated_at=NOW()`,
      [SEED_KEY]
    );

    console.log('✅ Seed complete!');
    console.log(`   Login: ${ADMIN_EMAIL}`);
    console.log(`   Pass:  ${ADMIN_PASS}`);
    console.log('   ⚠️  Change ADMIN_PASSWORD env var or update it after first login!');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    // Don't crash the server — just log it
  }
}

module.exports = runSeed;
