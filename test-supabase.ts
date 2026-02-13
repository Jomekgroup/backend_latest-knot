import 'dotenv/config'; // Loads your .env
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testConnection() {
  console.log("Checking Supabase connection...");
  
  // Attempt to fetch ALL profiles
  // If Service Role is working, this returns everything even if RLS is on.
  const { data, error } = await supabase
    .from('profiles') 
    .select('id, name');

  if (error) {
    console.error("❌ Connection Failed:", error.message);
    return;
  }

  console.log("✅ Connection Successful!");
  console.log(`Found ${data.length} profiles in the Knot Registry.`);
  console.table(data); // Shows a nice table of your users in the console
}

testConnection();