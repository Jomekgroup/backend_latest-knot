import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
}

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseKey);