# Security Best Practices Review

## Authentication & Token Handling
- Use short-lived tokens and refresh securely
- Validate tokens on every request (REST & WebSocket)
- Log and alert on suspicious auth activity

## Role-Based Access
- Enforce least privilege for all endpoints
- Document roles and permissions

## Secrets Management
- Store secrets in environment variables or secret managers
- Never commit secrets to version control

## Recommendations
- Regularly audit authentication and access control
- Use automated tools to scan for vulnerabilities
- Document security policies and incident response
