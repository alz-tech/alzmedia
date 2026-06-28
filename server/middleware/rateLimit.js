const rateLimit = require('express-rate-limit');

const make = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false,
    message: { success: false, message } });

module.exports = {
  authLimiter:     make(15 * 60 * 1000, 10,  'Too many attempts, try again in 15 minutes'),
  apiLimiter:      make(1  * 60 * 1000, 120, 'Too many requests'),
  adServeLimiter:  make(1  * 60 * 1000, 300, 'Rate limit exceeded'),
  uploadLimiter:   make(60 * 60 * 1000, 20,  'Upload limit reached'),
};
