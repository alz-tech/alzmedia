const db           = require('../config/db');
const { hashIp }   = require('../utils/hash');
const { error }    = require('../utils/response');

// Block duplicate clicks from same IP+UA within 24h per campaign
module.exports = async (req, res, next) => {
  try {
    const ip      = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const ua      = req.headers['user-agent'] || '';
    const ipHash  = hashIp(ip);
    const uaHash  = hashIp(ua);
    const { campaign_id } = req.body;

    if (!campaign_id) return next();

    const { rows } = await db.query(
      `SELECT id FROM clicks
       WHERE ip_hash = $1 AND campaign_id = $2
         AND created_at > NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [ipHash, campaign_id]
    );

    if (rows.length > 0) {
      return error(res, 'Duplicate interaction detected', 429);
    }

    req.ipHash = ipHash;
    req.uaHash = uaHash;
    next();
  } catch (err) {
    console.error('Fraud middleware error:', err);
    next(); // don't block on middleware failure
  }
};
