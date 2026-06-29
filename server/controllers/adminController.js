const User        = require('../models/user');
const Campaign    = require('../models/campaign');
const AdCreative  = require('../models/adCreative');
const Transaction = require('../models/transaction');
const db          = require('../config/db');
const { success, error } = require('../utils/response');

// ── DASHBOARD ─────────────────────────────────────────────────
exports.getDashboard = async (_req, res) => {
  const [users, campaigns, revenue, pending] = await Promise.all([
    db.query('SELECT COUNT(*) FROM users'),
    db.query('SELECT COUNT(*) FROM campaigns'),
    Transaction.platformSummary(),
    db.query(`SELECT
      (SELECT COUNT(*) FROM publisher_sites WHERE status='pending') AS pending_sites,
      (SELECT COUNT(*) FROM ad_creatives WHERE status='pending')    AS pending_creatives,
      (SELECT COUNT(*) FROM campaigns WHERE status='pending')       AS pending_campaigns,
      (SELECT COUNT(*) FROM withdrawals WHERE status='pending')     AS pending_withdrawals`
    ),
  ]);

  return success(res, {
    total_users:    parseInt(users.rows[0].count),
    total_campaigns: parseInt(campaigns.rows[0].count),
    revenue,
    pending:         pending.rows[0],
  });
};

// ── USERS ─────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  const { role, search, limit = 50, offset = 0 } = req.query;
  const users = await User.all({ role, search, limit: parseInt(limit), offset: parseInt(offset) });
  return success(res, users);
};

exports.banUser = async (req, res) => {
  const { reason } = req.body;
  if (!reason) return error(res, 'Ban reason required');
  if (req.params.id === req.user.id) return error(res, 'Cannot ban yourself');
  await User.ban(req.params.id, reason);
  return success(res, null, 'User banned');
};

exports.unbanUser = async (req, res) => {
  await User.unban(req.params.id);
  return success(res, null, 'User unbanned');
};

exports.deleteUser = async (req, res) => {
  if (req.params.id === req.user.id) return error(res, 'Cannot delete yourself');
  // Check they're not trying to delete the permanent admin
  const target = await User.findById(req.params.id);
  if (!target) return error(res, 'User not found', 404);
  if (target.email === 'confidencerich97@gmail.com') return error(res, 'This admin account is permanent and cannot be deleted', 403);
  await db.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  return success(res, null, 'User deleted');
};

// ── SITES ─────────────────────────────────────────────────────
exports.getPendingSites = async (_req, res) => {
  const { rows } = await db.query(
    `SELECT ps.*, u.full_name, u.email
     FROM publisher_sites ps
     JOIN publishers p ON p.id=ps.publisher_id
     JOIN users u ON u.id=p.user_id
     WHERE ps.status='pending' ORDER BY ps.created_at ASC`
  );
  return success(res, rows);
};

exports.reviewSite = async (req, res) => {
  const { status, rejection_reason } = req.body;
  if (!['approved','rejected'].includes(status)) return error(res, 'Status must be approved or rejected');
  if (status === 'rejected' && !rejection_reason) return error(res, 'Rejection reason required');
  await db.query(
    'UPDATE publisher_sites SET status=$1, rejection_reason=$2 WHERE id=$3',
    [status, rejection_reason || null, req.params.id]
  );
  return success(res, null, `Site ${status}`);
};

// ── CAMPAIGNS ─────────────────────────────────────────────────
exports.getCampaigns = async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  const campaigns = await Campaign.allForAdmin({ status, limit: parseInt(limit), offset: parseInt(offset) });
  return success(res, campaigns);
};

exports.reviewCampaign = async (req, res) => {
  const { status, rejection_reason } = req.body;
  if (!['active','rejected'].includes(status)) return error(res, 'Status must be active or rejected');
  if (status === 'rejected' && !rejection_reason) return error(res, 'Rejection reason required');
  await Campaign.updateStatus(req.params.id, status, rejection_reason || null);
  return success(res, null, `Campaign ${status}`);
};

// ── CREATIVES ─────────────────────────────────────────────────
exports.getPendingCreatives = async (_req, res) => {
  const creatives = await AdCreative.pendingForAdmin();
  return success(res, creatives);
};

exports.reviewCreative = async (req, res) => {
  const { status, rejection_reason } = req.body;
  if (!['approved','rejected'].includes(status)) return error(res, 'Status must be approved or rejected');
  if (status === 'rejected' && !rejection_reason) return error(res, 'Rejection reason required');
  await AdCreative.updateStatus(req.params.id, status, rejection_reason || null);
  return success(res, null, `Creative ${status}`);
};

// ── WITHDRAWALS ───────────────────────────────────────────────
exports.getWithdrawals = async (req, res) => {
  const { status = 'pending' } = req.query;
  const { rows } = await db.query(
    `SELECT w.*, u.full_name, u.email
     FROM withdrawals w
     JOIN publishers p ON p.id=w.publisher_id
     JOIN users u ON u.id=p.user_id
     WHERE w.status=$1 ORDER BY w.created_at DESC`,
    [status]
  );
  return success(res, rows);
};

exports.markWithdrawalProcessed = async (req, res) => {
  await db.query(
    'UPDATE withdrawals SET status=$1, processed_at=NOW() WHERE id=$2',
    ['success', req.params.id]
  );
  await Transaction.updateStatus(req.params.id, 'success');
  return success(res, null, 'Withdrawal marked as processed');
};

// ── SETTINGS ─────────────────────────────────────────────────
exports.getSettings = async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM settings');
  return success(res, Object.fromEntries(rows.map(r => [r.key, r.value])));
};

exports.updateSetting = async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) return error(res, 'key and value required');
  await db.query(
    'UPDATE settings SET value=$1, updated_at=NOW() WHERE key=$2',
    [String(value), key]
  );
  return success(res, null, 'Setting updated');
};
