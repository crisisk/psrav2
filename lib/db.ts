import { Pool } from 'pg';
import { config, isDatabaseEnabled } from './config';

let pool: Pool | null = null;
let poolPromise: Promise<Pool> | null = null;

const createPool = async () => {
  if (!isDatabaseEnabled || !config.databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.pgSsl
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
    });

    pool.on('error', (error) => {
      console.error('PostgreSQL connection error:', error);
    });
  }

  return pool;
};

const getPool = async () => {
  if (!poolPromise) {
    poolPromise = createPool();
  }
  return poolPromise;
};

export async function query(text: string, params: any[] = []) {
  const client = await getPool();
  return client.query(text, params);
}

export { pool };
