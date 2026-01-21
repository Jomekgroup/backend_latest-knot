import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// The Pool handles multiple simultaneous connections to Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Required for Supabase & Render to verify the encrypted connection
    rejectUnauthorized: false 
  },
});

// Helper function to run queries (NAMED EXPORT - Keep this for your other files)
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// DEFAULT EXPORT (This fixes the error in app.ts)
// This allows 'import db from ./services/db' to work
export default pool;