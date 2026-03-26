# Medium Priority Implementations Guide

This guide documents the implementation of four medium-priority features for Zizo NetVerse:

1. **Load Testing** - Playwright + K6 load tests
2. **Database Persistence** - Firestore incident storage
3. **Monitoring & Logging** - OpenTelemetry integration
4. **Rate Limiting** - Redis-backed rate limiting

---

## 1. Load Testing (Playwright + K6)

### Overview
Comprehensive end-to-end and API load testing to verify performance under concurrent WebSocket connections and high request volumes.

### Files Created
- `tests/load/k6-api-loadtest.js` - K6 API load test
- `tests/e2e/websocket-3d-performance.spec.ts` - Playwright 3D visualization tests
- `playwright.config.ts` - Playwright configuration

### Usage

#### K6 API Load Testing
```bash
# Run K6 load test
k6 run tests/load/k6-api-loadtest.js

# With custom base URL
BASE_URL=http://localhost:8000/api/v1 k6 run tests/load/k6-api-loadtest.js

# With authentication
BASE_URL=http://localhost:8000/api/v1 AUTH_TOKEN=your-token k6 run tests/load/k6-api-loadtest.js
```

**Metrics Tracked:**
- API response times (p95, p99)
- Error rate
- Successful requests counter
- Active WebSocket connections

#### Playwright E2E Tests
```bash
# Install Playwright (if not already installed)
npm install @playwright/test

# Run all e2e tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run specific test
npx playwright test websocket-3d-performance
```

**Test Coverage:**
- Concurrent WebSocket connections (10 active)
- 3D scene rendering performance (FPS, frame time)
- Device node interaction responsiveness
- Memory leak detection
- Rendering optimization validation
- Network lag handling

#### CI/CD Integration
Tests are automatically triggered on push to `main` and `develop` branches in `.github/workflows/ci-cd.yml`

### Recommendations
- Schedule load tests weekly to track performance trends
- Monitor results for regressions
- Adjust thresholds based on SLA requirements
- Use results to plan capacity scaling

---

## 2. Database Persistence - Incident Reports

### Overview
Migrates incident reports from volatile in-memory storage to persistent Firestore database.

### Files Created/Modified
- `src/backend/services/incident_store_firestore.py` - Firestore implementation
- `src/backend/api_gateway/endpoints/ai_analysis_updated.py` - Updated endpoints with factory pattern
- `src/backend/scripts/migrate_incidents_to_firestore.py` - Migration tool

### Implementation Details

#### Firestore IncidentStore Features
- **Persistent Storage**: All incidents survive application restarts
- **Batch Operations**: Efficient bulk saves
- **Custom Queries**: Query by field, operator, and value
- **Export Functionality**: Backup incidents to JSON
- **TTL Management**: Automatic cleanup of old records

#### API Usage
```python
from services.incident_store_firestore import FirestoreIncidentStore

# Initialize (uses default Firebase credentials)
store = FirestoreIncidentStore()

# Save incident
store.save_incident(incident_report)

# Retrieve incident
incident = store.get_incident("INC-2026-001")

# List with filtering
incidents = store.list_incidents(severity_filter="high", limit=100)

# Batch save
store.batch_save_incidents(incident_list)

# Export to file
store.export_incidents("backup.json", severity_filter="critical")
```

### Deployment

#### Enable Firestore Storage
Set environment variable before startup:
```bash
export USE_FIRESTORE=true
python src/backend/main.py
```

#### Migration from In-Memory Storage
```bash
# Export existing incidents to JSON
python src/backend/scripts/migrate_incidents_to_firestore.py --export --output incidents.json

# Import to Firestore
python src/backend/scripts/migrate_incidents_to_firestore.py --import incidents.json --use-firestore
```

#### Firestore Setup
1. Create Firestore database in Firebase Console
2. Set up service account credentials
3. Set `GOOGLE_APPLICATION_CREDENTIALS` env var to service account JSON path

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
export USE_FIRESTORE=true
```

### Schema
```
Collection: incidents
Document ID: {incident_id}
Fields:
  - incident_id: string
  - title: string
  - description: string
  - severity: string (low|medium|high|critical)
  - incident_type: string
  - timestamp: ISO timestamp
  - affected_assets: string[]
  - threat_indicators: object[]
  - recommendations: string[]
  - immediate_actions: string[]
  - long_term_actions: string[]
  - detection_method: string
  - confidence_score: number
  - created_at: ISO timestamp
  - updated_at: ISO timestamp
```

---

## 3. Monitoring & Logging - OpenTelemetry

### Overview
Structured logging and distributed tracing using OpenTelemetry with support for Jaeger and Prometheus.

### Files Created/Modified
- `src/backend/core/observability.py` - OpenTelemetry configuration
- `src/backend/main.py` - Integration in FastAPI app
- `src/backend/requirements.txt` - Dependencies added

### Features

#### Observability Manager
```python
from core.observability import create_observability_manager

