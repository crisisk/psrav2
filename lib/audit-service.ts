import { Pool } from 'pg';
import type { QueryResult } from 'pg';
import { cacheService } from './cache-service';
import {
  config,
  isAuditLogEnabled,
  isNotificationEnabled,
} from './config';
import { notificationService } from './notification-service';

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp?: Date;
  success: boolean;
  errorMessage?: string;
  performanceMs?: number;
}

export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'permission_denied' | 'suspicious_activity' | 'data_access' | 'data_modification';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  details: any;
  timestamp?: Date;
}

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  timestamp?: Date;
}

interface MemoryStore {
  logs: AuditLogEntry[];
  security: SecurityEvent[];
  performance: PerformanceMetric[];
}

const MEMORY_LIMIT = 500;

export class AuditService {
  private pool: Pool | null = null;
  private readonly enabled = isAuditLogEnabled && Boolean(config.databaseUrl);
  private ready: Promise<void> | null = null;
  private memory: MemoryStore = {
    logs: [],
    security: [],
    performance: [],
  };

  constructor() {
    if (this.enabled && config.databaseUrl) {
      this.pool = new Pool({
        connectionString: config.databaseUrl,
        ssl: config.pgSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
      });

      this.pool.on('error', (error) => {
        console.error('Audit service database error:', error);
      });

      this.ready = this.initializeAuditTables();
    }
  }

  private async ensureReady(): Promise<boolean> {
    if (!this.pool || !this.ready) {
      return false;
    }

    try {
      await this.ready;
      return true;
    } catch (error) {
      console.error('Audit table initialisation failed:', error);
      this.pool = null;
      return false;
    }
  }

