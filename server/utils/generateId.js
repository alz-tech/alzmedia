const { v4: uuidv4 } = require('uuid');
const slug = () => uuidv4().split('-')[0].toUpperCase();

module.exports = {
  generatePublisherId:  () => `PUB-${slug()}`,
  generateAdvertiserId: () => `ADV-${slug()}`,
  generateCampaignId:   () => `CAM-${slug()}`,
  generateRef:          () => `ALZ-${Date.now()}-${slug()}`,
};
