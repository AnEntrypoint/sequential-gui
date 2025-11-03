# Deployment Guide - Sequential Ecosystem Admin GUI

Complete guide to deploying the admin GUI in different environments.

## Prerequisites

- Node.js 18+ or Deno 1.35+
- Access to sequential-ecosystem instance
- Git (for version control)

## Local Development

### 1. Setup

```bash
git clone https://github.com/AnEntrypoint/admin-gui.git
cd admin-gui
npm install
```

### 2. Environment

```bash
# Optional: set ecosystem path (defaults to /home/user/sequential-ecosystem)
export ECOSYSTEM_PATH=/path/to/sequential-ecosystem

# Optional: set port (defaults to 3001)
export PORT=3001
```

### 3. Run

```bash
# Both frontend and backend
npm run dev

# Or separately
npm run dev --workspace=server  # Runs on port 3001
npm run dev --workspace=web    # Runs on port 3000, proxies API to 3001
```

### 4. Access

```
Dashboard: http://localhost:3000
API Server: http://localhost:3001
API Docs: http://localhost:3001/api/health (to verify running)
```

## Docker Deployment

### Build Docker Image

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
COPY packages/shared/package.json packages/shared/

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build web
RUN npm run build --workspace=web

# Expose ports
EXPOSE 3000 3001

# Default to server, serve web as static
CMD ["node", "packages/server/src/index.js"]
```

### Run Container

```bash
# Build
docker build -t admin-gui .

# Run with ecosystem volume mount
docker run -d \
  -p 3000:3000 \
  -p 3001:3001 \
  -v /path/to/sequential-ecosystem:/ecosystem \
  -e ECOSYSTEM_PATH=/ecosystem \
  -e PORT=3001 \
  --name admin-gui \
  admin-gui

# Check logs
docker logs -f admin-gui
```

## Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  admin-gui:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      ECOSYSTEM_PATH: /ecosystem
      PORT: 3001
      NODE_ENV: production
    volumes:
      - /path/to/sequential-ecosystem:/ecosystem
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - admin-gui
    restart: unless-stopped
```

### Run with Docker Compose

```bash
docker-compose up -d

# View logs
docker-compose logs -f admin-gui

# Stop
docker-compose down
```

## Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: admin-gui
spec:
  replicas: 2
  selector:
    matchLabels:
      app: admin-gui
  template:
    metadata:
      labels:
        app: admin-gui
    spec:
      containers:
      - name: admin-gui
        image: admin-gui:latest
        ports:
        - containerPort: 3001
          name: api
        - containerPort: 3000
          name: web
        env:
        - name: ECOSYSTEM_PATH
          value: /ecosystem
        - name: PORT
          value: "3001"
        - name: NODE_ENV
          value: production
        volumeMounts:
        - name: ecosystem
          mountPath: /ecosystem
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: ecosystem
        hostPath:
          path: /var/sequential-ecosystem
          type: Directory
---
apiVersion: v1
kind: Service
metadata:
  name: admin-gui-service
spec:
  selector:
    app: admin-gui
  ports:
  - protocol: TCP
    port: 3001
    targetPort: 3001
    name: api
  - protocol: TCP
    port: 3000
    targetPort: 3000
    name: web
  type: LoadBalancer
```

### Deploy to K8s

```bash
kubectl apply -f k8s/deployment.yaml

# Verify
kubectl get pods -l app=admin-gui
kubectl logs -l app=admin-gui

# Port forward for local access
kubectl port-forward svc/admin-gui-service 3000:3000 3001:3001

# Access at localhost:3000
```

## Nginx Reverse Proxy

```nginx
# nginx.conf
upstream admin_gui_api {
  server 127.0.0.1:3001;
}

