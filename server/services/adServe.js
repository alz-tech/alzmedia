const Campaign   = require('../models/campaign');
const Impression = require('../models/impression');
const { hashIp } = require('../utils/hash');

/**
 * Pick the best ad for a given slot request
 * Strategy: highest bid among active approved campaigns
 */
async function selectAd({ slot_id, publisher_id, device_type, ip, ua }) {
  const ads = await Campaign.activeForServing(device_type || 'web');
  if (!ads.length) return null;

  // Simple highest-bid selection
  const ad = ads[0];

  const ipHash = hashIp(ip || 'unknown');
  const uaHash = hashIp(ua || 'unknown');

  // Log impression
  const impression = await Impression.create({
    creative_id:     ad.creative_id,
    campaign_id:     ad.id,
    slot_id,
    publisher_id,
    ip_hash:         ipHash,
    user_agent_hash: uaHash,
    device_type:     device_type || 'web',
  });

  return {
    impression_id: impression.id,
    campaign_id:   ad.id,
    creative_id:   ad.creative_id,
    creative_type: ad.creative_type,
    file_url:      ad.file_url,
    headline:      ad.headline,
    description:   ad.description,
    click_url:     `${process.env.SERVER_URL}/api/ad/click`,
    bid_type:      ad.bid_type,
    meta: {
      impression_id: impression.id,
      campaign_id:   ad.id,
      creative_id:   ad.creative_id,
      slot_id,
    },
  };
}

module.exports = { selectAd };
