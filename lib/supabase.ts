import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Use a more descriptive error for debugging
  throw new Error(`
    ❌ Supabase Client Error: Missing environment variables. 
    URL found: ${!!supabaseUrl}
    Key found: ${!!supabaseKey}
  `);
}

export const supabase = createClient(supabaseUrl, supabaseKey);