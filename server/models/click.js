const db = require('../config/db');

const Click = {
  create: ({ creative_id, campaign_id, slot_id, publisher_id, impression_id, ip_hash, user_agent_hash, is_fraud, fraud_reason }) =>
    db.query(
      `INSERT INTO clicks (creative_id,campaign_id,slot_id,publisher_id,impression_id,ip_hash,user_agent_hash,is_fraud,fraud_reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [creative_id, campaign_id, slot_id, publisher_id, impression_id, ip_hash, user_agent_hash, is_fraud, fraud_reason]
    ).then(r => r.rows[0]),

  countByCampaign: (campaign_id, days = 30) =>
    db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) FILTER (WHERE NOT is_fraud) AS valid,
              COUNT(*) FILTER (WHERE is_fraud) AS fraud
       FROM clicks WHERE campaign_id=$1 AND created_at > NOW()-INTERVAL '${days} days'
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [campaign_id]
    ).then(r => r.rows),

  countByPublisher: (publisher_id, days = 30) =>
    db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) FILTER (WHERE NOT is_fraud) AS valid
       FROM clicks WHERE publisher_id=$1 AND created_at > NOW()-INTERVAL '${days} days'
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [publisher_id]
    ).then(r => r.rows),
};

module.exports = Click;
