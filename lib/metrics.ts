import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

const registry = new Registry();

collectDefaultMetrics({ register: registry });

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normaliseLabelValue = (value: string): string => {
  if (!value) {
    return 'unknown';
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'unknown';
};

const originRequestCounter = new Counter({
  name: 'origin_calculation_requests_total',
  help: 'Total number of origin calculation requests processed.',
  labelNames: ['trade_agreement', 'result'],
  registers: [registry],
});

const originFailureCounter = new Counter({
  name: 'origin_calculation_failures_total',
  help: 'Number of origin calculation attempts that failed before completion.',
  labelNames: ['reason'],
  registers: [registry],
});

const originDurationHistogram = new Histogram({
  name: 'origin_calculation_duration_ms',
  help: 'Execution time for origin calculations in milliseconds.',
  labelNames: ['trade_agreement', 'result'],
  buckets: [25, 50, 100, 200, 400, 800, 1600, 3200, 6400],
  registers: [registry],
});

const originConfidenceHistogram = new Histogram({
  name: 'origin_calculation_confidence',
  help: 'Distribution of confidence scores returned by the origin engine.',
  labelNames: ['trade_agreement', 'result'],
  buckets: [0.1, 0.25, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  registers: [registry],
});

const originConsensusHistogram = new Histogram({
  name: 'origin_consensus_score',
  help: 'Distribution of AI consensus scores for origin calculations.',
  labelNames: ['trade_agreement'],
  buckets: [0.1, 0.25, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  registers: [registry],
});

const originHumanReviewCounter = new Counter({
  name: 'origin_calculation_human_review_total',
  help: 'Number of origin calculations escalated to human review.',
  labelNames: ['trade_agreement'],
  registers: [registry],
});

const originConformRateGauge = new Gauge({
  name: 'origin_is_conform_rate',
  help: 'Rolling ratio of conform origin decisions versus all processed calculations.',
  registers: [registry],
});

const originConfidenceAverageGauge = new Gauge({
  name: 'origin_confidence_avg',
  help: 'Rolling average confidence across processed origin calculations.',
  registers: [registry],
});

const queueGauge = new Gauge({
  name: 'origin_queue_jobs',
  help: 'Number of jobs per queue segmented by state.',
  labelNames: ['queue', 'state'],
  registers: [registry],
});

const humanReviewBacklogGauge = new Gauge({
  name: 'origin_human_review_backlog',
  help: 'Total number of human review jobs waiting or being processed.',
  registers: [registry],
});

let totalCalculations = 0;
let conformCalculations = 0;
let cumulativeConfidence = 0;

interface OriginCalculationMetricInput {
  tradeAgreement: string;
  durationMs: number;
  isConform: boolean;
  confidence: number;
  consensusScore?: number | null;
  humanReviewRequired?: boolean;
}

export function recordOriginCalculation(metrics: OriginCalculationMetricInput): void {
  const tradeAgreementLabel = normaliseLabelValue(metrics.tradeAgreement);
  const resultLabel = metrics.isConform ? 'conform' : 'non_conform';

  totalCalculations += 1;
  if (metrics.isConform) {
    conformCalculations += 1;
  }
  cumulativeConfidence += clamp(metrics.confidence, 0, 1);

  const conformRate = totalCalculations > 0 ? conformCalculations / totalCalculations : 0;
  const averageConfidence = totalCalculations > 0 ? cumulativeConfidence / totalCalculations : 0;

  originRequestCounter.inc({ trade_agreement: tradeAgreementLabel, result: resultLabel });
  originDurationHistogram.observe({ trade_agreement: tradeAgreementLabel, result: resultLabel }, metrics.durationMs);
  originConfidenceHistogram.observe({ trade_agreement: tradeAgreementLabel, result: resultLabel }, clamp(metrics.confidence, 0, 1));

  originConformRateGauge.set(conformRate);
  originConfidenceAverageGauge.set(averageConfidence);

  if (typeof metrics.consensusScore === 'number') {
    originConsensusHistogram.observe({ trade_agreement: tradeAgreementLabel }, clamp(metrics.consensusScore, 0, 1));
  }

  if (metrics.humanReviewRequired) {
    originHumanReviewCounter.inc({ trade_agreement: tradeAgreementLabel });
  }
}

export function recordOriginFailure(reason: string): void {
  originFailureCounter.inc({ reason: normaliseLabelValue(reason) });
}

export function updateQueueMetrics(stats: Record<string, any> | undefined | null): void {
  queueGauge.reset();
  humanReviewBacklogGauge.set(0);

  if (!stats || stats.enabled === false) {
    return;
  }

  for (const [queueName, data] of Object.entries(stats)) {
    if (!data || typeof data !== 'object') {
      continue;
    }

    const queueLabel = normaliseLabelValue(queueName);
    const waiting = Number.isFinite(data.waiting) ? data.waiting : 0;
    const active = Number.isFinite(data.active) ? data.active : 0;
    const completed = Number.isFinite(data.completed) ? data.completed : 0;
    const failed = Number.isFinite(data.failed) ? data.failed : 0;

    queueGauge.set({ queue: queueLabel, state: 'waiting' }, waiting);
    queueGauge.set({ queue: queueLabel, state: 'active' }, active);
    queueGauge.set({ queue: queueLabel, state: 'completed' }, completed);
    queueGauge.set({ queue: queueLabel, state: 'failed' }, failed);

    if (queueLabel === 'human') {
      humanReviewBacklogGauge.set(waiting + active);
    }
  }
}

export async function collectMetrics(): Promise<string> {
  return registry.metrics();
}

export const metricsRegistry = registry;
