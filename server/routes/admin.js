const router  = require('express').Router();
const ctrl    = require('../controllers/adminController');
const auth    = require('../middleware/auth');
const role    = require('../middleware/role');
const { apiLimiter } = require('../middleware/rateLimit');

router.use(auth, role('admin'), apiLimiter);

router.get('/dashboard',                   ctrl.getDashboard);

router.get('/users',                       ctrl.getUsers);
router.post('/users/:id/ban',              ctrl.banUser);
router.post('/users/:id/unban',            ctrl.unbanUser);

router.get('/sites/pending',               ctrl.getPendingSites);
router.patch('/sites/:id/review',          ctrl.reviewSite);

router.get('/campaigns',                   ctrl.getCampaigns);
router.patch('/campaigns/:id/review',      ctrl.reviewCampaign);

router.get('/creatives/pending',           ctrl.getPendingCreatives);
router.patch('/creatives/:id/review',      ctrl.reviewCreative);

router.get('/withdrawals',                 ctrl.getWithdrawals);
router.patch('/withdrawals/:id/process',   ctrl.markWithdrawalProcessed);

router.get('/settings',                    ctrl.getSettings);
router.put('/settings',                    ctrl.updateSetting);

module.exports = router;
