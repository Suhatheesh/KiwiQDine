const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
  try {
    await client.connect();
    console.log('Connected to DB');

    const tableRes = await client.query(`
      SELECT to_regclass('public.tenants');
    `);

    console.log('Table exists check:', tableRes.rows);

    if (tableRes.rows[0].to_regclass) {
      const colRes = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'tenants';
      `);

      console.log('Columns in tenants table:', colRes.rows.map(r => r.column_name));

      try {
        const searchRes = await client.query(`SELECT id, name FROM tenants LIMIT 1`);
        console.log('Sample data:', searchRes.rows);
      } catch (queryError) {
        console.log('Sample query FAILED:', queryError.message);
      }
    } else {
      console.log('Table tenants NOT FOUND');
    }
  } catch (err) {
    console.error('Connection Error:', err);
  } finally {
    await client.end();
  }
}

checkColumns();