import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unekabiokuevtiyjziof.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZWthYmlva3VldnRpeWp6aW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI3NzE0NSwiZXhwIjoyMTAzODUzMTQ1fQ.4AJlA1g4yPrXxmbf4Qz84ey8ngJF5sdMrm8xAuUp9GY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function wipeDatabase() {
  console.log('🧹 Limpiando todos los datos dummy de Supabase...');

  // Delete all players
  const { error: errPlayers } = await supabase.from('players').delete().neq('id', '___non_existent___');
  if (errPlayers) console.error('Error limpiando players:', errPlayers);
  else console.log('✅ Tabla players vaciada.');

  // Delete all tournament days
  const { error: errDays } = await supabase.from('tournament_days').delete().neq('id', '___non_existent___');
  if (errDays) console.error('Error limpiando tournament_days:', errDays);
  else console.log('✅ Tabla tournament_days vaciada.');

  // Delete grand finale
  const { error: errFinale } = await supabase.from('grand_finale').delete().neq('id', '___non_existent___');
  if (errFinale) console.error('Error limpiando grand_finale:', errFinale);
  else console.log('✅ Tabla grand_finale vaciada.');

  // Reset settings to clean tournament state
  const cleanConfig = {
    tournamentName: 'G20 by Peter Inc. 🎾',
    courtNames: ['Cancha 1 (Central Oro)', 'Cancha 2 (Plata)', 'Cancha 3 (Bronce)', 'Cancha 4 (Cobre / El Asador)'],
    adminPin: '1234',
    rankingSystem: 'total_points',
    bayesianFactorK: 4,
    attendanceBonusPoints: 0.5,
    tieBreakMaxPoints: 10
  };

  const { error: errSettings } = await supabase.from('tournament_settings').upsert({
    id: 'main_config',
    data: cleanConfig,
    updated_at: new Date().toISOString()
  });

  if (errSettings) console.error('Error guardando configuración limpia:', errSettings);
  else console.log('✅ Configuración oficial de G20 by Peter Inc. restablecida.');

  console.log('\n🎉 ¡Base de datos de Supabase 100% limpia y lista para tus datos reales!');
}

wipeDatabase();
