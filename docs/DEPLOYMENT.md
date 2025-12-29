# Sweet Bonanza - Deployment Guide

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Methods](#deployment-methods)
5. [Post-Deployment](#post-deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Browser compatibility tested

### Configuration

- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] SSL certificates installed
- [ ] CDN configured
- [ ] DNS records updated
- [ ] Analytics tracking ID set

### Security

- [ ] HTTPS enabled
- [ ] CSP headers configured
- [ ] CORS policies set
- [ ] Rate limiting enabled
- [ ] Request signing implemented
- [ ] Session management tested

### Documentation

- [ ] README updated
- [ ] API documentation current
- [ ] Deployment runbook created
- [ ] Incident response plan documented

---

## Environment Setup

### 1. Production Environment Variables

Create `.env.production`:

```bash
# API Configuration
VITE_API_BASE_URL=https://api.your-casino.com/api/v1
VITE_API_KEY=prod_api_key_here

# Game Mode
VITE_GAME_MODE=production

# Debug (disabled in production)
VITE_DEBUG_MODE=false

# Analytics
VITE_ANALYTICS_ID=GA-XXXXXXXXX
VITE_TRACKING_ENABLED=true

# CDN
VITE_CDN_URL=https://cdn.your-casino.com
```

### 2. Backend Configuration

Ensure backend is configured for production:

```yaml
# config/production.yaml
database:
  host: db.your-casino.com
  port: 5432
  ssl: true
  pool:
    min: 10
    max: 100

redis:
  host: redis.your-casino.com
  port: 6379
  tls: true

api:
  rateLimit:
    enabled: true
    max: 10
    windowMs: 1000

security:
  requestSigning: true
  sessionTimeout: 3600000
  jwtSecret: ${JWT_SECRET}
  apiKey: ${API_KEY}

logging:
  level: info
  format: json
```

---

## Build Process

### 1. Install Dependencies

```bash
npm ci --only=production
```

### 2. Build Production Bundle

```bash
# Build with production optimizations
npm run build

# Output structure
dist/
├── index.html
├── assets/
│   ├── main-[hash].js
│   ├── main-[hash].css
│   └── phaser-[hash].js
└── favicon.ico
```

### 3. Build Optimization

The build process includes:

- **Code Minification** - Reduced file sizes
- **Tree Shaking** - Remove unused code
- **Code Splitting** - Separate vendor bundles
- **Asset Compression** - Gzip/Brotli compression
- **Cache Busting** - Hashed filenames
- **Source Maps** - For debugging (optional)

---

## Deployment Methods

### Option 1: CDN Deployment (Recommended)

#### Amazon S3 + CloudFront

```bash
# 1. Build
npm run build

# 2. Upload to S3
aws s3 sync dist/ s3://your-bucket/sweet-bonanza/ \
  --acl public-read \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html separately (no cache)
aws s3 cp dist/index.html s3://your-bucket/sweet-bonanza/index.html \
  --acl public-read \
  --cache-control "no-cache"

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/sweet-bonanza/*"
```

#### CloudFront Configuration

```json
{
  "Origins": [{
    "DomainName": "your-bucket.s3.amazonaws.com",
    "OriginPath": "/sweet-bonanza"
  }],
  "DefaultCacheBehavior": {
    "Compress": true,
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"]
  },
  "CustomErrorResponses": [{
    "ErrorCode": 404,
    "ResponsePagePath": "/index.html",
    "ResponseCode": 200
  }]
}
```

### Option 2: Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure vercel.json
```

`vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Option 3: Netlify Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

`netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Option 4: Docker + Kubernetes

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

  # Cache static assets
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # No cache for index.html
  location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache";
  }
}
```

#### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sweet-bonanza
  labels:
    app: sweet-bonanza
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sweet-bonanza
  template:
    metadata:
      labels:
        app: sweet-bonanza
    spec:
      containers:
      - name: sweet-bonanza
        image: your-registry/sweet-bonanza:latest
        ports:
        - containerPort: 80
        env:
        - name: VITE_API_BASE_URL
          valueFrom:
            configMapKeyRef:
              name: sweet-bonanza-config
              key: api_url
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: sweet-bonanza
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: sweet-bonanza
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sweet-bonanza
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - games.your-casino.com
    secretName: sweet-bonanza-tls
  rules:
  - host: games.your-casino.com
    http:
      paths:
      - path: /sweet-bonanza
        pathType: Prefix
        backend:
          service:
            name: sweet-bonanza
            port:
              number: 80
```

---

## Post-Deployment

### 1. Smoke Tests

```bash
# Test production URL
curl -I https://games.your-casino.com/sweet-bonanza/

# Expected: 200 OK

# Test API connectivity
curl https://api.your-casino.com/health

# Load game in browser
open https://games.your-casino.com/sweet-bonanza/?mode=demo
```

### 2. Performance Verification

Use Lighthouse or WebPageTest:

```bash
# Lighthouse audit
lighthouse https://games.your-casino.com/sweet-bonanza/ \
  --output=html \
  --output-path=./lighthouse-report.html
```

**Target Metrics:**
- Performance: > 90
- Best Practices: > 95
- SEO: > 90
- Accessibility: > 90

### 3. Monitoring Setup

#### Application Monitoring

```javascript
// DataDog RUM
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: process.env.VITE_DATADOG_APP_ID,
  clientToken: process.env.VITE_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'sweet-bonanza',
  env: 'production',
  version: '1.0.0',
  trackInteractions: true,
  trackResources: true,
  trackLongTasks: true
});
```

#### Error Tracking

```javascript
// Sentry
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: 'production',
  release: 'sweet-bonanza@1.0.0',
  integrations: [
    new Sentry.BrowserTracing()
  ],
  tracesSampleRate: 0.1
});
```

---

## Monitoring

### Key Metrics

1. **Performance Metrics**
   - Page load time
   - Time to interactive
   - First contentful paint
   - Frame rate (target: 60 FPS)

2. **Business Metrics**
   - Total spins
   - Total wagered
   - Total won
   - Active players
   - Session duration

3. **Error Metrics**
   - JavaScript errors
   - API errors
   - Network failures
   - Session timeouts

4. **Resource Metrics**
   - CPU usage
   - Memory usage
   - Network bandwidth
   - Cache hit rate

### Alerting

Set up alerts for:

- Error rate > 1%
- API response time > 200ms
- Page load time > 3s
- Downtime > 1 minute

---

## Troubleshooting

### Common Issues

#### 1. Game Won't Load

**Symptoms:** Blank screen or loading spinner

**Diagnosis:**
```bash
# Check console for errors
# Check network tab for failed requests
# Verify API connectivity
```

**Solutions:**
- Clear browser cache
- Check API endpoint configuration
- Verify CORS settings
- Check CSP headers

#### 2. API Connection Failures

**Symptoms:** "Network error" messages

**Diagnosis:**
```bash
curl -v https://api.your-casino.com/game/init
```

**Solutions:**
- Verify API is running
- Check CORS configuration
- Verify SSL certificate
- Check firewall rules

#### 3. Performance Issues

**Symptoms:** Low frame rate, laggy animations

**Diagnosis:**
- Run Lighthouse audit
- Check Chrome DevTools Performance tab
- Monitor memory usage

**Solutions:**
- Enable hardware acceleration
- Reduce animation complexity
- Optimize asset sizes
- Use WebGL renderer

---

## Rollback Procedure

If deployment fails:

### CDN Rollback

```bash
# Revert to previous version
aws s3 sync s3://your-bucket/sweet-bonanza-backup/ \
  s3://your-bucket/sweet-bonanza/ \
  --delete

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/sweet-bonanza/*"
```

### Kubernetes Rollback

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/sweet-bonanza

# Check rollout status
kubectl rollout status deployment/sweet-bonanza
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check performance metrics
- Review security alerts

**Weekly:**
- Update dependencies
- Review player feedback
- Analyze game statistics

**Monthly:**
- Security audit
- Performance optimization
- Backup verification
- Disaster recovery test

---

## Support

For deployment support:

- **DevOps Team**: devops@your-company.com
- **On-call Engineer**: +1-XXX-XXX-XXXX
- **Documentation**: https://docs.your-casino.com

---

**Last Updated**: 2024
**Version**: 1.0.0
