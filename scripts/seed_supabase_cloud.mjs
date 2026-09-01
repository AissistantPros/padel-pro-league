import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unekabiokuevtiyjziof.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZWthYmlva3VldnRpeWp6aW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI3NzE0NSwiZXhwIjoyMTAzODUzMTQ1fQ.4AJlA1g4yPrXxmbf4Qz84ey8ngJF5sdMrm8xAuUp9GY';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seedData() {
  console.log('Sembrando datos en Supabase...');

  const INITIAL_PLAYERS = [
    { id: 'p1', name: 'Alejandro Galán', nickname: 'Ale', registeredAt: '2026-08-01', isActive: true },
    { id: 'p2', name: 'Juan Lebrón', nickname: 'El Lobo', registeredAt: '2026-08-01', isActive: true },
    { id: 'p3', name: 'Agustín Tapia', nickname: 'El Mozart', registeredAt: '2026-08-01', isActive: true },
    { id: 'p4', name: 'Arturo Coello', nickname: 'King Arturo', registeredAt: '2026-08-01', isActive: true },
    { id: 'p5', name: 'Franco Stupaczuk', nickname: 'Stupa', registeredAt: '2026-08-01', isActive: true },
    { id: 'p6', name: 'Martín Di Nenno', nickname: 'El Rengo', registeredAt: '2026-08-01', isActive: true },
    { id: 'p7', name: 'Fernando Belasteguín', nickname: 'Bela', registeredAt: '2026-08-01', isActive: true },
    { id: 'p8', name: 'Paquito Navarro', nickname: 'Paquito', registeredAt: '2026-08-01', isActive: true },
    { id: 'p9', name: 'Fede Chingotto', nickname: 'Super Ratón', registeredAt: '2026-08-01', isActive: true },
    { id: 'p10', name: 'Javier Garrido', nickname: 'Metralleta', registeredAt: '2026-08-01', isActive: true },
    { id: 'p11', name: 'Miguel Yanguas', nickname: 'Mike', registeredAt: '2026-08-01', isActive: true },
    { id: 'p12', name: 'Coki Nieto', nickname: 'El Muro', registeredAt: '2026-08-01', isActive: true },
    { id: 'p13', name: 'Jon Sanz', nickname: 'El Rayo', registeredAt: '2026-08-01', isActive: true },
    { id: 'p14', name: 'Lucas Campagnolo', nickname: 'Campa', registeredAt: '2026-08-01', isActive: true },
    { id: 'p15', name: 'Alex Arroyo', nickname: 'El Cañón', registeredAt: '2026-08-01', isActive: true },
    { id: 'p16', name: 'Edu Alonso', nickname: 'Edu', registeredAt: '2026-08-01', isActive: true },
  ];

  for (const p of INITIAL_PLAYERS) {
    await supabase.from('players').upsert({ id: p.id, data: p, updated_at: new Date().toISOString() });
  }
  console.log(`✅ ${INITIAL_PLAYERS.length} Jugadores subidos a Supabase.`);

  const config = {
    tournamentName: 'Liga Pro Padel Master 🎾',
    courtNames: ['Cancha 1 (Central)', 'Cancha 2', 'Cancha 3', 'Cancha 4'],
    adminPin: '1234',
    rankingSystem: 'bayesian',
    bayesianFactorK: 4,
    attendanceBonusPoints: 0.5,
    tieBreakMaxPoints: 10,
  };
  await supabase.from('tournament_settings').upsert({ id: 'main_config', data: config, updated_at: new Date().toISOString() });
  console.log('✅ Configuración del torneo guardada en Supabase.');

  // Verify
  const { data: pCount } = await supabase.from('players').select('id');
  console.log(`\n🎉 Verificación final: ${pCount?.length} jugadores activos en Supabase.`);
}

seedData();
