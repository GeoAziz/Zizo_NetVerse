# Deployment Checklist - Medium Priority Features

Complete guide for deploying all 4 medium-priority features to production.

---

## 📋 Pre-Deployment Checklist

### Prerequisites
- [ ] All dependencies installed locally
- [ ] Services running (Redis, Jaeger, etc.)
- [ ] Tests passing locally
- [ ] Git branch created for deployment
- [ ] Code review completed
- [ ] Documentation reviewed

### Code Review
- [ ] Load test thresholds reviewed
- [ ] Firestore schema approved
- [ ] OpenTelemetry config validated
- [ ] Rate limiting policies agreed

---

## 🚀 Phase 1: Load Testing Setup

### Development Environment
- [ ] K6 installed: `k6 version`
- [ ] Playwright installed: `npx playwright --version`
- [ ] Test files create: `ls tests/load/ tests/e2e/`
- [ ] npm scripts updated: `npm run test:e2e` works

### Testing
```bash
# Run locally
npm run test:e2e
k6 run tests/load/k6-api-loadtest.js

# Verify thresholds met
# - API p95 < 500ms ✅
# - Error rate < 10% ✅
# - FPS > 30 ✅
```

### Checklist
- [ ] K6 API load test passing
- [ ] Playwright tests passing
- [ ] Performance thresholds met
- [ ] Load test results documented
- [ ] CI/CD workflow ready

---

## 🗄️ Phase 2: Firestore Migration

### 1. Setup Firestore
- [ ] Create GCP Project
- [ ] Enable Firestore API
- [ ] Create Service Account
- [ ] Download credentials JSON
- [ ] Set `GOOGLE_APPLICATION_CREDENTIALS` env var

### 2. Backup Existing Data
```bash
# Test backup locally
python src/backend/scripts/migrate_incidents_to_firestore.py --export --output backup.json

# Verify backup
ls -lh backup.json
wc -l backup.json  # Count records
```

Checklist:
- [ ] Backup created and verified
- [ ] Backup size reasonable
- [ ] Records format validated

### 3. Test Migration
```bash
# Deploy to staging with Firestore enabled
export USE_FIRESTORE=true
python src/backend/main.py

# Test API endpoints
curl http://localhost:8000/api/v1/ai-analysis/incidents

# Import test data
python src/backend/scripts/migrate_incidents_to_firestore.py --import backup.json --use-firestore

# Verify data in Firestore
# - Check Firebase Console
# - Run: curl http://localhost:8000/api/v1/ai-analysis/incidents?limit=10
```

Checklist:
- [ ] Migration script tested
- [ ] Firestore connection verified
- [ ] Test data imported successfully
- [ ] API endpoints returning data
- [ ] Incident retrieval working
- [ ] Delete functionality working

### 4. Production Deployment
```bash
# 1. Set environment variable
export USE_FIRESTORE=true

# 2. Deploy updated code
# - ai_analysis_updated.py → ai_analysis.py (or update imports)
# - incident_store_firestore.py installed

# 3. Verify deployment
curl http://localhost:8000/health

# 4. Import data (if migrating from in-memory)
python src/backend/scripts/migrate_incidents_to_firestore.py --import backup.json --use-firestore
```

Checklist:
- [ ] Environment variables set in deployment
- [ ] Firestore project ID configured
- [ ] Service account credentials deployed
- [ ] Code deployed successfully
- [ ] All incidents accessible
- [ ] Rollback plan documented

---

## 📊 Phase 3: OpenTelemetry & Observability

### 1. Setup Jaeger (Optional but Recommended)
```bash
# Option A: Docker
docker run -d \
  --name jaeger \
  -p 6831:6831/udp \
  -p 16686:16686 \
  jaegertracing/all-in-one:latest

# Option B: Kubernetes
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: jaeger
spec:
  containers:
  - name: jaeger
    image: jaegertracing/all-in-one:latest
    ports:
    - containerPort: 6831
      protocol: UDP
    - containerPort: 16686
EOF
```

Checklist:
- [ ] Jaeger running: `curl http://localhost:16686`
- [ ] Port 6831 UDP accessible
- [ ] Jaeger UI accessible in browser

### 2. Setup Prometheus (Optional but Recommended)
```bash
# Option A: Docker
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Option B: Create prometheus.yml
cat > prometheus.yml <<EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'zizo-netverse'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
EOF
```

