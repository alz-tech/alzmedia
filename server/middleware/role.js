const { error } = require('../utils/response');

// Usage: role('admin') or role('publisher','admin')
module.exports = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return error(res, 'Access denied', 403);
  next();
};
