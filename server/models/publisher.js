const db = require('../config/db');

const Publisher = {
  findByUserId: (user_id) =>
    db.query('SELECT * FROM publishers WHERE user_id=$1', [user_id]).then(r => r.rows[0]),

  findById: (id) =>
    db.query('SELECT * FROM publishers WHERE id=$1', [id]).then(r => r.rows[0]),

  create: ({ user_id, publisher_id }) =>
    db.query(
      'INSERT INTO publishers (user_id,publisher_id) VALUES ($1,$2) RETURNING *',
      [user_id, publisher_id]
    ).then(r => r.rows[0]),

  updateBank: (id, { bank_name, account_number, account_name, bank_code }) =>
    db.query(
      `UPDATE publishers SET bank_name=$1,account_number=$2,account_name=$3,bank_code=$4 WHERE id=$5`,
      [bank_name, account_number, account_name, bank_code, id]
    ),

  creditEarnings: (id, amount) =>
    db.query(
      'UPDATE publishers SET wallet_balance=wallet_balance+$1, total_earned=total_earned+$1 WHERE id=$2',
      [amount, id]
    ),

  debitWallet: (id, amount) =>
    db.query(
      'UPDATE publishers SET wallet_balance=wallet_balance-$1, total_withdrawn=total_withdrawn+$1 WHERE id=$2 AND wallet_balance>=$1',
      [amount, id]
    ).then(r => r.rowCount > 0),

  stats: (id) =>
    db.query(
      `SELECT
         p.wallet_balance, p.total_earned, p.total_withdrawn,
         COUNT(DISTINCT ps.id) AS site_count,
         COUNT(DISTINCT s.id)  AS slot_count,
         COALESCE(SUM(CASE WHEN i.created_at > NOW()-INTERVAL '30 days' THEN 1 END),0) AS impressions_30d,
         COALESCE(SUM(CASE WHEN c.created_at > NOW()-INTERVAL '30 days' THEN 1 END),0) AS clicks_30d
       FROM publishers p
       LEFT JOIN publisher_sites ps ON ps.publisher_id = p.id
       LEFT JOIN ad_slots s         ON s.publisher_id  = p.id
       LEFT JOIN impressions i      ON i.publisher_id  = p.id
       LEFT JOIN clicks c           ON c.publisher_id  = p.id
       WHERE p.id=$1 GROUP BY p.id`,
      [id]
    ).then(r => r.rows[0]),
};

module.exports = Publisher;
