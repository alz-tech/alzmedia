const db          = require('../config/db');
const Publisher   = require('../models/publisher');
const Advertiser  = require('../models/advertiser');
const Campaign    = require('../models/campaign');
const Transaction = require('../models/transaction');
const { generateRef } = require('../utils/generateId');

async function getSettings() {
  const { rows } = await db.query('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map(r => [r.key, parseFloat(r.value)]));
}

/**
 * Called after every valid impression (CPM) or click (CPC)
 * Deducts from advertiser, credits publisher, logs transactions
 */
async function processEarning({ campaign, publisher_id, event_type }) {
  const settings  = await getSettings();
  const pubCut    = settings.publisher_cut / 100;  // 0.70
  const platCut   = settings.platform_cut  / 100;  // 0.30

  // Only charge on CPM impressions or CPC clicks
  if (event_type === 'impression' && campaign.bid_type !== 'cpm') return;
  if (event_type === 'click'      && campaign.bid_type !== 'cpc') return;

  // For CPM: charge per 1000 impressions — so cost per impression = bid_amount / 1000
  const cost = event_type === 'impression'
    ? parseFloat(campaign.bid_amount) / 1000
    : parseFloat(campaign.bid_amount);

  const pubEarn  = parseFloat((cost * pubCut).toFixed(2));
  const platEarn = parseFloat((cost * platCut).toFixed(2));

  const advertiser = await Advertiser.findById(campaign.advertiser_id);
  if (!advertiser) return;

  // Deduct from advertiser wallet + campaign spend
  const deducted = await Advertiser.debitWallet(advertiser.id, cost);
  if (!deducted) {
    // Mark campaign as budget exhausted
    await Campaign.updateStatus(campaign.id, 'budget_exhausted');
    return;
  }

  await Campaign.deductSpend(campaign.id, cost);

  // Credit publisher
  await Publisher.creditEarnings(publisher_id, pubEarn);

  // Log transactions
  const ref = generateRef();
  await Transaction.create({
    user_id:   advertiser.user_id,
    type:      'ad_spend',
    amount:    cost,
    reference: `${ref}-SPEND`,
    status:    'success',
    meta:      { campaign_id: campaign.id, event_type },
  });

  const pub = await Publisher.findById(publisher_id);
  if (pub) {
    await Transaction.create({
      user_id:   pub.user_id,
      type:      'publisher_earn',
      amount:    pubEarn,
      reference: `${ref}-EARN`,
      status:    'success',
      meta:      { campaign_id: campaign.id, event_type },
    });
  }
}

module.exports = { processEarning, getSettings };
