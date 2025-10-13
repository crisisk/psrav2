import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const customTrend = new Trend('custom_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '20s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.1'],                   // Error rate should be less than 10%
    errors: ['rate<0.1'],                            // Custom error rate below 10%
    'http_req_duration{type:health}': ['p(95)<200'], // Health checks should be fast
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1: Health check endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`, {
    tags: { type: 'health' },
  });

  const healthCheck = check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
    'health response has valid body': (r) => r.body && r.body.length > 0,
  });

  errorRate.add(!healthCheck);
  customTrend.add(healthRes.timings.duration);

  sleep(1);

  // Test 2: Home page
  const homeRes = http.get(`${BASE_URL}/`, {
    tags: { type: 'homepage' },
  });

  const homeCheck = check(homeRes, {
    'home status is 200': (r) => r.status === 200,
    'home response time < 500ms': (r) => r.timings.duration < 500,
    'home has content': (r) => r.body && r.body.length > 1000,
  });

  errorRate.add(!homeCheck);

  sleep(2);

  // Test 3: API endpoint (if exists)
  const apiRes = http.get(`${BASE_URL}/api/v1/status`, {
    tags: { type: 'api' },
  });

  check(apiRes, {
    'api is accessible': (r) => r.status === 200 || r.status === 404,
    'api response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'k6-summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options?.indent || '';
  const enableColors = options?.enableColors || false;

  let summary = '\n' + indent + '=== Performance Test Summary ===\n';

  // HTTP metrics
  if (data.metrics.http_req_duration) {
    summary += indent + 'HTTP Request Duration:\n';
    summary += indent + `  avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += indent + `  p(95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += indent + `  p(99): ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  }

  // Error rate
  if (data.metrics.http_req_failed) {
    const errorRate = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += indent + `Error Rate: ${errorRate}%\n`;
  }

  // VUs
  if (data.metrics.vus) {
    summary += indent + `Virtual Users: ${data.metrics.vus.values.max}\n`;
  }

  // Requests
  if (data.metrics.http_reqs) {
    summary += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  }

  summary += indent + '================================\n';

  return summary;
}
