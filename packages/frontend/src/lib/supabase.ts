import { createClient } from '@supabase/supabase-js';

// Support both Vite-prefixed and standard env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. If you're running locally, make sure your .env variables are prefixed with VITE_ or configured in your vite.config.ts.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseKey || 'placeholder-key'
);
