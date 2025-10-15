import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

export async function query<T = any>(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Stub db export for Prisma-style interface
// TODO: Replace with actual Prisma client or proper ORM
export const db: any = {
  // Add table accessors as needed
  user: {},
  session: {},
  assessment: {},
  // etc.
};

// Also export prisma as an alias for compatibility
export const prisma = db;

// Export pool for direct database access
export { pool };
