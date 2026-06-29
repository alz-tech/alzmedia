const User        = require('../models/user');
const Publisher   = require('../models/publisher');
const Advertiser  = require('../models/advertiser');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const { generatePublisherId, generateAdvertiserId } = require('../utils/generateId');
const { success, error } = require('../utils/response');
const { sendVerificationEmail } = require('../services/mailer');
const db = require('../config/db');

const isProd = process.env.NODE_ENV === 'production';

function setCookies(res, accessToken, refreshToken) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge:   15 * 60 * 1000,
    path:     '/',
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
    path:     '/',
  });
}

exports.register = async (req, res) => {
  const { email, password, full_name, role,
    // Publisher extras
    site_name, site_url, platform_type, traffic, content_category,
    // Advertiser extras
    company_name, industry, budget_range, what_to_advertise,
  } = req.body;

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
    await db.query(
      `INSERT INTO publishers (user_id, publisher_id, site_name, platform_type, traffic_estimate, content_category)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, generatePublisherId(), site_name || null, platform_type || null, traffic || null, content_category || null]
    );
    // If site_url provided, auto-create first site
    if (site_name && site_url) {
      const pub = await Publisher.findByUserId(user.id);
      if (pub) {
        await db.query(
          `INSERT INTO publisher_sites (publisher_id, name, url, platform_type, monthly_traffic, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')`,
          [pub.id, site_name, site_url, platform_type || 'website', traffic || null]
        ).catch(() => {});
      }
    }
  } else {
    await db.query(
      `INSERT INTO advertisers (user_id, advertiser_id, company_name, industry, budget_range, what_to_advertise)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, generateAdvertiserId(), company_name || null, industry || null, budget_range || null, what_to_advertise || null]
    );
  }

  const accessToken  = signAccess({ id: user.id, role: user.role });
  const refreshToken = signRefresh({ id: user.id, role: user.role });

  setCookies(res, accessToken, refreshToken);
  await User.setRefreshToken(user.id, refreshToken);

  return success(res, {
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
  }, 'Account created', 201);
};

exports.sendVerification = async (req, res) => {
  const userId = req.user.id;
  const user   = await User.findById(userId);
  if (!user) return error(res, 'User not found', 404);
  if (user.is_verified) return error(res, 'Already verified');

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Invalidate old codes
  await db.query('UPDATE email_verifications SET used=true WHERE user_id=$1 AND used=false', [userId]);
  await db.query(
    'INSERT INTO email_verifications (user_id, code, expires_at) VALUES ($1, $2, $3)',
    [userId, code, expiresAt]
  );

  // Send email (gracefully skip if not configured)
  try {
    const fullUser = await db.query('SELECT email FROM users WHERE id=$1', [userId]).then(r => r.rows[0]);
    await sendVerificationEmail(fullUser.email, code);
  } catch (e) {
    console.warn('[Auth] Email send failed:', e.message);
  }

  // In dev/no-SMTP: return code in response so you can test
  const isDev = process.env.NODE_ENV !== 'production';
  return success(res, isDev ? { code } : null, 'Verification code sent');
};

exports.verifyEmail = async (req, res) => {
  const { code } = req.body;
  const userId   = req.user.id;
  if (!code) return error(res, 'Code is required');

  const row = await db.query(
    `SELECT * FROM email_verifications
     WHERE user_id=$1 AND code=$2 AND used=false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId, code]
  ).then(r => r.rows[0]);

  if (!row) return error(res, 'Invalid or expired code', 400);

  await db.query('UPDATE email_verifications SET used=true WHERE id=$1', [row.id]);
  await db.query('UPDATE users SET is_verified=true, updated_at=NOW() WHERE id=$1', [userId]);

  return success(res, null, 'Email verified');
};

exports.uploadId = async (req, res) => {
  if (!req.file) return error(res, 'No file uploaded');
  const userId = req.user.id;

  try {
    const { uploadBuffer } = require('../services/telegramUpload');
    const telegramId = await uploadBuffer(req.file.buffer, req.file.originalname);
    await db.query(
      `UPDATE users SET id_doc_telegram_id=$1, verification_status='pending', updated_at=NOW() WHERE id=$2`,
      [telegramId, userId]
    );
    return success(res, null, 'Document uploaded — account under review');
  } catch (e) {
    // Even if upload fails, set status to pending
    await db.query(
      `UPDATE users SET verification_status='pending', updated_at=NOW() WHERE id=$1`,
      [userId]
    ).catch(() => {});
    return success(res, null, 'Document submitted for review');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return error(res, 'Email and password required');

  const user = await User.findByEmail(email);
  if (!user)         return error(res, 'Invalid credentials', 401);
  if (user.is_banned) return error(res, 'Your account has been suspended', 403);

  const valid = await comparePassword(password, user.password);
  if (!valid) return error(res, 'Invalid credentials', 401);

  const accessToken  = signAccess({ id: user.id, role: user.role });
  const refreshToken = signRefresh({ id: user.id, role: user.role });

  setCookies(res, accessToken, refreshToken);
  await User.setRefreshToken(user.id, refreshToken);
  await User.updateLastLogin(user.id);

  return success(res, {
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, is_verified: user.is_verified }
  }, 'Login successful');
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return error(res, 'No refresh token', 401);

  try {
    const decoded = verifyRefresh(token);
    const user    = await User.findById(decoded.id);
    if (!user || user.is_banned) return error(res, 'Unauthorized', 401);

    const accessToken  = signAccess({ id: user.id, role: user.role });
    const refreshToken = signRefresh({ id: user.id, role: user.role });

    setCookies(res, accessToken, refreshToken);
    return success(res, null, 'Token refreshed');
  } catch {
    return error(res, 'Invalid refresh token', 401);
  }
};

exports.logout = async (req, res) => {
  await User.clearRefreshToken(req.user.id);
  res.clearCookie('access_token',  { path: '/', sameSite: isProd ? 'none' : 'lax', secure: isProd });
  res.clearCookie('refresh_token', { path: '/', sameSite: isProd ? 'none' : 'lax', secure: isProd });
  return success(res, null, 'Logged out');
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return error(res, 'User not found', 404);
  return success(res, { user });
};
