import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'sa-east-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'ca-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1'
];

async function scanPoolers() {
  console.log('Buscando el servidor de conexión de Supabase en todas las regiones...');

  for (const reg of regions) {
    const host = `aws-0-${reg}.pooler.supabase.com`;
    const client = new Client({
      host,
      port: 6543,
      user: 'postgres.unekabiokuevtiyjziof',
      password: 'Bi3EC7#CqY2xc?.',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 2500
    });

    try {
      await client.connect();
      console.log(`\n🎉 ¡CONECTADO CON ÉXITO A SUPABASE EN: ${reg}!`);
      
      const sql = fs.readFileSync('supabase_schema.sql', 'utf8');
      console.log('1. Ejecutando creación de tablas (tournament_settings, players, tournament_days, grand_finale)...');
      await client.query(sql);
      console.log('✅ Tablas y políticas RLS creadas exitosamente.');

      await client.end();
      console.log('\n🎉 ¡TODAS LAS TABLAS FUERON CREADAS DIRECTAMENTE EN TU SUPABASE!');
      process.exit(0);
    } catch (e) {
      // ignore and try next
    }
  }

  // Also try port 5432 session poolers
  for (const reg of regions) {
    const host = `aws-0-${reg}.pooler.supabase.com`;
    const client = new Client({
      host,
      port: 5432,
      user: 'postgres.unekabiokuevtiyjziof',
      password: 'Bi3EC7#CqY2xc?.',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 2500
    });

    try {
      await client.connect();
      console.log(`\n🎉 ¡CONECTADO CON ÉXITO A SUPABASE EN: ${reg} (port 5432)!`);
      
      const sql = fs.readFileSync('supabase_schema.sql', 'utf8');
      console.log('1. Ejecutando creación de tablas...');
      await client.query(sql);
      console.log('✅ Tablas y políticas RLS creadas exitosamente.');

      await client.end();
      console.log('\n🎉 ¡TODAS LAS TABLAS FUERON CREADAS DIRECTAMENTE EN TU SUPABASE!');
      process.exit(0);
    } catch (e) {
      // ignore
    }
  }

  console.log('No se pudo determinar el pooler automáticamente.');
}

scanPoolers();
