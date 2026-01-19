import { createClient } from '@supabase/supabase-js';

// Use process.env for Backend (Node.js/Render)
const supabaseUrl = process.env.https://uycifxbxxzpfkubbiyov.supabase.co;
const supabaseKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y2lmeGJ4eHpwZmt1YmJpeW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzQxNDYsImV4cCI6MjA4MzkxMDE0Nn0.fAWr455JTEsVU8QpLWAwcEAsikXkX0pF8YN_Jzzmzyk || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log the error clearly but DO NOT 'throw' an error here
// This keeps the server alive so the frontend doesn't break
if (!supabaseUrl || !supabaseKey) {
  console.error(`
    ❌ Supabase Client Warning: Missing environment variables. 
    URL found: ${!!supabaseUrl}
    Key found: ${!!supabaseKey}
    Check your Render Environment Settings!
  `);
}

// Provide empty strings as fallbacks to prevent the constructor crash
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseKey || 'placeholder-key'
);