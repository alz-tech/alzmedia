require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');
const fs           = require('fs');
const sanitize     = require('./middleware/sanitize');

const app = express();

// ── SECURITY HEADERS ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      mediaSrc:   ["'self'", 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || true,
  credentials: true,
}));

// ── BODY + COOKIE PARSING ────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── INPUT SANITIZATION ───────────────────────────────────────
app.use(sanitize);

// ── TRUST PROXY (Render) ─────────────────────────────────────
app.set('trust proxy', 1);

// ── API ROUTES ───────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/publisher',  require('./routes/publisher'));
app.use('/api/advertiser', require('./routes/advertiser'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/ad',         require('./routes/ad'));
app.use('/api/webhook',    require('./routes/webhook'));

// ── SERVE EMBED SCRIPT ───────────────────────────────────────
app.get('/serve.js', (_req, res) => {
  const script = fs.readFileSync(path.join(__dirname, 'public/serve.js'), 'utf8')
    .replace('%%SERVER_URL%%', process.env.SERVER_URL || '');
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(script);
});

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'AlzMedia', version: '1.0.0' }));

// ── SERVE REACT FRONTEND ─────────────────────────────────────
const distPath    = path.join(__dirname, '../client/dist');
const indexPath   = path.join(distPath, 'index.html');
const distExists  = fs.existsSync(indexPath);

if (distExists) {
  app.use(express.static(distPath));
  console.log('✅ Serving React frontend from client/dist');
} else {
  console.warn('⚠️  client/dist not found — frontend not built yet');
}

// ── CATCH ALL ────────────────────────────────────────────────
app.get('*', (req, res) => {
  // Don't catch API routes
  if (req.path.startsWith('/api') || req.path === '/serve.js' || req.path === '/health') {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }

  if (distExists) {
    return res.sendFile(indexPath);
  }

  // Frontend not built — show helpful message
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head><title>AlzMedia</title></head>
    <body style="background:#07070D;color:#F4F4FF;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px;">
      <h1 style="font-size:32px;margin:0"><span style="color:#9D5FF5">Alz</span>Media</h1>
      <p style="color:#6B6B8A;margin:0">API is running. Frontend build not found.</p>
      <p style="color:#6B6B8A;font-size:13px;margin:0">Run: npm run build</p>
    </body>
    </html>
  `);
});

// ── GLOBAL ERROR HANDLER ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
