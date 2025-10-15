/** 
 * Metrics collection module for Next.js applications
 * @module Metrics
 */

interface MetricData {
  id: string
  name: string
  timestamp: number
  value: number
  tags?: Record<string, string>
  metadata?: Record<string, unknown>
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

const DEFAULT_ENDPOINT = 'https://metrics.example.com/v1/ingest'

/**
 * Validates metric data structure
 * @param {MetricData} data - Metric payload to validate
 * @returns {ValidationResult} Validation result with errors array
 */
export function validateMetric(data: MetricData): ValidationResult {
  const errors: string[] = []
  
  if (!data.id) errors.push('Missing required field: id')
  if (!data.name) errors.push('Missing required field: name')
  if (!data.timestamp) errors.push('Missing required field: timestamp')
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sends metrics to collection service
 * @param {MetricData} data - Validated metric data
 * @param {string} endpoint - Metrics collection endpoint
 * @returns {Promise<boolean>} Success status
 */
export async function sendMetricToService(data: MetricData, endpoint: string = DEFAULT_ENDPOINT): Promise<boolean> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return true
  } catch (error) {
    console.error('Failed to send metric:', error)
    return false
  }
}

/**
 * Generates metric ID with prefix
 * @param {string} prefix - ID prefix
 * @returns {string} Generated metric ID
 */
export function generateMetricId(prefix: string = 'metric'): string {
  const timestamp = Date.now().toString(16)
  const random = crypto.getRandomValues(new Uint8Array(4))
  return `${prefix}_${timestamp}_${Array.from(random).map(b => b.toString(16)).join('')}`
}

export default class Metrics {
  private static instance: Metrics

  private constructor() {}

  /**
   * Get singleton instance
   * @returns {Metrics} Metrics instance
   */
  static getInstance(): Metrics {
    if (!Metrics.instance) {
      Metrics.instance = new Metrics()
    }
    return Metrics.instance
  }

  /**
   * Send metric with validation
   * @param {MetricData} data - Metric data to send
   * @returns {Promise<void>}
   */
  async send(data: MetricData): Promise<void> {
    const validation = validateMetric(data)
    if (!validation.isValid) {
      throw new Error(`Invalid metric data: ${validation.errors.join(', ')}`)
    }

    const success = await sendMetricToService(data)
    if (!success) {
      throw new Error('Failed to send metric to service')
    }
  }
}

/**
 * Record origin calculation failure
 */
export function recordOriginFailure(error: any): void {
  console.log('[Metrics] Record origin failure:', error);
}


/**
 * Record origin calculation success
 */
export function recordOriginCalculation(data: any): void {
  console.log('[Metrics] Record origin calculation:', data);
}


/**
 * Update queue metrics
 */
export function updateQueueMetrics(queueName: string, size: number): void {
  console.log('[Metrics] Update queue:', queueName, size);
}

/**
 * Collect all metrics
 */
export async function collectMetrics(): Promise<any> {
  console.log('[Metrics] Collect all metrics');
  return {
    timestamp: new Date().toISOString(),
    metrics: {}
  };
}

/**
 * Metrics registry for Prometheus
 */
export const metricsRegistry = {
  metrics: () => {
    return 'psra_metrics_total 0\n';
  },

  register: (metric: any) => {
    console.log('[Metrics Registry] Register metric:', metric);
  }
};
