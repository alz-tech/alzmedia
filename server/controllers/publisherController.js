const Publisher      = require('../models/publisher');
const PublisherSite  = require('../models/publisher');
const AdSlot         = require('../models/adSlot');
const Transaction    = require('../models/transaction');
const Paystack       = require('../services/paystack');
const db             = require('../config/db');
const { success, error } = require('../utils/response');
const { generateRef }    = require('../utils/generateId');

async function getPublisher(user_id) {
  return Publisher.findByUserId(user_id);
}

// ── DASHBOARD STATS ──────────────────────────────────────────
exports.getStats = async (req, res) => {
  if (req.user.role === 'admin') return success(res, {
    wallet_balance: 0, total_earned: 0, impressions_30d: 0,
    clicks_30d: 0, site_count: 0, slot_count: 0, total_withdrawn: 0,
  });
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);
  const stats = await Publisher.stats(pub.id);
  return success(res, stats);
};

// ── SITES ────────────────────────────────────────────────────
exports.getSites = async (req, res) => {
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);
  const { rows } = await db.query(
    'SELECT * FROM publisher_sites WHERE publisher_id=$1 ORDER BY created_at DESC', [pub.id]
  );
  return success(res, rows);
};

exports.addSite = async (req, res) => {
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);

  const { name, url, platform_type, monthly_traffic } = req.body;
  if (!name || !platform_type) return error(res, 'Name and platform type required');

  const { rows } = await db.query(
    `INSERT INTO publisher_sites (publisher_id,name,url,platform_type,monthly_traffic)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [pub.id, name, url || null, platform_type, monthly_traffic || null]
  );
  return success(res, rows[0], 'Site submitted for review', 201);
};

exports.deleteSite = async (req, res) => {
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);
  await db.query(
    'DELETE FROM publisher_sites WHERE id=$1 AND publisher_id=$2 AND status=\'pending\'',
    [req.params.id, pub.id]
  );
  return success(res, null, 'Site removed');
};

// ── AD SLOTS ─────────────────────────────────────────────────
exports.getSlots = async (req, res) => {
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);
  const slots = await AdSlot.byPublisher(pub.id);
  return success(res, slots);
};

exports.createSlot = async (req, res) => {
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);

  const { site_id, name, slot_type, size } = req.body;
  if (!site_id || !name || !slot_type) return error(res, 'site_id, name and slot_type required');

  // Verify site belongs to this publisher and is approved
  const { rows } = await db.query(
    'SELECT id FROM publisher_sites WHERE id=$1 AND publisher_id=$2 AND status=$3',
    [site_id, pub.id, 'approved']
  );
  if (!rows.length) return error(res, 'Site not found or not approved', 404);

  const slot = await AdSlot.create({ site_id, publisher_id: pub.id, name, slot_type, size: size || null });
  return success(res, slot, 'Slot created', 201);
};

exports.toggleSlot = async (req, res) => {
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);
  const result = await AdSlot.toggle(req.params.id, pub.id);
  if (!result) return error(res, 'Slot not found', 404);
  return success(res, result);
};

exports.deleteSlot = async (req, res) => {
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);
  await AdSlot.delete(req.params.id, pub.id);
  return success(res, null, 'Slot deleted');
};

// ── EARNINGS ─────────────────────────────────────────────────
exports.getEarnings = async (req, res) => {
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);

  const [impressions, clicks, transactions] = await Promise.all([
    db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM impressions WHERE publisher_id=$1 AND created_at > NOW()-INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [pub.id]
    ),
    db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM clicks WHERE publisher_id=$1 AND NOT is_fraud AND created_at > NOW()-INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [pub.id]
    ),
    Transaction.byUser(req.user.id, 20),
  ]);

  return success(res, {
    wallet_balance: pub.wallet_balance,
    total_earned:   pub.total_earned,
    impressions:    impressions.rows,
    clicks:         clicks.rows,
    transactions,
  });
};

// ── BANK & WITHDRAWAL ────────────────────────────────────────
exports.updateBank = async (req, res) => {
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);

  const { bank_name, account_number, account_name, bank_code } = req.body;
  if (!bank_name || !account_number || !account_name || !bank_code)
    return error(res, 'All bank details required');

  await Publisher.updateBank(pub.id, { bank_name, account_number, account_name, bank_code });
  return success(res, null, 'Bank details updated');
};

exports.requestWithdrawal = async (req, res) => {
  if (!Paystack.isConfigured())
    return error(res, 'Withdrawals are temporarily unavailable. Payment system not yet configured.', 503);
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);

  const amount = parseFloat(req.body.amount);
  const { rows: [settings] } = await db.query(
    'SELECT value FROM settings WHERE key=$1', ['min_withdrawal']
  );
  const minWithdrawal = parseFloat(settings?.value || '1000');

  if (!amount || amount < minWithdrawal)
    return error(res, `Minimum withdrawal is ₦${minWithdrawal}`);
  if (pub.wallet_balance < amount)
    return error(res, 'Insufficient wallet balance');
  if (!pub.account_number)
    return error(res, 'Please add your bank details first');

  // Create transfer recipient on Paystack
  const recipient = await Paystack.createTransferRecipient({
    name:           pub.account_name,
    account_number: pub.account_number,
    bank_code:      pub.bank_code,
  });

  const ref = generateRef();

  // Initiate transfer
  await Paystack.initiateTransfer({
    amount_kobo:    amount * 100,
    recipient_code: recipient.recipient_code,
    reference:      ref,
    reason:         'AlzMedia Publisher Withdrawal',
  });

  // Debit wallet
  await Publisher.debitWallet(pub.id, amount);

  // Log withdrawal record
  await db.query(
    `INSERT INTO withdrawals (publisher_id,amount,bank_name,account_number,account_name,paystack_ref,status)
     VALUES ($1,$2,$3,$4,$5,$6,'processing')`,
    [pub.id, amount, pub.bank_name, pub.account_number, pub.account_name, ref]
  );

  await Transaction.create({
    user_id: req.user.id, type: 'withdrawal', amount, reference: ref, status: 'pending',
    meta: { bank: pub.bank_name, account: pub.account_number },
  });

  return success(res, { reference: ref }, 'Withdrawal initiated');
};

exports.getBanks = async (_req, res) => {
  if (!Paystack.isConfigured()) return success(res, [], 'Payment system not configured');
  const banks = await Paystack.listBanks();
  return success(res, banks);
};

exports.resolveAccount = async (req, res) => {
  if (!Paystack.isConfigured()) return error(res, 'Payment system not configured', 503);
  const { account_number, bank_code } = req.body;
  if (!account_number || !bank_code) return error(res, 'account_number and bank_code required');
  const data = await Paystack.resolveAccount({ account_number, bank_code });
  return success(res, data);
};

// ── EMBED CODE ───────────────────────────────────────────────
exports.getEmbedCode = async (req, res) => {
  const pub = await getPublisher(req.user.id);
  if (!pub) return error(res, 'Publisher profile not found', 404);

  const scriptTag = `<script src="${process.env.SERVER_URL}/serve.js?pub=${pub.publisher_id}" async></script>`;
  const apiExample = `GET ${process.env.SERVER_URL}/api/ad/serve?pub=${pub.publisher_id}&slot=SLOT_ID&device=mobile`;

  return success(res, { publisher_id: pub.publisher_id, script_tag: scriptTag, api_example: apiExample });
};
