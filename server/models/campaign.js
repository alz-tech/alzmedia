const db = require('../config/db');

const Campaign = {
  create: ({ advertiser_id, campaign_id, name, budget, daily_limit, bid_type, bid_amount, target_device, start_date, end_date }) =>
    db.query(
      `INSERT INTO campaigns
         (advertiser_id,campaign_id,name,budget,daily_limit,bid_type,bid_amount,target_device,start_date,end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [advertiser_id, campaign_id, name, budget, daily_limit, bid_type, bid_amount, target_device, start_date, end_date]
    ).then(r => r.rows[0]),

  findById: (id) =>
    db.query('SELECT * FROM campaigns WHERE id=$1', [id]).then(r => r.rows[0]),

  byAdvertiser: (advertiser_id) =>
    db.query(
      `SELECT c.*, COUNT(DISTINCT cr.id) AS creative_count
       FROM campaigns c
       LEFT JOIN ad_creatives cr ON cr.campaign_id=c.id
       WHERE c.advertiser_id=$1 ORDER BY c.created_at DESC`,
      [advertiser_id]
    ).then(r => r.rows),

  updateStatus: (id, status, reason = null) =>
    db.query(
      'UPDATE campaigns SET status=$1, rejection_reason=$2, updated_at=NOW() WHERE id=$3',
      [status, reason, id]
    ),

  deductSpend: (id, amount) =>
    db.query(
      `UPDATE campaigns SET spent=spent+$1, daily_spent=daily_spent+$1, updated_at=NOW()
       WHERE id=$2 AND budget-spent>=$1`,
      [amount, id]
    ).then(r => r.rowCount > 0),

  resetDailySpend: () =>
    db.query(
      `UPDATE campaigns SET daily_spent=0, daily_reset_at=NOW()
       WHERE daily_reset_at < NOW() - INTERVAL '24 hours' OR daily_reset_at IS NULL`
    ),

  activeForServing: (device_type) =>
    db.query(
      `SELECT c.*, cr.id AS creative_id, cr.file_url, cr.telegram_file_id,
              cr.headline, cr.description, cr.click_url, cr.creative_type
       FROM campaigns c
       JOIN ad_creatives cr ON cr.campaign_id=c.id AND cr.status='approved'
       WHERE c.status='active'
         AND (c.target_device='all' OR c.target_device=$1)
         AND c.budget > c.spent
         AND (c.daily_limit IS NULL OR c.daily_limit > c.daily_spent)
         AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
       ORDER BY c.bid_amount DESC`,
      [device_type]
    ).then(r => r.rows),

  allForAdmin: ({ limit = 50, offset = 0, status } = {}) => {
    let q = `SELECT c.*, u.full_name AS advertiser_name, u.email AS advertiser_email
             FROM campaigns c JOIN advertisers a ON a.id=c.advertiser_id JOIN users u ON u.id=a.user_id
             WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); q += ` AND c.status=$${params.length}`; }
    params.push(limit, offset);
    q += ` ORDER BY c.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    return db.query(q, params).then(r => r.rows);
  },
};

module.exports = Campaign;
