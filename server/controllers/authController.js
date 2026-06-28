const User        = require('../models/user');
const Publisher   = require('../models/publisher');
const Advertiser  = require('../models/advertiser');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const { generatePublisherId, generateAdvertiserId } = require('../utils/generateId');
const { success, error } = require('../utils/response');

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7d
};

function issueTokens(res, payload) {
  const access  = signAccess(payload);
  const refresh = signRefresh(payload);
  res.cookie('access_token',  access,  { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refresh, COOKIE_OPTS);
  return { access, refresh };
}

exports.register = async (req, res) => {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name || !role)
    return error(res, 'All fields required');
  if (!['publisher', 'advertiser'].includes(role))
    return error(res, 'Invalid role');
  if (password.length < 8)
    return error(res, 'Password must be at least 8 characters');

  const existing = await User.findByEmail(email);
  if (existing) return error(res, 'Email already registered', 409);

  const hashed = await hashPassword(password);
  const user   = await User.create({ email, password: hashed, full_name, role });

  if (role === 'publisher') {
    await Publisher.create({ user_id: user.id, publisher_id: generatePublisherId() });
  } else {
    await Advertiser.create({ user_id: user.id, advertiser_id: generateAdvertiserId() });
  }

  const { access } = issueTokens(res, { id: user.id, role: user.role });
  await User.setRefreshToken(user.id, signRefresh({ id: user.id, role: user.role }));

  return success(res, { user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } },
    'Account created', 201);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return error(res, 'Email and password required');

  const user = await User.findByEmail(email);
  if (!user) return error(res, 'Invalid credentials', 401);
  if (user.is_banned) return error(res, 'Your account has been suspended', 403);

  const valid = await comparePassword(password, user.password);
  if (!valid) return error(res, 'Invalid credentials', 401);

  issueTokens(res, { id: user.id, role: user.role });
  await User.setRefreshToken(user.id, signRefresh({ id: user.id, role: user.role }));
  await User.updateLastLogin(user.id);

  return success(res, { user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } }, 'Login successful');
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return error(res, 'No refresh token', 401);

  try {
    const decoded = verifyRefresh(token);
    const user    = await User.findById(decoded.id);
    if (!user || user.is_banned) return error(res, 'Unauthorized', 401);

    issueTokens(res, { id: user.id, role: user.role });
    return success(res, null, 'Token refreshed');
  } catch {
    return error(res, 'Invalid refresh token', 401);
  }
};

exports.logout = async (req, res) => {
  await User.clearRefreshToken(req.user.id);
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  return success(res, null, 'Logged out');
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return error(res, 'User not found', 404);
  return success(res, { user });
};
