/**
 * Repository pattern for data access
 * Abstracts database operations
 */

import { query } from './db';

export interface Repository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export class BaseRepository<T> implements Repository<T> {
  constructor(private tableName: string) {}

  async findAll(): Promise<T[]> {
    const result = await query<T>(`SELECT * FROM ${this.tableName}`);
    return result.rows;
  }

  async findById(id: string): Promise<T | null> {
    return await query.queryOne<T>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
  }

  async create(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const result = await query.queryOne<T>(
      `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return result!;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const result = await query.queryOne<T>(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result!;
  }

  async delete(id: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rowCount > 0;
  }
}

// Certificate Repository
export const certificateRepository = new BaseRepository('certificates');

// Supplier Repository
export const supplierRepository = new BaseRepository('suppliers');

// Product Repository
export const productRepository = new BaseRepository('products');

/**
 * Get trace by request ID for debugging and audit purposes
 * @param requestId - The unique request ID to trace
 * @returns Promise resolving to trace data or null
 */
export async function getTraceByRequestId(requestId: string): Promise<any | null> {
  try {
    const result = await query.queryOne(
      'SELECT * FROM request_traces WHERE request_id = $1',
      [requestId]
    );
    return result;
  } catch (error) {
    console.error('Failed to get trace by request ID:', error);
    return null;
  }
}

export default {
  certificate: certificateRepository,
  supplier: supplierRepository,
  product: productRepository,
  getTraceByRequestId
};


/**
 * Find certificate by product details
 */
export async function findCertificateByDetails(productSku: string, hsCode: string, tradeAgreement: string): Promise<any | null> {
  console.log('[Repository] Find certificate by details:', { productSku, hsCode, tradeAgreement });
  return null;
}


/**
 * Update certificate
 */
export async function updateCertificate(id: string, data: any): Promise<any> {
  console.log('[Repository] Update certificate:', id, data);
  return { id, ...data };
}


/**
 * Create new certificate
 */
export async function createCertificate(data: any): Promise<any> {
  console.log('[Repository] Create certificate:', data);
  return { id: `cert-${Date.now()}`, ...data };
}


/**
 * Get KPIs from database
 */
export async function getKpis(filters?: any): Promise<any[]> {
  try {
    // TODO: Implement actual KPI query
    return [
      { id: '1', name: 'Total Certificates', value: 127, trend: '+12%' },
      { id: '2', name: 'Pending Approvals', value: 12, trend: '-5%' },
      { id: '3', name: 'Compliance Score', value: 92.5, trend: '+2%' }
    ];
  } catch (error) {
    console.error('Failed to get KPIs:', error);
    return [];
  }
}

/**
 * Get certificate by ID
 */
export async function getCertificateById(id: string): Promise<any | null> {
  return certificateRepository.findById(id);
}

/**
 * List certificates with filters
 */
export async function listCertificates(filters?: any): Promise<{ items: any[], total: number }> {
  const items = await certificateRepository.findAll();
  return { items, total: items.length };
}

/**
 * Certificate status constants
 */
export const CERTIFICATE_STATUSES = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'expired'
] as const;
