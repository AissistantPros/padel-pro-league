import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://unekabiokuevtiyjziof.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZWthYmlva3VldnRpeWp6aW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI3NzE0NSwiZXhwIjoyMTAzODUzMTQ1fQ.4AJlA1g4yPrXxmbf4Qz84ey8ngJF5sdMrm8xAuUp9GY';

const SUPABASE_URL_KEY = 'padel_supabase_url_custom';
const SUPABASE_KEY_KEY = 'padel_supabase_anon_key_custom';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const customUrl = localStorage.getItem(SUPABASE_URL_KEY) || '';
  const customKey = localStorage.getItem(SUPABASE_KEY_KEY) || '';

  return {
    url: envUrl || DEFAULT_SUPABASE_URL || customUrl,
    anonKey: envKey || DEFAULT_SUPABASE_KEY || customKey,
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
