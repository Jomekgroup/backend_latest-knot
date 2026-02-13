import express from 'express';
import { supabase } from '../supabaseClient';

const router = express.Router();

// Sign up with email and password
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ session: data.session, user: data.user });
});

export default router;
