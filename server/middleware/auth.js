const { verifyAccess } = require('../utils/jwt');
const { error }        = require('../utils/response');

module.exports = (req, res, next) => {
  // Read token from httpOnly cookie first, fall back to Authorization header
  const token = req.cookies?.access_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) return error(res, 'Authentication required', 401);

  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }
};
