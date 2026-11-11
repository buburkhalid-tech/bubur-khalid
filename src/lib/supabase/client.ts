import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wmcyfdcpaovhkyxaulsd.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Fg0sB490Erku6qvy9KNGcg_OhjCGI66';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