# Initialize observability
manager = create_observability_manager(
    service_name="zizo-netverse-backend",
    enable_jaeger=True,  # Enable Jaeger tracing
    enable_prometheus=True  # Enable Prometheus metrics
)

# Get tracer
tracer = manager.get_tracer()

# Get meter
meter = manager.get_meter("my-module")
```

#### Structured Logging
```python
from core.observability import log_with_context

log_with_context(
    logging.INFO,
    "Incident detected",
    context={
        "incident_id": "INC-2026-001",
        "severity": "high",
        "user_id": user_id
    }
)
```

#### Span Creation
```python
from core.observability import create_span

with create_span("process_incident", attributes={"severity": "high"}):
    # Do work here
    process_incident(data)
```

### Configuration

#### Environment Variables
```bash
# Enable Jaeger tracing
export ENABLE_JAEGER=true
export JAEGER_HOST=localhost
export JAEGER_PORT=6831

# Enable Prometheus metrics
export ENABLE_PROMETHEUS=true

# Service name
export OTEL_SERVICE_NAME=zizo-netverse-backend
```

#### Jaeger Setup
```bash
# Run Jaeger locally with Docker
docker run -d \
  -p 6831:6831/udp \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest

# Access UI at http://localhost:16686
```

#### Prometheus Setup
```bash
# Prometheus configuration (prometheus.yml)
scrape_configs:
  - job_name: 'zizo-netverse'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

### Instrumentation
Automatically instruments:
- FastAPI requests/responses
- HTTP client calls (httpx, requests)
- Redis operations
- Database queries (SQLAlchemy)

