import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!URL || !KEY) {
    console.error('❌ Missing Supabase env. Create .env.local with:');
    console.error('   VITE_SUPABASE_URL=https://xxx.supabase.co');
    console.error('   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx');
}

export const supabase = createClient(URL || '', KEY || '', {
    auth: {
        persistSession: false,       // ← no auth = no session to persist
        autoRefreshToken: false,     // ← no token to refresh
        detectSessionInUrl: false    // ← THIS was causing the redirect loops
    }
});