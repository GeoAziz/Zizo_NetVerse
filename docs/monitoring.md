# Monitoring & Alerting Setup

## Tools
- Prometheus for metrics collection
- Grafana for dashboards and alerting

## Backend
- Expose FastAPI metrics endpoint (e.g., /metrics)
- Monitor API latency, error rates, WebSocket connections

## Redis
- Monitor connection health, throughput, and errors

## Setup Steps
1. Install Prometheus and Grafana
2. Configure Prometheus to scrape backend and Redis metrics
3. Create Grafana dashboards for API, WebSocket, and Redis health
4. Set up alerts for failures or abnormal activity

## References
- https://prometheus.io/docs/introduction/overview/
- https://grafana.com/docs/grafana/latest/
