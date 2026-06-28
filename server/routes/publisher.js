const router  = require('express').Router();
const ctrl    = require('../controllers/publisherController');
const auth    = require('../middleware/auth');
const role    = require('../middleware/role');
const { apiLimiter } = require('../middleware/rateLimit');

router.use(auth, role('publisher','admin'), apiLimiter);

router.get('/stats',                ctrl.getStats);
router.get('/embed',                ctrl.getEmbedCode);
router.get('/banks',                ctrl.getBanks);
router.post('/resolve-account',     ctrl.resolveAccount);
router.put('/bank',                 ctrl.updateBank);

router.get('/sites',                ctrl.getSites);
router.post('/sites',               ctrl.addSite);
router.delete('/sites/:id',         ctrl.deleteSite);

router.get('/slots',                ctrl.getSlots);
router.post('/slots',               ctrl.createSlot);
router.patch('/slots/:id/toggle',   ctrl.toggleSlot);
router.delete('/slots/:id',         ctrl.deleteSlot);

router.get('/earnings',             ctrl.getEarnings);
router.post('/withdraw',            ctrl.requestWithdrawal);

module.exports = router;
