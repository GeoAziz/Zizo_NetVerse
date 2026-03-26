# Scalability Refactor Plan

## Bottleneck Identification
- Profile backend and WebSocket endpoints for latency and throughput
- Identify slow queries, blocking calls, and resource contention

## Refactoring Actions
- Use async patterns throughout backend (FastAPI, Redis, WebSocket)
- Implement connection pooling for DB/Redis
- Modularize and decouple services for easier scaling
- Add load testing (e.g., with locust, k6)

## Recommendations
- Refactor critical paths for async/await
- Use connection pools for all external services
- Document changes and rationale in code and docs
