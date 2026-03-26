# Integration Guide - Adding Medium Priority Features to CI/CD

This guide shows how to integrate the 4 medium-priority implementations into your existing GitHub Actions workflow.

## 1. Add Load Testing to CI/CD

Update `.github/workflows/ci-cd.yml`:

```yaml
# Add after the test job
load-test:
  needs: build
  runs-on: ubuntu-latest
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  
  steps:
    - name: Checkout repository
      uses: actions/checkout@v4
    
    - name: Install K6
      run: |
        sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3232A
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6-archive.list
        sudo apt-get update
        sudo apt-get install k6
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install Playwright
      run: npm ci && npx playwright install --with-deps
    
    - name: Run K6 Load Test
      env:
        BASE_URL: http://localhost:8000/api/v1
      run: |
        # Start backend in background
        python src/backend/main.py &
        sleep 5
        k6 run tests/load/k6-api-loadtest.js
    
    - name: Run Playwright E2E Tests
      run: npm run test:e2e -- --reporter=json
    
    - name: Upload Test Results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: load-test-results
        path: |
          tests/results/**
          playwright-report/
```

## 2. Enable Observability in CI/CD

Update backend test job in `.github/workflows/ci-cd.yml`:

```yaml
test:
  needs: lint
  runs-on: ubuntu-latest
  # ... existing services config ...
  services:
    jaeger:
      image: jaegertracing/all-in-one:latest
      ports:
        - 6831:6831/udp
        - 16686:16686
  
  steps:
    # ... existing steps ...
    
    - name: Run Python tests with OpenTelemetry
      env:
        REDIS_URL: redis://localhost:6379
        ENABLE_JAEGER: "true"
        JAEGER_HOST: localhost
        JAEGER_PORT: 6831
      run: |
        cd src/backend
        pytest test_backend.py -v --tb=short
```

## 3. Create Separate Workflow for Load Tests (Optional)

Create `.github/workflows/load-tests.yml`:

```yaml
name: Load Testing Pipeline

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:  # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
      
      jaeger:
        image: jaegertracing/all-in-one:latest
        ports:
          - 6831:6831/udp
          - 16686:16686
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      
      - name: Install K6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3232A
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6-archive.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Install dependencies
        run: |
          pip install -r src/backend/requirements.txt
          npm ci
          npx playwright install --with-deps
      
      - name: Start Backend
        env:
          ENABLE_JAEGER: "true"
          REDIS_URL: redis://localhost:6379
        run: |
          python src/backend/main.py &
          sleep 10
      
      - name: Run K6 Load Test
        env:
          BASE_URL: http://localhost:8000/api/v1
        run: |
          k6 run tests/load/k6-api-loadtest.js \
            --vus 50 \
            --duration 5m \
            --out json=tests/results/k6-results.json
      
      - name: Run E2E Tests
        run: npm run test:e2e
      
      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results-${{ github.run_id }}
          path: tests/results/
      
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Load tests completed. [View results](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})'
            })
```

## 4. Environment Secrets for CI/CD

Add these secrets to GitHub Actions:

```yaml
# Settings > Secrets > Actions

FIRESTORE_PROJECT_ID          # GCP Project ID
GOOGLE_APPLICATION_CREDENTIALS # Base64 encoded service account JSON
USE_FIRESTORE                 # true/false
ENABLE_JAEGER                 # true
ENABLE_PROMETHEUS             # true
REDIS_URL                     # redis://localhost:6379
OTEL_SERVICE_NAME             # zizo-netverse-backend
```

## 5. Performance Monitoring in CI/CD

Create `.github/workflows/performance-check.yml`:

```yaml
name: Performance Check

on:
  pull_request:
    paths:
      - 'src/backend/**'
      - 'src/app/**'
      - 'tests/**'

jobs:
  performance:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install K6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz
          sudo mv k6 /usr/local/bin/
      
      - name: Install dependencies
        run: |
          pip install -r src/backend/requirements.txt
          npm ci
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Run performance tests
        run: |
          k6 run tests/load/k6-api-loadtest.js \
            --summary-export=tests/results/summary.json
      
      - name: Check performance thresholds
        run: |
          python -c "
          import json
          with open('tests/results/summary.json') as f:
            data = json.load(f)
          
          # Extract metrics
          api_duration = data['metrics']['api_duration']['values']['p95']
          error_rate = data['metrics']['errors']['values']['rate']
          
          # Check thresholds
          assert api_duration < 500, f'API p95 too high: {api_duration}ms'
          assert error_rate < 0.1, f'Error rate too high: {error_rate}'
          
          print('✅ Performance thresholds met')
          "
      
      - name: Publish Results
        uses: dawidd6/action-publish-unit-tests@v1
        if: always()
        with:
          files: tests/results/*.xml
```

