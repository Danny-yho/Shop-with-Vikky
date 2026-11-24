const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../utils/config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function one(text, params = []) {
  const result = await query(text, params);
  return result.rows[0];
}

async function many(text, params = []) {
  const result = await query(text, params);
  return result.rows;
}

async function withTransaction(work) {
  const client = await pool.connect();
  const tx = {
    query: (text, params = []) => client.query(text, params),
    one: async (text, params = []) => (await client.query(text, params)).rows[0],
    many: async (text, params = []) => (await client.query(text, params)).rows
  };
  try {
    await client.query('BEGIN');
    const value = await work(tx);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* connection already failed */ }
    throw error;
  } finally {
    client.release();
  }
}

async function initDb() {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  await pool.query(
    'UPDATE settings SET value = $1 WHERE key = $2 AND value = $3',
    ['“Style you love, delivered quickly and reliably.”', 'announcement', 'Free delivery on orders above ₦50,000']
  );
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, one, many, withTransaction, initDb, close };
