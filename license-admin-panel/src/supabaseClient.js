import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Use Service Key if available for Admin privileges, otherwise Anon Key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseKey);