## 6. Incident Persistence in CI/CD

Add to CI/CD for Firestore integration test:

```yaml
test-firestore-persistence:
  runs-on: ubuntu-latest
  needs: build
  
  steps:
    - uses: actions/checkout@v4
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        cache: 'pip'
    
    - name: Install dependencies
      run: pip install -r src/backend/requirements.txt
    
    - name: Test Firestore Integration
      env:
        USE_FIRESTORE: ${{ secrets.USE_FIRESTORE }}
        GOOGLE_APPLICATION_CREDENTIALS: /tmp/credentials.json
      run: |
        # Decode credentials
        echo "${{ secrets.GOOGLE_APPLICATION_CREDENTIALS }}" | base64 -d > /tmp/credentials.json
        
        # Run test
        python -c "
        from src.backend.services.incident_store_firestore import FirestoreIncidentStore
        from src.backend.api_gateway.endpoints.ai_analysis_updated import IncidentReport
        
        # Test write
        store = FirestoreIncidentStore()
        incident = IncidentReport(
          incident_id='TEST-2026-001',
          title='Test Incident',
          description='Testing Firestore',
          severity='high',
          incident_type='test'
        )
        
        assert store.save_incident(incident), 'Failed to save'
        
        # Test read
        retrieved = store.get_incident('TEST-2026-001')
        assert retrieved is not None, 'Failed to retrieve'
        
        # Test delete
        assert store.delete_incident('TEST-2026-001'), 'Failed to delete'
        
        print('✅ Firestore integration test passed')
        "
```

## 7. Rate Limiting Test in CI/CD

```yaml
test-rate-limiting:
  runs-on: ubuntu-latest
  needs: build
  
  services:
    redis:
      image: redis:7-alpine
      options: >-
        --health-cmd "redis-cli ping"
        --health-interval 10s
      ports:
        - 6379:6379
  
  steps:
    - uses: actions/checkout@v4
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        cache: 'pip'
    
    - name: Install dependencies
      run: pip install -r src/backend/requirements.txt
    
    - name: Test Rate Limiting
      env:
        REDIS_URL: redis://localhost:6379
      run: |
        python -c "
        from src.backend.core.rate_limiting import (
          get_rate_limiter,
          RateLimitConfig,
          RateLimitStrategy
        )
        
        limiter = get_rate_limiter()
        config = RateLimitConfig(
          max_requests=5,
          window_size=10,
          strategy=RateLimitStrategy.SLIDING_WINDOW
        )
        
        # Test limiting
        for i in range(10):
          status = limiter.check_rate_limit(f'test-key', config)
          if i < 5:
            assert status.is_allowed, f'Request {i} should be allowed'
          else:
            assert not status.is_allowed, f'Request {i} should be blocked'
        
        print('✅ Rate limiting test passed')
        "
```

## Implementation Order

1. Start with load tests (non-blocking)
2. Add Firestore persistence (add USE_FIRESTORE secret)
3. Enable observability (add Jaeger service)
4. Test rate limiting (add Redis service)
5. Create separate performance workflow

## Testing Locally vs CI

### Local Development
```bash
# Set environment variables
export USE_FIRESTORE=true
export ENABLE_JAEGER=true
export REDIS_URL=redis://localhost:6379

# Run services
docker-compose up -d

# Run tests
npm run test:e2e
k6 run tests/load/k6-api-loadtest.js
```

### CI/CD Pipeline
```yaml
# Services are provisioned automatically
# Secrets are injected
# Results are uploaded and reported
```

## Monitoring CI/CD Results

1. **GitHub Actions:** View raw test logs
2. **Artifacts:** Download test results JSON/reports
3. **Performance Dashboard:** Create dashboard with historical data
4. **Notifications:** Set up Slack/email alerts for failures

---

For detailed implementation instructions, see [medium-priority-implementations.md](docs/medium-priority-implementations.md)
