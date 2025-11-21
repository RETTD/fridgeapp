import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file
// When running from apps/api, .env is at ../../.env
// When running from packages/api, .env is at ../../../.env
// Try both locations
const envPath1 = path.resolve(process.cwd(), '../../.env');
const envPath2 = path.resolve(process.cwd(), '../../../.env');
dotenv.config({ path: envPath1 });
dotenv.config({ path: envPath2 }); // This will override if both exist, but that's fine

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Supabase client dla backendu - używamy anon key do weryfikacji tokenów użytkowników
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

