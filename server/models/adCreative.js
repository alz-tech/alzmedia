const db = require('../config/db');

const AdCreative = {
  create: ({ campaign_id, creative_type, file_url, telegram_file_id, headline, description, click_url }) =>
    db.query(
      `INSERT INTO ad_creatives (campaign_id,creative_type,file_url,telegram_file_id,headline,description,click_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [campaign_id, creative_type, file_url, telegram_file_id, headline, description, click_url]
    ).then(r => r.rows[0]),

  byCampaign: (campaign_id) =>
    db.query('SELECT * FROM ad_creatives WHERE campaign_id=$1 ORDER BY created_at DESC', [campaign_id])
      .then(r => r.rows),

  findById: (id) =>
    db.query('SELECT * FROM ad_creatives WHERE id=$1', [id]).then(r => r.rows[0]),

  updateStatus: (id, status, reason = null) =>
    db.query('UPDATE ad_creatives SET status=$1, rejection_reason=$2 WHERE id=$3', [status, reason, id]),

  pendingForAdmin: () =>
    db.query(
      `SELECT cr.*, c.name AS campaign_name, u.full_name AS advertiser_name
       FROM ad_creatives cr
       JOIN campaigns c ON c.id=cr.campaign_id
       JOIN advertisers a ON a.id=c.advertiser_id
       JOIN users u ON u.id=a.user_id
       WHERE cr.status='pending' ORDER BY cr.created_at ASC`
    ).then(r => r.rows),
};

module.exports = AdCreative;
