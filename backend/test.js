const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'wawan',
  database: 'mesra_monitoring',
});

async function run() {
  await client.connect();
  const res2 = await client.query('SELECT * FROM uptime_daily_summary');
  console.log('Uptime Daily Summaries:', res2.rows);
  await client.end();
}

run().catch(console.error);
