import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unekabiokuevtiyjziof.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZWthYmlva3VldnRpeWp6aW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI3NzE0NSwiZXhwIjoyMTAzODUzMTQ1fQ.4AJlA1g4yPrXxmbf4Qz84ey8ngJF5sdMrm8xAuUp9GY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('Connecting to Supabase project unekabiokuevtiyjziof...');

async function testConnection() {
  const { data, error } = await supabase.from('tournament_settings').select('*');
  console.log('Settings check:', { data, error });
}

testConnection();
