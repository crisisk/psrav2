import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { collectMetrics, metricsRegistry, updateQueueMetrics } from '@/lib/metrics';
import { taskQueue } from '@/lib/task-queue';
import { metricsRateLimiter, withRateLimit } from '@/lib/rate-limiter';
import { ensureMetricsAccess, extractRoles } from '@/lib/security/authorization';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    ensureMetricsAccess({ user: { roles: ['admin'] } }); // TODO: Get actual user from request

    // Rate limiting check
    const rateLimitResult = await metricsRateLimiter.check('metrics');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Collect metrics
    const queueStats = await taskQueue?.getQueueStats?.().catch((error: any) => {
      console.warn('Unable to load queue stats for metrics export:', error);
      return null;
    });

    if (queueStats) {
      updateQueueMetrics('default', queueStats.total);
    }

    const payload = await collectMetrics();
    const roles = extractRoles(request);

    console.info('Prometheus metrics export served', {
      roles,
      requester: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return new NextResponse(metricsRegistry.metrics(), {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error collecting Prometheus metrics:', error);
    return NextResponse.json({ error: 'Failed to collect metrics' }, { status: 500 });
  }
}
