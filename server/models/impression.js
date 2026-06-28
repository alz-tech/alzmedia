const db = require('../config/db');

const Impression = {
  create: ({ creative_id, campaign_id, slot_id, publisher_id, ip_hash, user_agent_hash, device_type }) =>
    db.query(
      `INSERT INTO impressions (creative_id,campaign_id,slot_id,publisher_id,ip_hash,user_agent_hash,device_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [creative_id, campaign_id, slot_id, publisher_id, ip_hash, user_agent_hash, device_type]
    ).then(r => r.rows[0]),

  countByPublisher: (publisher_id, days = 30) =>
    db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM impressions WHERE publisher_id=$1 AND created_at > NOW()-INTERVAL '${days} days'
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [publisher_id]
    ).then(r => r.rows),

  countByCampaign: (campaign_id, days = 30) =>
    db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM impressions WHERE campaign_id=$1 AND created_at > NOW()-INTERVAL '${days} days'
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [campaign_id]
    ).then(r => r.rows),
};

module.exports = Impression;
