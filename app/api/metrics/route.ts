import { NextResponse } from 'next/server';

import { collectMetrics, metricsRegistry, updateQueueMetrics } from '@/lib/metrics';
import { taskQueue } from '@/lib/task-queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const queueStats = await taskQueue.getQueueStats().catch((error) => {
      console.warn('Unable to load queue stats for metrics export:', error);
      return null;
    });

    updateQueueMetrics(queueStats);
    const payload = await collectMetrics();

    return new NextResponse(payload, {
      status: 200,
      headers: { 'Content-Type': metricsRegistry.contentType },
    });
  } catch (error) {
    console.error('Error collecting Prometheus metrics:', error);
    return NextResponse.json({ error: 'Failed to collect metrics' }, { status: 500 });
  }
}
