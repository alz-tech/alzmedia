const xss = require('xss');

const clean = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') obj[key] = xss(obj[key].trim());
    else if (typeof obj[key] === 'object') clean(obj[key]);
  }
};

module.exports = (req, _res, next) => {
  clean(req.body);
  clean(req.query);
  next();
};
