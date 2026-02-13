import { createClient } from '@supabase/supabase-js';

// Accessing environment variables by name (not value)
// This prevents the "TS1005: ',' expected" error
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Log a clear error in the Render logs if variables are missing
if (!supabaseUrl || !supabaseKey) {
  console.error(`
    ❌ Supabase Client Error: Missing environment variables. 
    Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in Render!
  `);
}

// Create the client with fallback empty strings to prevent the app from crashing during build
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || ''
);