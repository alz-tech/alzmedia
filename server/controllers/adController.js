const AdSlot     = require('../models/adSlot');
const Publisher  = require('../models/publisher');
const Click      = require('../models/click');
const { selectAd }       = require('../services/adServe');
const { processEarning } = require('../services/earnings');
const { detectClickFraud } = require('../services/fraud');
const { streamFromTelegram } = require('../services/telegramUpload');
const { hashIp }   = require('../utils/hash');
const { success, error } = require('../utils/response');

// ── SERVE AD (called by serve.js or API) ─────────────────────
exports.serveAd = async (req, res) => {
  const { pub, slot, device } = req.query;
  if (!pub || !slot) return error(res, 'pub and slot required');

  const publisher = await Publisher.findByPublisherId?.(pub)
    || await require('../config/db').query(
         'SELECT * FROM publishers WHERE publisher_id=$1', [pub]
       ).then(r => r.rows[0]);

  if (!publisher) return error(res, 'Invalid publisher', 404);

  const slotRecord = await AdSlot.findById(slot);
  if (!slotRecord || !slotRecord.is_active) return error(res, 'Slot not found or inactive', 404);
  if (slotRecord.publisher_id !== publisher.id) return error(res, 'Slot mismatch', 403);

  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const ua = req.headers['user-agent'] || '';

  const ad = await selectAd({
    slot_id:      slotRecord.id,
    publisher_id: publisher.id,
    device_type:  device || 'web',
    ip, ua,
  });

  if (!ad) return res.status(204).json({ success: true, data: null, message: 'No ads available' });

  // Process CPM earning on impression
  if (ad.bid_type === 'cpm') {
    const { rows: [campaign] } = await require('../config/db').query(
      'SELECT * FROM campaigns WHERE id=$1', [ad.campaign_id]
    );
    if (campaign) await processEarning({ campaign, publisher_id: publisher.id, event_type: 'impression' });
  }

  return success(res, ad);
};

// ── TRACK CLICK ───────────────────────────────────────────────
exports.trackClick = async (req, res) => {
  const { impression_id, campaign_id, creative_id, slot_id, publisher_id } = req.body;
  if (!campaign_id || !creative_id) return error(res, 'campaign_id and creative_id required');

  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const ua = req.headers['user-agent'] || '';

  const { is_fraud, reason } = await detectClickFraud({ ip, ua, campaign_id, impression_id });

  const ipHash = hashIp(ip);
  const uaHash = hashIp(ua);

  await Click.create({
    creative_id, campaign_id, slot_id, publisher_id, impression_id,
    ip_hash: ipHash, user_agent_hash: uaHash, is_fraud, fraud_reason: reason,
  });

  if (!is_fraud) {
    const { rows: [campaign] } = await require('../config/db').query(
      'SELECT * FROM campaigns WHERE id=$1', [campaign_id]
    );
    if (campaign?.bid_type === 'cpc') {
      await processEarning({ campaign, publisher_id, event_type: 'click' });
    }
  }

  return success(res, null, 'Click recorded');
};

// ── STREAM MEDIA ─────────────────────────────────────────────
exports.streamMedia = async (req, res) => {
  const { message_id } = req.params;
  if (!message_id || isNaN(parseInt(message_id))) return error(res, 'Invalid media ID');
  await streamFromTelegram(parseInt(message_id), res);
};