Checklist:
- [ ] Prometheus running: `curl http://localhost:9090`
- [ ] Prometheus scrape config valid
- [ ] Metrics endpoint accessible

### 3. Enable OpenTelemetry
```bash
# Set environment variables
export ENABLE_JAEGER=true
export ENABLE_PROMETHEUS=true
export OTEL_SERVICE_NAME=zizo-netverse-backend
export JAEGER_HOST=jaeger.example.com  # or localhost
export JAEGER_PORT=6831

# Restart backend
python src/backend/main.py
```

### 4. Verification
```bash
# Check logs for initialization
# Should see: "✓ ObservabilityManager initialized"

# Generate some traces
curl -X GET http://localhost:8000/api/v1/ai-analysis/incidents

# View traces in Jaeger
# http://localhost:16686 → Select service → View traces

# View metrics in Prometheus
# http://localhost:9090 → Graph tab → Search metrics
```

Checklist:
- [ ] Jaeger/Prometheus connections successful
- [ ] Traces appearing in Jaeger UI
- [ ] Metrics appearing in Prometheus
- [ ] Structured logs in JSON format
- [ ] No performance degradation

---

## 🔒 Phase 4: Redis Rate Limiting

### 1. Setup Redis
```bash
# Option A: Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Option B: Existing Redis
# Ensure running and accessible

# Test connection
redis-cli ping
# Response: PONG
```

Checklist:
- [ ] Redis running: `redis-cli ping` returns PONG
- [ ] Port 6379 accessible
- [ ] Redis version compatible (5.0+)

### 2. Configure Rate Limiting
```bash
# Set environment variable
export REDIS_URL=redis://localhost:6379/0

# Or for production
export REDIS_URL=redis://:password@redis.example.com:6379/0
```

### 3. Test Rate Limiting
```bash
# Make rapid requests to test endpoint
for i in {1..10}; do
  curl -i http://localhost:8000/api/v1/control/block-ip \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"ip": "192.168.1.100"}'
  echo "Request $i"
done

# Should see 429 Too Many Requests after limit
```

Checklist:
- [ ] Rate limits enforced
- [ ] 429 responses received
- [ ] Retry-After headers present
- [ ] Redis keys created: `redis-cli keys rate_limit*`

### 4. Verify Rate Limit Policies
```bash
# Test different endpoints
# - /control/block-ip (20/min limit)
# - /auth/login (5/300s limit)
# - /ai-analysis/incident-report (30/min limit)

# Verify policies applied correctly
# - Check response headers
# - Check Redis keys
```

Checklist:
- [ ] Firewall block endpoint limited
- [ ] Auth endpoints limited stricter
- [ ] API endpoints limited
- [ ] Admin reset functionality works

---

## ✅ Phase 5: Integration Testing

### End-to-End Test Suite
```bash
# 1. Start all services
docker-compose up -d

# 2. Run full test suite
npm run test                    # Unit tests
npm run test:e2e              # E2E tests
k6 run tests/load/k6-api-loadtest.js  # Load tests

# 3. Verify all components
curl http://localhost:8000/health

# 4. Test persistence
curl -X POST http://localhost:8000/api/v1/ai-analysis/incident-report \
  -H "Content-Type: application/json" \
  -d '{
    "incident_id": "INC-TEST-001",
    "title": "Test",
    "description": "Integration test",
    "severity": "high",
    "incident_type": "test",
    "affected_assets": ["192.168.1.1"]
  }'

# 5. Verify in Firestore
# Check Firebase Console

# 6. Check observability
# - View traces in Jaeger
# - View metrics in Prometheus
```

Checklist:
- [ ] All tests passing
- [ ] Health check responding
- [ ] Incident persisted to Firestore
- [ ] Traces visible in Jaeger
- [ ] Metrics in Prometheus
- [ ] Rate limiting working
- [ ] No error logs

---

## 🔄 Phase 6: CI/CD Integration

### GitHub Actions Setup
- [ ] Update `.github/workflows/ci-cd.yml`
- [ ] Add secrets to GitHub
- [ ] Create load test job
- [ ] Test workflow locally
- [ ] Verify artifacts uploaded

### Secrets Required
```
FIRESTORE_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS
ENABLE_JAEGER=true
ENABLE_PROMETHEUS=true
REDIS_URL
```

Checklist:
- [ ] All secrets configured
- [ ] Test job triggered successfully
- [ ] Load tests run in CI
- [ ] Results published
- [ ] Notifications working

---

## 🚨 Phase 7: Monitoring & Alerts

