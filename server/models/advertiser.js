const db = require('../config/db');

const Advertiser = {
  findByUserId: (user_id) =>
    db.query('SELECT * FROM advertisers WHERE user_id=$1', [user_id]).then(r => r.rows[0]),

  findById: (id) =>
    db.query('SELECT * FROM advertisers WHERE id=$1', [id]).then(r => r.rows[0]),

  create: ({ user_id, advertiser_id }) =>
    db.query(
      'INSERT INTO advertisers (user_id,advertiser_id) VALUES ($1,$2) RETURNING *',
      [user_id, advertiser_id]
    ).then(r => r.rows[0]),

  creditWallet: (id, amount) =>
    db.query(
      'UPDATE advertisers SET wallet_balance=wallet_balance+$1, total_funded=total_funded+$1 WHERE id=$2',
      [amount, id]
    ),

  debitWallet: (id, amount) =>
    db.query(
      'UPDATE advertisers SET wallet_balance=wallet_balance-$1, total_spent=total_spent+$1 WHERE id=$2 AND wallet_balance>=$1',
      [amount, id]
    ).then(r => r.rowCount > 0),

  stats: (id) =>
    db.query(
      `SELECT a.wallet_balance, a.total_spent, a.total_funded,
         COUNT(DISTINCT c.id) AS campaign_count,
         COUNT(DISTINCT CASE WHEN c.status='active' THEN c.id END) AS active_campaigns
       FROM advertisers a
       LEFT JOIN campaigns c ON c.advertiser_id=a.id
       WHERE a.id=$1 GROUP BY a.id`,
      [id]
    ).then(r => r.rows[0]),
};

module.exports = Advertiser;
