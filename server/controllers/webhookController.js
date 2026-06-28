const Paystack    = require('../services/paystack');
const Advertiser  = require('../models/advertiser');
const Transaction = require('../models/transaction');
const db          = require('../config/db');
const { success, error } = require('../utils/response');

exports.handlePaystack = async (req, res) => {
  // Verify signature — MUST use raw body
  const signature = req.headers['x-paystack-signature'];
  const valid     = Paystack.verifyWebhookSignature(req.rawBody, signature);
  if (!valid) return error(res, 'Invalid signature', 401);

  const { event, data } = req.body;

  if (event === 'charge.success') {
    const { reference, metadata } = data;

    // Prevent double-processing
    const existing = await Transaction.findByRef(reference);
    if (existing?.status === 'success') return res.status(200).json({ received: true });

    if (metadata?.type === 'fund_wallet') {
      const amount = data.amount / 100; // kobo to naira
      await Advertiser.creditWallet(metadata.advertiser_id, amount);
      await Transaction.updateStatus(reference, 'success');
    }
  }

  if (event === 'transfer.success') {
    const { reference } = data;
    await db.query(
      'UPDATE withdrawals SET status=$1, processed_at=NOW() WHERE paystack_ref=$2',
      ['success', reference]
    );
    await Transaction.updateStatus(reference, 'success');
  }

  if (event === 'transfer.failed' || event === 'transfer.reversed') {
    const { reference } = data;
    // Refund publisher wallet
    const { rows: [wd] } = await db.query(
      'SELECT * FROM withdrawals WHERE paystack_ref=$1', [reference]
    );
    if (wd) {
      await db.query(
        'UPDATE publishers SET wallet_balance=wallet_balance+$1 WHERE id=$2',
        [wd.amount, wd.publisher_id]
      );
      await db.query(
        'UPDATE withdrawals SET status=$1 WHERE paystack_ref=$2',
        ['failed', reference]
      );
      await Transaction.updateStatus(reference, 'failed');
    }
  }

  return res.status(200).json({ received: true });
};
