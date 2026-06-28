require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const cookieParser = require('cookie-parser');
const sanitize   = require('./middleware/sanitize');

const app = express();

// ── SECURITY HEADERS ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── BODY + COOKIE PARSING ────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── INPUT SANITIZATION ───────────────────────────────────────
app.use(sanitize);

// ── TRUST PROXY (Heroku) ─────────────────────────────────────
app.set('trust proxy', 1);

// ── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/publisher', require('./routes/publisher'));
app.use('/api/advertiser',require('./routes/advertiser'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/ad',        require('./routes/ad'));
app.use('/api/webhook',   require('./routes/webhook'));

// ── SERVE EMBED SCRIPT ───────────────────────────────────────
const fs   = require('fs');
const path = require('path');
app.get('/serve.js', (_req, res) => {
  const script = fs.readFileSync(path.join(__dirname, 'public/serve.js'), 'utf8')
    .replace('%%SERVER_URL%%', process.env.SERVER_URL || '');
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(script);
});

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'AlzMedia API', version: '1.0.0' }));

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── GLOBAL ERROR HANDLER ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
