import express from 'express';
import { supabase } from '../supabaseClient';

const router = express.Router();

// Sign in with email and password
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ session: data.session, user: data.user });
});

export default router;
