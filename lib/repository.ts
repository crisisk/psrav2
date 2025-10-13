import { query } from '@/lib/db';
import {
  addMockCertificate,
  computeMockAnalytics,
  findMockCertificate,
  getMockCertificates,
} from '@/lib/mock-data';
import type { MockCertificateResult } from '@/lib/mock-data';
import { isDatabaseEnabled } from '@/lib/config';
import type { MockCertificate } from '@/lib/mock-data';

export const CERTIFICATE_STATUSES = ['pending', 'processing', 'done', 'failed'] as const;

export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

interface CertificateParams {
  status?: CertificateStatus;
  hs6?: string;
  agreement?: string;
  page?: number;
  pageSize?: number;
}

export interface Certificate {
  id: string;
  productSku: string;
  hs6: string;
  agreement: string;
  status: CertificateStatus;
  result?: unknown;
  createdAt: string;
  updatedAt: string;
}

interface CreateCertificateParams {
  productSku: string;
  hs6: string;
  agreement: string;
  status: CertificateStatus;
  result?: unknown;
}

interface UpdateCertificateParams {
  status?: CertificateStatus;
  result?: unknown;
}

function mapCertificate(row: any): Certificate | null {
  if (!row) {
    return null;
  }

  let parsedResult: unknown | undefined;
  if (row.result !== undefined && row.result !== null) {
    if (typeof row.result === 'string') {
      try {
        parsedResult = JSON.parse(row.result);
      } catch (error) {
        console.error('Error parsing certificate result JSON:', error);
        parsedResult = row.result;
      }
    } else {
      parsedResult = row.result;
    }
  }

  const createdAt = row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt;
  const updatedAt = row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt;

  const status = CERTIFICATE_STATUSES.includes(row.status as CertificateStatus)
    ? (row.status as CertificateStatus)
    : 'pending';

  return {
    id: row.id,
    productSku: row.productSku,
    hs6: row.hs6,
    agreement: row.agreement,
    status,
    result: parsedResult,
    createdAt,
    updatedAt
  };
}

function mapMockCertificate(certificate: MockCertificate): Certificate {
  return {
    id: certificate.id,
    productSku: certificate.productSku,
    hs6: certificate.hs6,
    agreement: certificate.agreement,
    status: certificate.status,
    result: certificate.result,
    createdAt: certificate.createdAt,
    updatedAt: certificate.createdAt,
  };
}

function lim(page: number, pageSize: number) {
  const p = Math.max(1, page || 1);
  const ps = Math.min(200, Math.max(1, pageSize || 25));
  return { limit: ps, offset: (p - 1) * ps };
}

