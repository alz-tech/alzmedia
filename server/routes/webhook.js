const router  = require('express').Router();
const ctrl    = require('../controllers/webhookController');

// Raw body needed for Paystack signature verification
router.post('/paystack',
  (req, _res, next) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { req.rawBody = data; next(); });
  },
  ctrl.handlePaystack
);

module.exports = router;
