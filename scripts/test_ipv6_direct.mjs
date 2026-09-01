import pg from 'pg';
import dns from 'dns';
import fs from 'fs';
const { Client } = pg;

// Set default DNS resolution order to IPv6 first or check IPv6 addresses
dns.setDefaultResultOrder('verbatim');

dns.lookup('db.unekabiokuevtiyjziof.supabase.co', { all: true }, async (err, addresses) => {
  console.log('DNS lookup result:', { err, addresses });

  if (addresses && addresses.length > 0) {
    for (const addr of addresses) {
      console.log('Connecting to IP:', addr.address, 'Family:', addr.family);
      const client = new Client({
        host: addr.address,
        port: 5432,
        user: 'postgres',
        password: 'Bi3EC7#CqY2xc?.',
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        await client.connect();
        console.log('🎉 SUCCESS! Connected directly to Supabase Postgres on', addr.address);
        
        const sql = fs.readFileSync('supabase_schema.sql', 'utf8');
        console.log('Executing SQL schema...');
        await client.query(sql);
        console.log('✅ SQL Schema executed successfully on Supabase!');
        await client.end();
        process.exit(0);
      } catch (e) {
        console.log('Connection failed to', addr.address, e.message);
      }
    }
  }
});
