const db         = require('../config/db');
const { hashIp } = require('../utils/hash');

/**
 * Detect fraudulent clicks
 * Returns { is_fraud, reason }
 */
async function detectClickFraud({ ip, ua, campaign_id, impression_id }) {
  const ipHash = hashIp(ip || 'unknown');

  // 1. Duplicate click from same IP on same campaign in 24h
  const { rows: dupRows } = await db.query(
    `SELECT id FROM clicks
     WHERE ip_hash=$1 AND campaign_id=$2 AND created_at > NOW()-INTERVAL '24 hours'
     LIMIT 1`,
    [ipHash, campaign_id]
  );
  if (dupRows.length) return { is_fraud: true, reason: 'duplicate_ip_24h' };

  // 2. Click without a valid impression
  if (impression_id) {
    const { rows: impRows } = await db.query(
      'SELECT id FROM impressions WHERE id=$1 AND campaign_id=$2 LIMIT 1',
      [impression_id, campaign_id]
    );
    if (!impRows.length) return { is_fraud: true, reason: 'no_valid_impression' };
  }

  // 3. More than 10 clicks from same IP in 1 hour (across all campaigns)
  const { rows: rateRows } = await db.query(
    `SELECT COUNT(*) AS cnt FROM clicks
     WHERE ip_hash=$1 AND created_at > NOW()-INTERVAL '1 hour'`,
    [ipHash]
  );
  if (parseInt(rateRows[0].cnt) >= 10) return { is_fraud: true, reason: 'rate_abuse' };

  return { is_fraud: false, reason: null };
}

module.exports = { detectClickFraud };
