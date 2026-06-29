const isConfigured = () =>
  !!(process.env.TELEGRAM_API_ID &&
     process.env.TELEGRAM_API_HASH &&
     process.env.TELEGRAM_SESSION &&
     process.env.TELEGRAM_CHANNEL_ID);

let client = null;

async function getClient() {
  if (!isConfigured()) {
    throw new Error('Telegram is not configured. Media upload features are unavailable.');
  }

  const { TelegramClient } = require('telegram');
  const { StringSession }  = require('telegram/sessions');

  if (client && client.connected) return client;

  const apiId   = parseInt(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  const session = new StringSession(process.env.TELEGRAM_SESSION);

  client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 });
  await client.connect();
  console.log('✅ Telegram client connected');
  return client;
}

module.exports = { getClient, isConfigured };
