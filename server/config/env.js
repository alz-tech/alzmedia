// ── REQUIRED ENV VARS ────────────────────────────────────────
const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

// ── OPTIONAL (warn but don't crash) ─────────────────────────
const optional = [
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'TELEGRAM_API_ID',
  'TELEGRAM_API_HASH',
  'TELEGRAM_SESSION',
  'TELEGRAM_CHANNEL_ID',
];

let hasErrors = false;

required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error('Server cannot start with missing required env vars.');
  process.exit(1);
}

optional.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️  Optional env var not set: ${key} (some features will be disabled)`);
  }
});

console.log('✅ Environment variables loaded');
