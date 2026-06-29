require('./config/env');
const app    = require('./app');
const db     = require('./config/db');
const runSeed = require('./startup/seed');

const PORT = process.env.PORT || 3000;

async function start() {
  // Verify DB connection
  try {
    await db.query('SELECT 1');
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  // Run one-time seed (safe — checks flag before doing anything)
  await runSeed();

  app.listen(PORT, () => {
    console.log(`🚀 AlzMedia API running on port ${PORT}`);
    console.log(`   Env: ${process.env.NODE_ENV || 'development'}`);
  });
}

start();
