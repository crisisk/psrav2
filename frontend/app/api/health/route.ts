import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cacheService } from '@/lib/cache-service';
import {
  config,
  isDatabaseEnabled,
  isNotificationEnabled,
  isRedisEnabled,
  isTaskQueueEnabled,
} from '@/lib/config';
import { taskQueue } from '@/lib/task-queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();

  const database = {
    enabled: isDatabaseEnabled,
    ok: false,
    latencyMs: null as number | null,
    message: '',
  };

  if (isDatabaseEnabled()) {
    const start = performance.now();
    try {
      const result = await query('SELECT NOW()::text AS now');
      database.ok = true;
      database.latencyMs = Math.round(performance.now() - start);
      database.message = result.rows?.[0]?.now ?? 'connected';
    } catch (error) {
      database.ok = false;
      database.message = (error as Error).message;
    }
  } else {
    database.message = 'DATABASE_URL not configured';
  }

  const cacheStats = await (cacheService as any).getStats?.() || { hits: 0, misses: 0, size: 0, redisConnected: false, memoryCacheSize: 0 };
  const queueStatus = await (taskQueue as any).getStatus?.() || { pending: 0, active: 0, completed: 0 };

  const cache = {
    enabled: isRedisEnabled,
    connected: cacheStats.redisConnected,
    memoryEntries: cacheStats.memoryCacheSize,
  };

  const notifications = {
    enabled: isNotificationEnabled,
  };

  const ok = [
    !database.enabled || database.ok,
    !cache.enabled || cache.connected,
    !isTaskQueueEnabled || queueStatus.connected,
  ].every(Boolean);

  return NextResponse.json({
    ok,
    timestamp: now.toISOString(),
    environment: {
      nodeVersion: process.version,
      redisUrl: (config as any).redisUrl ? 'configured' : 'not-configured',
      taricApiBase: (config as any).taricApiBase ?? 'default',
    },
    database,
    cache,
    taskQueue: {
      enabled: isTaskQueueEnabled,
      connected: queueStatus.connected,
      queues: queueStatus.queues,
    },
    notifications,
  }, {
    status: ok ? 200 : 503,
  });
}
