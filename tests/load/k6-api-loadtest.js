// K6 Load Test for Zizo NetVerse API
// Run with: k6 run k6-api-loadtest.js

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Define custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const successCounter = new Counter('successful_requests');
const activeConnections = new Gauge('active_connections');

export const options = {
  // Ramping VU test with stages
  stages: [
    { duration: '30s', target: 10 },    // Ramp-up
    { duration: '1m', target: 50 },     // Steady state
    { duration: '30s', target: 100 },   // Spike
    { duration: '1m', target: 50 },     // Recovery
    { duration: '30s', target: 0 },     // Ramp-down
  ],
  thresholds: {
    'api_duration': ['p(95)<500', 'p(99)<2000'],
    'errors': ['rate<0.1'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
  };

  group('Device Discovery API', () => {
    const discoverRes = http.get(`${BASE_URL}/devices/discover`, { headers });
    
    const success = check(discoverRes, {
      'device discovery status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has devices': (r) => r.body.includes('devices'),
    });
    
    apiDuration.add(discoverRes.timings.duration);
    errorRate.add(!success);
    if (success) successCounter.add(1);
    
    sleep(1);
  });

  group('Network Logs API', () => {
    const logsRes = http.get(`${BASE_URL}/network/logs?limit=100`, { headers });
    
    const success = check(logsRes, {
      'network logs status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    
    apiDuration.add(logsRes.timings.duration);
    errorRate.add(!success);
    if (success) successCounter.add(1);
    
    sleep(1);
  });

  group('Threat Intelligence API', () => {
    const threatRes = http.get(`${BASE_URL}/threat-intelligence/latest`, { headers });
    
    const success = check(threatRes, {
      'threat intelligence status is 200': (r) => r.status === 200,
      'response time < 800ms': (r) => r.timings.duration < 800,
    });
    
    apiDuration.add(threatRes.timings.duration);
    errorRate.add(!success);
    if (success) successCounter.add(1);
    
    sleep(1);
  });

  group('AI Analysis - Incident Report', () => {
    const payload = JSON.stringify({
      incident_id: `INC-LOAD-${__VU}-${__ITER}`,
      title: 'Load test incident',
      description: 'Synthetic incident for load testing',
      severity: 'medium',
      incident_type: 'load-test',
      affected_assets: ['192.168.1.1'],
      threat_indicators: [],
      recommendations: ['Monitor'],
      detection_method: 'Load Test',
    });

    const reportRes = http.post(
      `${BASE_URL}/ai-analysis/incident-report`,
      payload,
      { headers }
    );

    const success = check(reportRes, {
      'incident report status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    apiDuration.add(reportRes.timings.duration);
    errorRate.add(!success);
    if (success) successCounter.add(1);
    
    sleep(1);
  });

  group('Firewall Control - Rate Limiting', () => {
    for (let i = 0; i < 10; i++) {
      const blockPayload = JSON.stringify({
        ip: `192.168.1.${i}`,
        protocol: 'tcp',
        description: `Load test block attempt ${i}`,
      });

      const blockRes = http.post(
        `${BASE_URL}/control/block-ip`,
        blockPayload,
        { headers }
      );

      const isRateLimited = blockRes.status === 429;
      const success = blockRes.status === 200 || isRateLimited;
      
      check(blockRes, {
        'firewall endpoint responsive': () => success,
        'rate limiting active': () => isRateLimited || i < 5,
      });

      apiDuration.add(blockRes.timings.duration);
      errorRate.add(!success);
      if (success) successCounter.add(1);
    }
    sleep(1);
  });

  activeConnections.set(__VU);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'tests/results/k6-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options = {}) {
  const { indent = '', enableColors = false } = options;
  let summary = '\n';
  summary += `${indent}K6 Load Test Results\n`;
  summary += `${indent}${'='.repeat(50)}\n`;

  if (data.metrics) {
    Object.entries(data.metrics).forEach(([name, value]) => {
      if (value.values) {
        summary += `${indent}${name}:\n`;
        Object.entries(value.values).forEach(([key, val]) => {
          summary += `${indent}  ${key}: ${val}\n`;
        });
      }
    });
  }

  return summary;
}
