const router  = require('express').Router();
const ctrl    = require('../controllers/advertiserController');
const auth    = require('../middleware/auth');
const role    = require('../middleware/role');
const multer  = require('multer');
const { apiLimiter, uploadLimiter } = require('../middleware/rateLimit');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2048 * 1024 * 1024 }, // 2GB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(auth, role('advertiser','admin'), apiLimiter);

router.get('/stats',                             ctrl.getStats);
router.post('/fund',                             ctrl.fundWallet);
router.get('/transactions',                      ctrl.getTransactions);

router.get('/campaigns',                         ctrl.getCampaigns);
router.post('/campaigns',                        ctrl.createCampaign);
router.patch('/campaigns/:id/status',            ctrl.updateCampaignStatus);
router.get('/campaigns/:id/analytics',           ctrl.getCampaignAnalytics);

router.get('/campaigns/:campaign_id/creatives',  ctrl.getCreatives);
router.post('/campaigns/:campaign_id/creatives',
  uploadLimiter,
  upload.single('file'),
  ctrl.uploadCreative
);

module.exports = router;
