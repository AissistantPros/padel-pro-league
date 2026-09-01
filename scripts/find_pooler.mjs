import pg from 'pg';
const { Client } = pg;

const hosts = [
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com'
];

async function tryPoolers() {
  for (const host of hosts) {
    const conn = `postgresql://postgres.unekabiokuevtiyjziof:Bi3EC7%23CqY2xc%3F.@${host}:6543/postgres`;
    console.log('Testing host:', host);
    const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 3000 });
    try {
      await client.connect();
      console.log('🎉 CONNECTED SUCCESSFULLY TO:', host);
      await client.end();
      return host;
    } catch (e) {
      console.log('Failed for', host, e.message);
    }
  }
}

tryPoolers();
