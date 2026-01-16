import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { verifyTransaction } from '../services/paystack.service';

const router = express.Router();

// Initialize Supabase with Service Role (Admin)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1. Manual Verification (Frontend Callback)
router.post('/verify', async (req, res) => {
  const { reference, userId } = req.body;

  try {
    const data = await verifyTransaction(reference);

    if (data.status && data.data.status === 'success') {
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: true, last_payment_ref: reference })
        .eq('id', userId);

      if (error) throw error;
      return res.json({ status: 'success', message: 'Premium activated' });
    }
    res.status(400).json({ status: 'failed', message: 'Payment not successful' });
  } catch (e: any) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// 2. Webhook Listener (The Secure Safety Net)
router.post('/webhook', async (req, res) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.sendStatus(401);
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    // CRITICAL: Get userId from the metadata we sent from the frontend
    const userId = event.data.metadata?.user_id; 
    const email = event.data.customer.email;

    if (userId) {
      // Best way: Update by ID
      await supabase
        .from('profiles')
        .update({ is_premium: true, last_payment_ref: reference })
        .eq('id', userId);
      console.log(`⭐ Webhook: Upgraded user ${userId}`);
    } else {
      // Fallback: Update by email if ID is missing
      await supabase
        .from('profiles')
        .update({ is_premium: true, last_payment_ref: reference })
        .eq('email', email);
      console.log(`⭐ Webhook: Upgraded via email ${email}`);
    }
  }

  res.sendStatus(200); // Always tell Paystack you received it
});

export default router;