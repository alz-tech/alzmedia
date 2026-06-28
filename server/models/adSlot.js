const db = require('../config/db');

const AdSlot = {
  create: ({ site_id, publisher_id, name, slot_type, size }) =>
    db.query(
      'INSERT INTO ad_slots (site_id,publisher_id,name,slot_type,size) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [site_id, publisher_id, name, slot_type, size]
    ).then(r => r.rows[0]),

  findById: (id) =>
    db.query('SELECT * FROM ad_slots WHERE id=$1', [id]).then(r => r.rows[0]),

  byPublisher: (publisher_id) =>
    db.query(
      `SELECT s.*, ps.name AS site_name FROM ad_slots s
       JOIN publisher_sites ps ON ps.id=s.site_id
       WHERE s.publisher_id=$1 ORDER BY s.created_at DESC`,
      [publisher_id]
    ).then(r => r.rows),

  toggle: (id, publisher_id) =>
    db.query(
      'UPDATE ad_slots SET is_active=NOT is_active WHERE id=$1 AND publisher_id=$2 RETURNING is_active',
      [id, publisher_id]
    ).then(r => r.rows[0]),

  delete: (id, publisher_id) =>
    db.query('DELETE FROM ad_slots WHERE id=$1 AND publisher_id=$2', [id, publisher_id]),
};

module.exports = AdSlot;
