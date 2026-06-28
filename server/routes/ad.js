const router  = require('express').Router();
const ctrl    = require('../controllers/adController');
const { adServeLimiter } = require('../middleware/rateLimit');

router.use(adServeLimiter);

router.get('/serve',           ctrl.serveAd);
router.post('/click',          ctrl.trackClick);
router.get('/media/:message_id', ctrl.streamMedia);

module.exports = router;

// Serve the embed script with dynamic SERVER_URL injected
const fs   = require('fs');
const path = require('path');
router.get('/serve-script', (_req, res) => {
  const script = fs.readFileSync(path.join(__dirname, '../public/serve.js'), 'utf8')
    .replace('%%SERVER_URL%%', process.env.SERVER_URL || '');
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(script);
});
