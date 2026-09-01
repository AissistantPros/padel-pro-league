import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'padel_supabase_url_custom';
const SUPABASE_KEY_KEY = 'padel_supabase_anon_key_custom';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  // Check env vars first, fallback to user-entered custom localStorage credentials
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const customUrl = localStorage.getItem(SUPABASE_URL_KEY) || '';
  const customKey = localStorage.getItem(SUPABASE_KEY_KEY) || '';

  return {
    url: customUrl || envUrl,
    anonKey: customKey || envKey,
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (url) localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  else localStorage.removeItem(SUPABASE_URL_KEY);

  if (anonKey) localStorage.setItem(SUPABASE_KEY_KEY, anonKey.trim());
  else localStorage.removeItem(SUPABASE_KEY_KEY);
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfiguredUrl = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (!supabaseInstance || currentConfiguredUrl !== url) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: { persistSession: true },
        realtime: { params: { eventsPerSecond: 10 } },
      });
      currentConfiguredUrl = url;
    } catch (err) {
      console.error('Error initializing Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}
