const router  = require('express').Router();
const ctrl    = require('../controllers/authController');
const auth    = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, ctrl.register);
router.post('/login',    authLimiter, ctrl.login);
router.post('/refresh',  ctrl.refresh);
router.post('/logout',   auth, ctrl.logout);
router.get('/me',        auth, ctrl.me);

module.exports = router;
