const Advertiser  = require('../models/advertiser');
const Campaign    = require('../models/campaign');
const AdCreative  = require('../models/adCreative');
const Transaction = require('../models/transaction');
const Paystack    = require('../services/paystack');
const { uploadToTelegram } = require('../services/telegramUpload');
const db          = require('../config/db');
const { success, error }  = require('../utils/response');
const { generateCampaignId, generateRef } = require('../utils/generateId');

async function getAdvertiser(user_id) {
  return Advertiser.findByUserId(user_id);
}

// ── STATS ─────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  const adv = await getAdvertiser(req.user.id);
  if (!adv) return error(res, 'Advertiser profile not found', 404);
  const stats = await Advertiser.stats(adv.id);
  return success(res, stats);
};

// ── WALLET ────────────────────────────────────────────────────
exports.fundWallet = async (req, res) => {
  if (!Paystack.isConfigured())
    return error(res, 'Wallet funding is temporarily unavailable. Payment system not yet configured.', 503);
  const adv = await getAdvertiser(req.user.id);
  if (!adv) return error(res, 'Advertiser profile not found', 404);

  const amount = parseFloat(req.body.amount);
  if (!amount || amount < 500) return error(res, 'Minimum fund amount is ₦500');

  const { rows: [userRow] } = await db.query('SELECT email FROM users WHERE id=$1', [req.user.id]);
  const ref  = generateRef();

  const txData = await Paystack.initializeTransaction({
    email:      userRow.email,
    amount_kobo: amount * 100,
    reference:  ref,
    metadata:   { user_id: req.user.id, advertiser_id: adv.id, type: 'fund_wallet' },
  });

  await Transaction.create({
    user_id: req.user.id, type: 'fund_wallet', amount, reference: ref, status: 'pending',
    meta: { advertiser_id: adv.id },
  });

  return success(res, { payment_url: txData.authorization_url, reference: ref });
};

exports.getTransactions = async (req, res) => {
  const txns = await Transaction.byUser(req.user.id, 30);
  return success(res, txns);
};

// ── CAMPAIGNS ─────────────────────────────────────────────────
exports.getCampaigns = async (req, res) => {
  const adv = await getAdvertiser(req.user.id);
  if (!adv) return error(res, 'Advertiser profile not found', 404);
  const campaigns = await Campaign.byAdvertiser(adv.id);
  return success(res, campaigns);
};

exports.createCampaign = async (req, res) => {
  const adv = await getAdvertiser(req.user.id);
  if (!adv) return error(res, 'Advertiser profile not found', 404);

  const { name, budget, daily_limit, bid_type, bid_amount, target_device, start_date, end_date } = req.body;
  if (!name || !budget || !bid_type || !bid_amount)
    return error(res, 'name, budget, bid_type and bid_amount required');
  if (!['cpm','cpc'].includes(bid_type))
    return error(res, 'bid_type must be cpm or cpc');
  if (parseFloat(budget) > parseFloat(adv.wallet_balance))
    return error(res, 'Insufficient wallet balance for this budget');

  const campaign = await Campaign.create({
    advertiser_id: adv.id,
    campaign_id:   generateCampaignId(),
    name, budget, daily_limit: daily_limit || null,
    bid_type, bid_amount, target_device: target_device || 'all',
    start_date: start_date || null, end_date: end_date || null,
  });

  return success(res, campaign, 'Campaign created — pending review', 201);
};

exports.updateCampaignStatus = async (req, res) => {
  const adv = await getAdvertiser(req.user.id);
  if (!adv) return error(res, 'Advertiser profile not found', 404);

  const { status } = req.body;
  if (!['paused','active'].includes(status)) return error(res, 'Status must be paused or active');

  const campaign = await Campaign.findById(req.params.id);
  if (!campaign || campaign.advertiser_id !== adv.id) return error(res, 'Campaign not found', 404);
  if (!['active','paused'].includes(campaign.status)) return error(res, 'Cannot change status of this campaign');

  await Campaign.updateStatus(campaign.id, status);
  return success(res, null, `Campaign ${status}`);
};

exports.getCampaignAnalytics = async (req, res) => {
  const adv = await getAdvertiser(req.user.id);
  if (!adv) return error(res, 'Advertiser profile not found', 404);

  const campaign = await Campaign.findById(req.params.id);
  if (!campaign || campaign.advertiser_id !== adv.id) return error(res, 'Campaign not found', 404);

  const [impressions, clicks] = await Promise.all([
    db.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM impressions WHERE campaign_id=$1 AND created_at > NOW()-INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [campaign.id]
    ),
    db.query(
      `SELECT DATE(created_at) AS date,
              COUNT(*) FILTER (WHERE NOT is_fraud) AS valid,
              COUNT(*) FILTER (WHERE is_fraud) AS fraud
       FROM clicks WHERE campaign_id=$1 AND created_at > NOW()-INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [campaign.id]
    ),
  ]);

  return success(res, {
    campaign,
    impressions: impressions.rows,
    clicks:      clicks.rows,
  });
};

// ── CREATIVES ─────────────────────────────────────────────────
exports.uploadCreative = async (req, res) => {
  const adv = await getAdvertiser(req.user.id);
  if (!adv) return error(res, 'Advertiser profile not found', 404);

  const { campaign_id, headline, description, click_url, creative_type } = req.body;
  if (!campaign_id || !click_url || !creative_type) return error(res, 'campaign_id, click_url and creative_type required');

  const campaign = await Campaign.findById(campaign_id);
  if (!campaign || campaign.advertiser_id !== adv.id) return error(res, 'Campaign not found', 404);

  let file_url = null, telegram_file_id = null;

  if (req.file) {
    const { file_url: url, file_id } = await uploadToTelegram(
      req.file.buffer, req.file.originalname, req.file.mimetype
    );
    file_url         = url;
    telegram_file_id = file_id;
  }

  const creative = await AdCreative.create({
    campaign_id, creative_type, file_url, telegram_file_id, headline, description, click_url,
  });

  return success(res, creative, 'Creative uploaded — pending review', 201);
};

exports.getCreatives = async (req, res) => {
  const adv = await getAdvertiser(req.user.id);
  if (!adv) return error(res, 'Advertiser profile not found', 404);

  const campaign = await Campaign.findById(req.params.campaign_id);
  if (!campaign || campaign.advertiser_id !== adv.id) return error(res, 'Campaign not found', 404);

  const creatives = await AdCreative.byCampaign(campaign.id);
  return success(res, creatives);
};
