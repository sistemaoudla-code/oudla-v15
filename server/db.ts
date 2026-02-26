import * as schema from "@shared/schema";

const databaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL must be set.",
  );
}

let db: any;
let pool: any;

const pgModule = await import('pg');
const { drizzle } = await import('drizzle-orm/node-postgres');
const Pool = pgModule.default?.Pool || pgModule.Pool;

pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
});

db = drizzle(pool, { schema });

pool.on('error', (err: Error) => {
  console.error('❌ Unexpected pool error:', err);
});

try {
  await pool.query('SELECT 1');
  console.log('✅ Database connection successful (supabase)');
  await pool.query(`
    ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_weight integer;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_height integer;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_width integer;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_length integer;
  `);
} catch (error: any) {
  if (error.message?.includes('already exists')) {
  } else if (error.message?.includes('connect') || error.message?.includes('timeout')) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your SUPABASE_DATABASE_URL configuration');
  } else {
    console.warn('⚠️ Auto-migration:', error.message);
  }
}

export { db, pool };