  private async initializeAuditTables(): Promise<void> {
    if (!this.pool) {
      return;
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255),
        user_email VARCHAR(255),
        action VARCHAR(255) NOT NULL,
        resource VARCHAR(255) NOT NULL,
        resource_id VARCHAR(255),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        session_id VARCHAR(255),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        success BOOLEAN NOT NULL,
        error_message TEXT,
        performance_ms INTEGER
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        user_id VARCHAR(255),
        ip_address INET,
        details JSONB NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        response_time INTEGER NOT NULL,
        status_code INTEGER NOT NULL,
        user_id VARCHAR(255),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
    `);
  }

  private pushToMemory<T extends keyof MemoryStore>(key: T, value: MemoryStore[T][number]): void {
    const store = this.memory[key];
    store.push({ ...value, timestamp: value.timestamp ?? new Date() } as any);
    if (store.length > MEMORY_LIMIT) {
      store.splice(0, store.length - MEMORY_LIMIT);
    }
  }

  private async runQuery(sql: string, params: any[] = []): Promise<QueryResult | null> {
    if (!(await this.ensureReady()) || !this.pool) {
      return null;
    }

    try {
      return await this.pool.query(sql, params);
    } catch (error) {
      console.error('Audit query error, falling back to memory store:', error);
      this.pool = null;
      return null;
    }
  }

  async logAction(entry: AuditLogEntry): Promise<void> {
    const payload = {
      ...entry,
      timestamp: entry.timestamp ?? new Date(),
    };

    const result = await this.runQuery(
      `INSERT INTO audit_logs (
        user_id, user_email, action, resource, resource_id, details,
        ip_address, user_agent, session_id, success, error_message, performance_ms
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`
    , [
      payload.userId,
      payload.userEmail,
      payload.action,
      payload.resource,
      payload.resourceId,
      payload.details ? JSON.stringify(payload.details) : null,
      payload.ipAddress,
      payload.userAgent,
      payload.sessionId,
      payload.success,
      payload.errorMessage,
      payload.performanceMs,
    ]);

    if (!result) {
      this.pushToMemory('logs', payload);
    } else {
      await this.cacheRecentAuditLogs();
    }
  }

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const payload = {
      ...event,
      timestamp: event.timestamp ?? new Date(),
    };

    const result = await this.runQuery(
      `INSERT INTO security_events (event_type, severity, user_id, ip_address, details)
       VALUES ($1,$2,$3,$4,$5)`,
      [payload.type, payload.severity, payload.userId, payload.ipAddress, JSON.stringify(payload.details)]
    );

    if (!result) {
      this.pushToMemory('security', payload);
    } else if (payload.severity === 'high' || payload.severity === 'critical') {
      await this.sendSecurityAlert(payload);
    }
  }

  async logPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    const payload = {
      ...metric,
      timestamp: metric.timestamp ?? new Date(),
    };

    const result = await this.runQuery(
      `INSERT INTO performance_metrics (endpoint, method, response_time, status_code, user_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [payload.endpoint, payload.method, payload.responseTime, payload.statusCode, payload.userId]
    );

    if (!result) {
      this.pushToMemory('performance', payload);
    }

    if (payload.responseTime > 5000) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        userId: payload.userId,
        details: { type: 'slow_response', endpoint: payload.endpoint, responseTime: payload.responseTime },
      });
    }
  }

  async logOriginCalculation(
    userId: string | undefined,
    request: any,
    result: any,
    success: boolean,
    performanceMs: number,
    ipAddress?: string
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'origin_calculation',
      resource: 'certificate',
      resourceId: result?.certificateId,
      details: {
        hsCode: request.hsCode,
        tradeAgreement: request.tradeAgreement,
        productSku: request.productSku,
        isConform: result?.result?.isConform,
        confidence: result?.result?.confidence,
      },
      ipAddress,
      success,
      performanceMs,
    });
  }

  async logCertificateAccess(
    userId: string | undefined,
    certificateId: string,
    action: 'view' | 'download_pdf' | 'delete',
    success: boolean,
    ipAddress?: string
  ): Promise<void> {
    await this.logAction({
      userId,
      action: `certificate_${action}`,
      resource: 'certificate',
      resourceId: certificateId,
      ipAddress,
      success,
    });
  }

  async logDataAccess(
    userId: string | undefined,
    dataType: 'hs_codes' | 'trade_agreements' | 'origin_rules',
    query: string,
    resultCount: number,
    performanceMs: number,
    ipAddress?: string
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'data_access',
      resource: dataType,
      details: { query, resultCount },
      ipAddress,
      success: true,
      performanceMs,
    });
  }

  async logBulkImport(
    userId: string,
    importType: string,
    fileName: string,
    recordsProcessed: number,
    recordsSuccessful: number,
    recordsFailed: number,
    performanceMs: number
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'bulk_import',
      resource: importType,
      details: {
        fileName,
        recordsProcessed,
        recordsSuccessful,
        recordsFailed,
      },
      success: recordsFailed === 0,
      performanceMs,
    });
  }

  async getAuditSummary(days: number = 7): Promise<any[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.runQuery(
      `SELECT action, COUNT(*) as total_count,
              COUNT(*) FILTER (WHERE success = true) as success_count,
              COUNT(*) FILTER (WHERE success = false) as failure_count,
              AVG(performance_ms) as avg_performance_ms
       FROM audit_logs
       WHERE timestamp >= NOW() - INTERVAL '${days} days'
       GROUP BY action
       ORDER BY total_count DESC`
    );

    if (result) {
      return result.rows;
    }

    const grouped = new Map<string, { total: number; success: number; failure: number; performance: number; count: number }>();
    for (const log of this.memory.logs) {
      if ((log.timestamp ?? new Date()) < since) continue;
      const bucket = grouped.get(log.action) ?? { total: 0, success: 0, failure: 0, performance: 0, count: 0 };
      bucket.total += 1;
      bucket.success += log.success ? 1 : 0;
      bucket.failure += log.success ? 0 : 1;
      if (log.performanceMs) {
        bucket.performance += log.performanceMs;
        bucket.count += 1;
      }
      grouped.set(log.action, bucket);
    }

    return Array.from(grouped.entries()).map(([action, value]) => ({
      action,
      total_count: value.total,
      success_count: value.success,
      failure_count: value.failure,
      avg_performance_ms: value.count ? value.performance / value.count : null,
    }));
  }

  async getSecurityEventsSummary(days: number = 7): Promise<any[]> {
    const result = await this.runQuery(
      `SELECT event_type, severity, COUNT(*) as count, MAX(timestamp) as last_occurrence
       FROM security_events
       WHERE timestamp >= NOW() - INTERVAL '${days} days'
       GROUP BY event_type, severity
       ORDER BY count DESC`
    );

    if (result) {
      return result.rows;
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const grouped = new Map<string, { count: number; last: Date | null }>();
    for (const event of this.memory.security) {
      const ts = event.timestamp ?? new Date();
      if (ts < since) continue;
      const key = `${event.type}:${event.severity}`;
      const bucket = grouped.get(key) ?? { count: 0, last: null };
      bucket.count += 1;
      bucket.last = !bucket.last || bucket.last < ts ? ts : bucket.last;
      grouped.set(key, bucket);
    }

    return Array.from(grouped.entries()).map(([key, value]) => {
      const [event_type, severity] = key.split(':');
      return {
        event_type,
        severity,
        count: value.count,
        last_occurrence: value.last?.toISOString() ?? null,
      };
    });
  }

  async getPerformanceMetrics(days: number = 7): Promise<any[]> {
    const result = await this.runQuery(
      `SELECT endpoint, method, COUNT(*) as request_count,
              AVG(response_time) as avg_response_time,
              MIN(response_time) as min_response_time,
              MAX(response_time) as max_response_time
       FROM performance_metrics
       WHERE timestamp >= NOW() - INTERVAL '${days} days'
       GROUP BY endpoint, method
       ORDER BY request_count DESC`
    );

    if (result) {
      return result.rows;
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const grouped = new Map<string, { count: number; total: number; min: number; max: number }>();

    for (const metric of this.memory.performance) {
      if ((metric.timestamp ?? new Date()) < since) continue;
      const key = `${metric.endpoint}:${metric.method}`;
      const bucket = grouped.get(key) ?? { count: 0, total: 0, min: Infinity, max: 0 };
      bucket.count += 1;
      bucket.total += metric.responseTime;
      bucket.min = Math.min(bucket.min, metric.responseTime);
      bucket.max = Math.max(bucket.max, metric.responseTime);
      grouped.set(key, bucket);
    }

    return Array.from(grouped.entries()).map(([key, value]) => {
      const [endpoint, method] = key.split(':');
      return {
        endpoint,
        method,
        request_count: value.count,
        avg_response_time: value.count ? value.total / value.count : null,
        min_response_time: value.min === Infinity ? null : value.min,
        max_response_time: value.max || null,
      };
    });
  }

  async getUserActivity(userId: string, days: number = 30): Promise<any[]> {
    const result = await this.runQuery(
      `SELECT action, resource, COUNT(*) as count, MAX(timestamp) as last_activity,
              COUNT(*) FILTER (WHERE success = false) as failures
       FROM audit_logs
       WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '${days} days'
       GROUP BY action, resource
       ORDER BY count DESC`,
      [userId]
    );

    if (result) {
      return result.rows;
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const grouped = new Map<string, { resource: string; count: number; failures: number; last: Date | null }>();

    for (const log of this.memory.logs) {
      if ((log.timestamp ?? new Date()) < since || log.userId !== userId) continue;
      const key = `${log.action}:${log.resource}`;
      const bucket = grouped.get(key) ?? { resource: log.resource, count: 0, failures: 0, last: null };
      bucket.count += 1;
      bucket.failures += log.success ? 0 : 1;
      const ts = log.timestamp ?? new Date();
      bucket.last = !bucket.last || bucket.last < ts ? ts : bucket.last;
      grouped.set(key, bucket);
    }

    return Array.from(grouped.entries()).map(([key, value]) => ({
      action: key.split(':')[0],
      resource: value.resource,
      count: value.count,
      last_activity: value.last?.toISOString() ?? null,
      failures: value.failures,
    }));
  }

  async getRecentFailures(limit: number = 50): Promise<any[]> {
    const result = await this.runQuery(
      `SELECT user_id, user_email, action, resource, resource_id, error_message, timestamp, ip_address
       FROM audit_logs
       WHERE success = false
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit]
    );

    if (result) {
      return result.rows;
    }

    return this.memory.logs
      .filter((log) => !log.success)
      .slice(-limit)
      .reverse()
      .map((log) => ({
        user_id: log.userId,
        user_email: log.userEmail,
        action: log.action,
        resource: log.resource,
        resource_id: log.resourceId,
        error_message: log.errorMessage,
        timestamp: (log.timestamp ?? new Date()).toISOString(),
        ip_address: log.ipAddress,
      }));
  }

  private async cacheRecentAuditLogs(): Promise<void> {
    if (!(await this.ensureReady()) || !this.pool) {
      await cacheService.set('recent-audit-logs', this.memory.logs.slice(-100), 60);
      return;
    }

    const result = await this.pool.query(`
      SELECT * FROM audit_logs
      ORDER BY timestamp DESC
      LIMIT 100
    `);

    await cacheService.set('recent-audit-logs', result.rows, 60);
  }

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    if (!isNotificationEnabled) {
      return;
    }

    await notificationService.sendNotification({
      type: 'system_alert',
      title: `Security Alert: ${event.type}`,
      message: `Security event detected with severity ${event.severity}.`,
      data: event,
      priority: event.severity === 'critical' ? 'critical' : 'high',
    });
  }

  createAuditMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      const originalEnd = res.end;

      res.end = (...args: any[]) => {
        const performanceMs = Date.now() - startTime;
        this.logPerformanceMetric({
          endpoint: req.path || req.url,
          method: req.method,
          responseTime: performanceMs,
          statusCode: res.statusCode,
          userId: req.user?.id,
        }).catch((error) => console.error('Audit middleware error:', error));
        originalEnd.apply(res, args);
      };

      next();
    };
  }
}

export const auditService = new AuditService();
