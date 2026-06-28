const db = require('../config/db');

const User = {
  findByEmail: (email) =>
    db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
      .then(r => r.rows[0]),

  findById: (id) =>
    db.query('SELECT id,email,full_name,role,is_verified,is_banned FROM users WHERE id = $1', [id])
      .then(r => r.rows[0]),

  create: ({ email, password, full_name, role }) =>
    db.query(
      `INSERT INTO users (email,password,full_name,role)
       VALUES ($1,$2,$3,$4) RETURNING id,email,full_name,role`,
      [email, password, full_name, role]
    ).then(r => r.rows[0]),

  setRefreshToken: (id, token) =>
    db.query('UPDATE users SET refresh_token=$1, updated_at=NOW() WHERE id=$2', [token, id]),

  clearRefreshToken: (id) =>
    db.query('UPDATE users SET refresh_token=NULL, updated_at=NOW() WHERE id=$1', [id]),

  updateLastLogin: (id) =>
    db.query('UPDATE users SET last_login=NOW() WHERE id=$1', [id]),

  ban: (id, reason) =>
    db.query('UPDATE users SET is_banned=$1, ban_reason=$2, updated_at=NOW() WHERE id=$3', [true, reason, id]),

  unban: (id) =>
    db.query('UPDATE users SET is_banned=false, ban_reason=NULL, updated_at=NOW() WHERE id=$1', [id]),

  all: ({ limit = 50, offset = 0, role, search } = {}) => {
    let q = 'SELECT id,email,full_name,role,is_verified,is_banned,last_login,created_at FROM users WHERE 1=1';
    const params = [];
    if (role)   { params.push(role);   q += ` AND role=$${params.length}`; }
    if (search) { params.push(`%${search}%`); q += ` AND (email ILIKE $${params.length} OR full_name ILIKE $${params.length})`; }
    params.push(limit, offset);
    q += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    return db.query(q, params).then(r => r.rows);
  },
};

module.exports = User;
