const { Pool } = require('pg');

function isProdLike() {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  const railwayEnv = (process.env.RAILWAY_ENVIRONMENT || '').toLowerCase();
  return nodeEnv === 'production' || railwayEnv === 'production';
}

const databaseUrl =
  process.env.DATABASE_URL ||
  (process.env.PGHOST
    ? undefined
    : 'postgres://postgres:postgres@localhost:5432/assetforu');

if (!databaseUrl && isProdLike()) {
  console.error('\n❌ FATAL ERROR: DATABASE_URL is not set.\n');
  process.exit(1);
}

const pool = new Pool(
  databaseUrl
    ? { connectionString: databaseUrl, ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined }
    : {
        host: process.env.PGHOST,
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
      }
);

const query = (text, params) => pool.query(text, params);

const connectDB = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] ✅ Postgres connected');
  } catch (err) {
    console.error('[DB] ❌ Postgres connection error:', err.message || err);
    process.exit(1);
  }
};

pool.on('error', (err) => {
  console.error('[DB] Postgres pool error:', err);
});

module.exports = { pool, query, connectDB };