export async function listCertificates(
  params: CertificateParams
): Promise<{ items: Certificate[]; total: number }> {
  const where: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (params.status) {
    where.push(`status = $${i++}`);
    values.push(params.status);
  }
  if (params.hs6) {
    where.push(`hs6 = $${i++}`);
    values.push(params.hs6);
  }
  if (params.agreement) {
    where.push(`agreement = $${i++}`);
    values.push(params.agreement);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { limit, offset } = lim(params.page || 1, params.pageSize || 25);

  const selectSql = `
    SELECT id, "productSku", hs6, agreement, status, result, "createdAt", "updatedAt"
    FROM certificates
    ${whereSql}
    ORDER BY "createdAt" DESC
    LIMIT $${i} OFFSET $${i + 1}
  `;

  const selectParams = [...values, limit, offset];
  const countSql = `
    SELECT COUNT(*)::int AS count
    FROM certificates
    ${whereSql}
  `;

  try {
    const [rowsResult, countResult] = await Promise.all([
      query(selectSql, selectParams),
      query(countSql, values)
    ]);

    const items = (rowsResult.rows || [])
      .map((row: any) => mapCertificate(row))
      .filter((item): item is Certificate => item !== null);

    const rawCount = countResult.rows?.[0]?.count;
    const total = typeof rawCount === 'number' ? rawCount : Number.parseInt(rawCount ?? '0', 10);

    return { items, total };
  } catch (error) {
    console.error('Error listing certificates:', error);

    const mock = getMockCertificates().filter((certificate) => {
      if (params.status && certificate.status !== params.status) {
        return false;
      }
      if (params.hs6 && certificate.hs6 !== params.hs6) {
        return false;
      }
      if (params.agreement && certificate.agreement !== params.agreement) {
        return false;
      }
      return true;
    });

    const page = params.page || 1;
    const pageSize = params.pageSize || 25;
    const start = (page - 1) * pageSize;
    const items = mock.slice(start, start + pageSize);

    return { items: items.map(mapMockCertificate), total: mock.length };
  }
}

export async function getCertificateById(id: string): Promise<Certificate | null> {
  const sql = 'SELECT * FROM certificates WHERE id = $1 LIMIT 1';
  try {
    const result = await query(sql, [id]);
    return mapCertificate(result.rows?.[0]);
  } catch (error) {
    console.error('Error getting certificate:', error);
  }

  const mock = findMockCertificate(id);
  return mock ? mapMockCertificate(mock) : null;
}

export async function findCertificateByDetails(
  productSku: string,
  hs6: string,
  agreement: string
): Promise<Certificate | null> {
  const sql = `
    SELECT id, "productSku", hs6, agreement, status, result, "createdAt", "updatedAt"
    FROM certificates
    WHERE "productSku" = $1 AND hs6 = $2 AND agreement = $3
    ORDER BY "updatedAt" DESC
    LIMIT 1
  `;

  try {
    const result = await query(sql, [productSku, hs6, agreement]);
    return mapCertificate(result.rows?.[0]);
  } catch (error) {
    console.error('Error finding certificate:', error);
    return null;
  }
}

export async function createCertificate(
  params: CreateCertificateParams
): Promise<Certificate | null> {
  if (!CERTIFICATE_STATUSES.includes(params.status)) {
    throw new Error(`Invalid certificate status: ${params.status}`);
  }

  if (!isDatabaseEnabled) {
    const fallback = addMockCertificate({
      productSku: params.productSku,
      hs6: params.hs6,
      agreement: params.agreement,
      status: params.status,
      result: (params.result ?? undefined) as MockCertificateResult | undefined,
    });
    return mapMockCertificate(fallback);
  }

  const sql = `
    INSERT INTO certificates ("productSku", hs6, agreement, status, result, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    RETURNING id, "productSku", hs6, agreement, status, result, "createdAt", "updatedAt"
  `;

  const serializedResult =
    params.result === null || params.result === undefined
      ? null
      : typeof params.result === 'string'
        ? params.result
        : JSON.stringify(params.result);

  const values = [
    params.productSku,
    params.hs6,
    params.agreement,
    params.status,
    serializedResult
  ];

  try {
    const result = await query(sql, values);
    return mapCertificate(result.rows?.[0]);
  } catch (error) {
    console.error('Error creating certificate:', error);
    const fallback = addMockCertificate({
      productSku: params.productSku,
      hs6: params.hs6,
      agreement: params.agreement,
      status: params.status,
      result: (params.result ?? undefined) as MockCertificateResult | undefined,
    });
    return mapMockCertificate(fallback);
  }
}

export async function updateCertificate(
  id: string,
  params: UpdateCertificateParams
): Promise<Certificate | null> {
  const sets: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (params.status !== undefined) {
    if (!CERTIFICATE_STATUSES.includes(params.status)) {
      throw new Error(`Invalid certificate status: ${params.status}`);
    }
    sets.push(`status = $${index++}`);
    values.push(params.status);
  }

  if (params.result !== undefined) {
    const serializedResult =
      params.result === null || params.result === undefined
        ? null
        : typeof params.result === 'string'
          ? params.result
          : JSON.stringify(params.result);

    sets.push(`result = $${index++}`);
    values.push(serializedResult);
  }

  if (!sets.length) {
    return getCertificateById(id);
  }

  sets.push(`"updatedAt" = NOW()`);

  const sql = `
    UPDATE certificates
    SET ${sets.join(', ')}
    WHERE id = $${index}
    RETURNING id, "productSku", hs6, agreement, status, result, "createdAt", "updatedAt"
  `;

  values.push(id);

  try {
    const result = await query(sql, values);
    return mapCertificate(result.rows?.[0]);
  } catch (error) {
    console.error('Error updating certificate:', error);
    throw error;
  }
}

export async function getTraceByRequestId(requestId: string) {
  // Mock data for now - in real implementation this would query trace tables
  const nodes = [
    { id: 'input', name: 'Input Product' },
    { id: 'rules', name: 'VHA Rules' },
    { id: 'calculation', name: 'Origin Calculation' },
    { id: 'result', name: 'Final Result' }
  ];
  
  const links = [
    { source: 'input', target: 'rules', value: 100 },
    { source: 'rules', target: 'calculation', value: 85 },
    { source: 'calculation', target: 'result', value: 92 }
  ];
  
  return { nodes, links };
}

export async function getKpis() {
  try {
    // Get today's certificates
    const todayResult = await query(
      `SELECT COUNT(*)::int AS cnt FROM certificates WHERE DATE("createdAt") = CURRENT_DATE`
    );
    
    // Get pending requests
    const pendingResult = await query(
      `SELECT COUNT(*)::int AS cnt FROM certificates WHERE status = 'pending'`
    );
    
    // Calculate AI accuracy from completed certificates
    const accuracyResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN (result->>'isConform')::boolean = true THEN 1 END) as conform_count,
        AVG((result->>'confidence')::float) as avg_confidence
       FROM certificates 
       WHERE status = 'done' AND result IS NOT NULL`
    );
    
    const accuracy = accuracyResult.rows?.[0];
    const aiAccuracy = accuracy?.total > 0 ? 
      (accuracy.conform_count / accuracy.total) * (accuracy.avg_confidence || 1) : 0;
    
    // Calculate manhours reduction (based on processing efficiency)
    const efficiencyResult = await query(
      `SELECT 
        COUNT(CASE WHEN status = 'done' THEN 1 END) as completed,
        COUNT(*) as total
       FROM certificates`
    );
    
    const efficiency = efficiencyResult.rows?.[0];
    const manhourReduction = efficiency?.total > 0 ? 
      (efficiency.completed / efficiency.total) * 0.785 : 0;
    
    return {
      certificates_today: todayResult.rows?.[0]?.cnt || 0,
      pending_requests: pendingResult.rows?.[0]?.cnt || 0,
      ai_accuracy_pct: Number(aiAccuracy.toFixed(3)) || 0,
      manhours_reduction_pct: Number(manhourReduction.toFixed(3)) || 0
    };
  } catch (error) {
    console.error('Error getting KPIs:', error);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    const mock = computeMockAnalytics(startDate, endDate);
    const summary = mock.summary;
    const conformity = mock.certificates.conformityRate;

    const accuracyMultiplier = conformity.total > 0 ? conformity.conforming / conformity.total : 0;
    const aiAccuracy = accuracyMultiplier * (conformity.avg_confidence || 1);

    const total = summary.total_certificates;
    const manhourReduction = total > 0 ? (summary.completed_certificates / total) * 0.785 : 0;

    return {
      certificates_today: summary.completed_certificates,
      pending_requests: summary.pending_certificates,
      ai_accuracy_pct: Number(aiAccuracy.toFixed(3)) || 0,
      manhours_reduction_pct: Number(manhourReduction.toFixed(3)) || 0,
    };
  }
}