upstream admin_gui_web {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name admin.example.com;

  # API endpoints
  location /api/ {
    proxy_pass http://admin_gui_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # WebSocket
  location /ws {
    proxy_pass http://admin_gui_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }

  # Static web files
  location / {
    proxy_pass http://admin_gui_web;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

## Production Environment Variables

```bash
# Server
export NODE_ENV=production
export PORT=3001
export ECOSYSTEM_PATH=/var/sequential-ecosystem

# Logging
export DEBUG=0  # Disable debug logging

# Storage (if not using folder-based)
export DATABASE_URL=postgres://user:pass@db:5432/ecosystem

# Security
export API_KEY=your-secret-key  # For authentication
export CORS_ORIGIN=https://admin.example.com
```

## Health Checks

### API Health Endpoint

```bash
# Check server status
curl http://localhost:3001/api/health

# Response
{"status":"ok","timestamp":"2024-11-03T12:00:00.000Z"}
```

### Container Health Check

```bash
# In docker-compose or kubernetes
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Monitoring & Logging

### Server Logs

```bash
# View server logs
npm start --workspace=server 2>&1 | tee admin-gui.log

# With Docker
docker logs -f admin-gui

# With Kubernetes
kubectl logs -f deployment/admin-gui
```

### Log Aggregation

```bash
# ELK Stack example
# Configure server to send logs to Logstash
export LOG_LEVEL=info
export LOG_FORMAT=json
```

## Backup & Recovery

### Backup Ecosystem Data

```bash
# Backup folder-based storage
tar -czf ecosystem-backup-$(date +%s).tar.gz /path/to/sequential-ecosystem

# Backup PostgreSQL database (if using)
pg_dump $DATABASE_URL > ecosystem-backup-$(date +%s).sql

# Restore from backup
tar -xzf ecosystem-backup-*.tar.gz -C /
```

### Volume Mounts

```bash
# Ensure ecosystem volume is backed up
docker run --rm -v ecosystem:/ecosystem -v $(pwd):/backup \
  busybox tar czf /backup/ecosystem-backup.tar.gz -C /ecosystem .

# Restore
docker run --rm -v ecosystem:/ecosystem -v $(pwd):/backup \
  busybox tar xzf /backup/ecosystem-backup.tar.gz -C /ecosystem
```

## Security Hardening

### Network Security
- Use HTTPS/TLS in production
- Restrict API access by IP
- Enable CORS only for trusted domains
- Use API keys for authentication

### Container Security
- Run as non-root user
- Use read-only filesystem where possible
- Scan images for vulnerabilities
- Keep dependencies updated

### Data Security
- Encrypt sensitive environment variables
- Use secrets management (Vault, K8s Secrets)
- Backup encrypted at rest
- Audit access logs

## Troubleshooting

### Server won't start
```bash
# Check port is free
lsof -i :3001

# Check ecosystem path exists
ls -la $ECOSYSTEM_PATH

# View logs for errors
NODE_ENV=development npm start --workspace=server
```

### WebSocket connection fails
```bash
# Check server is running
curl http://localhost:3001/api/health

# Verify firewall allows WebSocket
# Check CORS headers
curl -i http://localhost:3001/api/health
```

### High memory usage
```bash
# Monitor Node.js
node --inspect packages/server/src/index.js

# Use Chrome DevTools chrome://inspect

# Set memory limit
NODE_OPTIONS="--max-old-space-size=512" npm start --workspace=server
```

## Performance Optimization

### Caching
- Enable Redis for WebSocket broadcasts (future)
- Cache task list in browser
- Use CDN for static assets

### Load Balancing
```bash
# Multiple admin-gui instances behind load balancer
# Share state via PostgreSQL backend
# Broadcast WebSocket events via Redis
```

### Database Optimization
- Use indexes on task and run lookups
- Archive old runs periodically
- Monitor query performance

## Scaling Strategy

### Single Node (Development)
- Folder-based storage
- Direct filesystem access
- Perfect for local development

### Multi-Node (Production)
- PostgreSQL backend
- Redis for state sharing
- Load balancer (nginx, AWS ELB)
- Separate admin-gui instances
- Shared ecosystem volume or networked storage

## Maintenance

### Regular Tasks
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Clean old runs (if using folder storage)
find tasks/*/runs -mtime +30 -delete  # Remove runs older than 30 days
```

### Database Maintenance
```bash
# PostgreSQL maintenance
VACUUM;
ANALYZE;

# Archive old data
INSERT INTO runs_archive SELECT * FROM runs WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM runs WHERE created_at < NOW() - INTERVAL '90 days';
```

---

For production deployments, ensure you have proper:
- Monitoring and alerting
- Backup and recovery procedures
- Security scanning and patching
- Load testing before go-live
- Runbooks for common issues

For support, check the main README.md or sequential-ecosystem documentation.
