const db = require('../config/db');

const Transaction = {
  create: ({ user_id, type, amount, reference, status = 'pending', meta = {} }) =>
    db.query(
      'INSERT INTO transactions (user_id,type,amount,reference,status,meta) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [user_id, type, amount, reference, status, JSON.stringify(meta)]
    ).then(r => r.rows[0]),

  findByRef: (reference) =>
    db.query('SELECT * FROM transactions WHERE reference=$1', [reference]).then(r => r.rows[0]),

  updateStatus: (reference, status) =>
    db.query('UPDATE transactions SET status=$1 WHERE reference=$2', [status, reference]),

  byUser: (user_id, limit = 30) =>
    db.query(
      'SELECT * FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2',
      [user_id, limit]
    ).then(r => r.rows),

  platformSummary: () =>
    db.query(
      `SELECT type, SUM(amount) AS total, COUNT(*) AS count
       FROM transactions WHERE status='success'
       GROUP BY type`
    ).then(r => r.rows),
};

module.exports = Transaction;