### Setup Dashboards
- [ ] Grafana connected to Prometheus
- [ ] Key metrics dashboarded
- [ ] Performance thresholds set

### Alert Rules
```yaml
ALERTS:
- API p95 latency > 1000ms
- Error rate > 5%
- Redis connection failed
- Firestore quota exceeded
- Memory usage > 80%
```

Checklist:
- [ ] Dashboard created
- [ ] Alerts configured
- [ ] Alert channels working (Slack/email)
- [ ] Test alert triggered

---

## 📝 Phase 8: Documentation & Runbooks

### Documentation Created
- [ ] medium-priority-implementations.md
- [ ] ci-cd-integration-guide.md
- [ ] Deployment runbook
- [ ] Troubleshooting guide
- [ ] Architecture diagram

### Team Documentation
- [ ] Team trained on new features
- [ ] Runbooks shared with on-call team
- [ ] Quick reference cards printed
- [ ] Knowledge base updated

Checklist:
- [ ] All documentation complete
- [ ] Team trained
- [ ] Runbooks accessible
- [ ] Escalation procedures clear

---

## 🔙 Rollback Plan

### If Issues Found

#### Rollback Firestore
```bash
# 1. Disable Firestore
unset USE_FIRESTORE

# 2. Restart backend
# Incidents will be in-memory again

# 3. Export data (if needed)
python scripts/migrate_incidents_to_firestore.py --export
```

#### Rollback Observability
```bash
# 1. Disable tracing
unset ENABLE_JAEGER
unset ENABLE_PROMETHEUS

# 2. Restart backend
# No performance impact
```

#### Rollback Rate Limiting
```bash
# 1. Use in-memory rate limiting
# Restore old control.py endpoints

# 2. Restart backend
# All requests allowed (no limiting)
```

Checklist:
- [ ] Rollback procedure tested
- [ ] Team knows rollback steps
- [ ] Backups available
- [ ] Downtime window scheduled if needed

---

## 📊 Success Metrics

After deployment, verify:

| Metric | Target | Actual |
|--------|--------|--------|
| API p95 Latency | < 500ms | ___ |
| Error Rate | < 1% | ___ |
| Incident Persistence | 100% | ___ |
| Rate Limit Accuracy | 100% | ___ |
| Trace Collection | > 95% | ___ |
| Memory Growth | < 20%/hour | ___ |
| Cache Hit Rate | > 80% | ___ |

---

## 📞 Support & Escalation

### Issues During Deployment

**Setup Issues:**
- Check logs: `kubectl logs <pod> -f`
- Verify environment variables
- Test connectivity to services

**Performance Degradation:**
- Check Prometheus metrics
- Review Jaeger traces
- Check Redis connection
- Monitor Firestore quota

**Data Loss:**
- Restore from backup
- Check transaction logs
- Verify Firestore replication

### Escalation Path
1. On-call engineer
2. Team lead
3. Architecture review
4. Rollback decision

---

## 🎉 Post-Deployment

### Verification Checklist
- [ ] All services healthy
- [ ] No error spikes
- [ ] Performance baseline established
- [ ] Monitoring active
- [ ] Alerts tested
- [ ] Team trained

### Optimization Phase (1-2 weeks later)
- [ ] Analyze real-world performance
- [ ] Tune rate limit thresholds
- [ ] Optimize Firestore indices
- [ ] Adjust alert thresholds
- [ ] Document lessons learned

---

## 📅 Timeline Estimate

| Phase | Duration | Blockers |
|-------|----------|----------|
| Load Testing | 2 hours | None |
| Firestore Setup | 1-2 hours | GCP access |
| Observability | 1-2 hours | Jaeger/Prometheus setup |
| Rate Limiting | 1 hour | Redis access |
| Integration | 2-3 hours | Full test suite |
| CI/CD | 1-2 hours | GitHub secrets |
| Monitoring | 1-2 hours | Dashboard access |
| **Total** | **9-14 hours** | |

---

## ✅ Final Sign-Off

- [ ] All phases completed
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Team trained
- [ ] Monitoring active
- [ ] Rollback plan ready
- [ ] Management approval obtained

**Deployment Date:** ___________
**Deployed By:** ___________
**Approved By:** ___________

---

For detailed instructions, refer to:
- [medium-priority-implementations.md](docs/medium-priority-implementations.md)
- [ci-cd-integration-guide.md](docs/ci-cd-integration-guide.md)