### Output
- **Traces**: Jaeger UI (http://localhost:16686)
- **Metrics**: Prometheus scrape endpoint (/metrics)
- **Logs**: Structured JSON logs to stdout

---

## 4. Rate Limiting - Redis-Backed

### Overview
Distributed rate limiting using Redis with support for multiple strategies (fixed window, sliding window, token bucket).

### Files Created/Modified
- `src/backend/core/rate_limiting.py` - Rate limiting implementation
- `src/backend/api_gateway/endpoints/control_updated.py` - Updated control endpoints
- `src/backend/requirements.txt` - Dependencies (redis added)

### Strategies

#### Fixed Window
- Simple and fast
- Window-based: `current_time // window_size`
- Susceptible to spikes at boundaries
- Use for: General API endpoints

#### Sliding Window ⭐ (Default)
- More accurate
- Uses sorted set to track requests
- Prevents boundary spike issues
- Use for: Critical endpoints

#### Token Bucket
- Allows bursts
- Tokens refill at constant rate
- Good for: Uneven traffic patterns

### Configuration

```python
from core.rate_limiting import RateLimitConfig, RateLimitStrategy

# Create custom config
config = RateLimitConfig(
    max_requests=100,           # 100 requests
    window_size=60,             # per 60 seconds
    strategy=RateLimitStrategy.SLIDING_WINDOW
)

# Pre-configured policies
from core.rate_limiting import (
    API_LIMIT_GENEROUS,     # 100/min
    API_LIMIT_MODERATE,     # 30/min
    API_LIMIT_STRICT,       # 10/min
    AUTH_LIMIT_LOGIN,       # 5 attempts per 5 min
    FIREWALL_LIMIT_BLOCK    # 20 blocks per min
)
```

### Usage

#### In Endpoints
```python
from core.rate_limiting import get_rate_limiter, API_LIMIT_MODERATE
from fastapi import Request

@router.get("/api/endpoint")
async def my_endpoint(request: Request):
    limiter = get_rate_limiter()
    client_ip = request.client.host
    
    status = limiter.check_rate_limit(
        f"api:{client_ip}",
        API_LIMIT_MODERATE
    )
    
    if not status.is_allowed:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Too many requests",
                "retry_after": status.retry_after,
                "reset_at": status.reset_at.isoformat()
            }
        )
    
    # Process request...
```

### Redis Setup

#### Environment Variables
```bash
export REDIS_URL=redis://localhost:6379/0
```

#### Docker
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

#### Connection String Formats
```
redis://localhost:6379/0                    # Default
redis://:password@localhost:6379/0          # With auth
redis+sentinel://localhost:26379            # Sentinel
redis+unix:///tmp/redis.sock                # Unix socket
```

### Features

#### Rate Limit Status
```python
status = limiter.check_rate_limit(key, config)

# Returns RateLimitStatus:
# - is_allowed: bool
# - requests_made: int
# - requests_remaining: int
# - reset_at: datetime
# - retry_after: Optional[int]
```

#### Admin Functions
```python
# Reset rate limit for a key
limiter.reset_limit("api:192.168.1.100")

# Get statistics
stats = limiter.get_stats("api:192.168.1.100")
# Returns: {"fixed_window": 0, "sliding_window": 1, "token_bucket": 0}
```

### HTTP Headers
Rate limit status is returned in HTTP response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1234567890
Retry-After: 45
```

---

## Integration Checklist

### Prerequisites
```bash
# Install all dependencies
pip install -r src/backend/requirements.txt
npm install

# Setup services
docker-compose up -d  # Redis, Firestore emulator, Jaeger
```

### Deployment Steps

1. **Load Testing**
   - [ ] Install K6: `brew install k6` or download from k6.io
   - [ ] Install Playwright: `npm install @playwright/test`
   - [ ] Update npm scripts in package.json
   - [ ] Create `.github/workflows/load-test.yml` for CI

2. **Database Persistence**
   - [ ] Set up Firestore database
   - [ ] Download service account credentials
   - [ ] Enable `USE_FIRESTORE=true` env var
   - [ ] Run migration script
   - [ ] Update endpoints to use `ai_analysis_updated.py`

3. **Monitoring & Logging**
   - [ ] Enable `ENABLE_JAEGER=true` and/or `ENABLE_PROMETHEUS=true`
   - [ ] Configure Jaeger/Prometheus
   - [ ] Update `main.py` with observability initialization
   - [ ] Test trace collection

4. **Rate Limiting**
   - [ ] Ensure Redis is running
   - [ ] Update control endpoints to `control_updated.py`
   - [ ] Configure rate limit policies
   - [ ] Test rate limiting thresholds

### Verification

```bash
# 1. Load testing
npm run test:e2e  # Should pass with performance thresholds
k6 run tests/load/k6-api-loadtest.js  # Should show metrics

# 2. Incident persistence
# Start backend with USE_FIRESTORE=true
# POST incident and verify it persists after restart

# 3. Tracing
# Visit http://localhost:16686 (Jaeger UI)
# Should see traces from API requests

# 4. Rate limiting
# Make rapid requests, should get 429 status
curl -i http://localhost:8000/api/v1/control/block-ip
curl -i http://localhost:8000/api/v1/control/block-ip
# After limit: HTTP 429 Too Many Requests
```

---

## Performance Benchmarks

### Expected Results

| Metric | Target | Strategy |
|--------|--------|----------|
| API Response p95 | < 500ms | Load test monitoring |
| 3D Rendering FPS | > 30 FPS | Playwright test |
| Memory leak rate | < 50% over 30s | Playwright memory profile |
| Rate limit overhead | < 5ms | Redis operation latency |

### Monitoring Dashboard

Create dashboards in:
- **Grafana** (with Prometheus datasource)
- **Jaeger UI** (traces)
- **CloudSQL** (Firestore metrics)

---

## Troubleshooting

### Load Tests Failing
- Check if backend is running: `curl http://localhost:8000/health`
- Verify Redis is running: `redis-cli ping`
- Check firewall rules for WebSocket connections

### Firestore Issues
- Verify credentials: `echo $GOOGLE_APPLICATION_CREDENTIALS`
- Check Firestore rules allow reads/writes
- Enable API in GCP console

### Tracing Not Appearing
- Check Jaeger is running: `curl http://localhost:16686`
- Verify `ENABLE_JAEGER=true`
- Check service name in Jaeger UI

### Rate Limiting Not Working
- Verify Redis connection: `redis-cli ping`
- Check `REDIS_URL` env var
- Look for errors in logs

---

## Migration Guide

### From In-Memory to Persistent Storage

## Step 1: Export Current Data
```bash
python src/backend/scripts/migrate_incidents_to_firestore.py \
    --export \
    --output incidents_backup.json
```

### Step 2: Enable Firestore
```bash
export USE_FIRESTORE=true
python src/backend/main.py
```

### Step 3: Import Data
```bash
python src/backend/scripts/migrate_incidents_to_firestore.py \
    --import incidents_backup.json \
    --use-firestore
```

### Step 4: Verify
```bash
curl http://localhost:8000/api/v1/ai-analysis/incidents?limit=10
```

---

## Future Enhancements

1. **Load Testing**
   - gRPC load testing
   - Database query performance testing
   - GraphQL support

2. **Persistence**
   - PostgreSQL backend option
   - Automated backups
   - Incident export formats (PDF, CSV)

3. **Observability**
   - Custom business metrics
   - Alert rules
   - Distributed correlation IDs

4. **Rate Limiting**
   - User/API key based limits
   - Per-endpoint customization
   - Dynamic adjustment based on backend load

---

## Support & Resources

- OpenTelemetry Docs: https://opentelemetry.io/docs/
- K6 Scripting: https://k6.io/docs/
- Playwright Testing: https://playwright.dev/docs/intro
- Firestore Documentation: https://firebase.google.com/docs/firestore
- Redis Rate Limiting: https://redis.io/commands/

