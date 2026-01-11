import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in environment variables.');
}

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const start = Date.now();
  const response = await fetch(input, init);
  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn(`[Supabase] Slow query detected (${duration}ms):`, input.toString());
  }

  return response;
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: customFetch,
  },
  auth: {
    persistSession: false // Backend service usually doesn't need session persistence
  }
});
