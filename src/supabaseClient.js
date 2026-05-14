import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gwxixuuqhdjdeblhibly.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zYWIeMIhONqeo19ZVRWCYg_qHVNQh3E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
