const axios  = require('axios');
const crypto = require('crypto');

const PAYSTACK_BASE   = 'https://api.paystack.co';
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// ── Check if Paystack is configured ─────────────────────────
const isConfigured = () => !!PAYSTACK_SECRET;

const headers = () => ({
  Authorization:  `Bearer ${PAYSTACK_SECRET}`,
  'Content-Type': 'application/json',
});

// ── Guard wrapper — returns clear error if not configured ────
function requirePaystack() {
  if (!isConfigured()) {
    throw new Error('Paystack is not configured on this server. Payment features are currently unavailable.');
  }
}

const Paystack = {
  isConfigured,

  initializeTransaction: async ({ email, amount_kobo, reference, metadata = {} }) => {
    requirePaystack();
    const { data } = await axios.post(`${PAYSTACK_BASE}/transaction/initialize`, {
      email, amount: amount_kobo, reference, metadata,
      callback_url: `${process.env.SERVER_URL}/api/webhook/paystack`,
    }, { headers: headers() });
    return data.data;
  },

  verifyTransaction: async (reference) => {
    requirePaystack();
    const { data } = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${reference}`, { headers: headers() });
    return data.data;
  },

  resolveAccount: async ({ account_number, bank_code }) => {
    requirePaystack();
    const { data } = await axios.get(
      `${PAYSTACK_BASE}/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      { headers: headers() }
    );
    return data.data;
  },

  listBanks: async () => {
    requirePaystack();
    const { data } = await axios.get(`${PAYSTACK_BASE}/bank?country=nigeria&perPage=100`, { headers: headers() });
    return data.data;
  },

  createTransferRecipient: async ({ name, account_number, bank_code }) => {
    requirePaystack();
    const { data } = await axios.post(`${PAYSTACK_BASE}/transferrecipient`, {
      type: 'nuban', name, account_number, bank_code, currency: 'NGN',
    }, { headers: headers() });
    return data.data;
  },

  initiateTransfer: async ({ amount_kobo, recipient_code, reference, reason }) => {
    requirePaystack();
    const { data } = await axios.post(`${PAYSTACK_BASE}/transfer`, {
      source: 'balance', amount: amount_kobo, recipient: recipient_code, reference, reason,
    }, { headers: headers() });
    return data.data;
  },

  verifyWebhookSignature: (rawBody, signature) => {
    if (!isConfigured()) return false;
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
      .update(rawBody).digest('hex');
    return hash === signature;
  },
};

module.exports = Paystack;
