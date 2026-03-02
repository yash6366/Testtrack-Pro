# TestTrack Pro - Production Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Server Requirements](#server-requirements)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [Deployment Steps](#deployment-steps)
6. [SSL/TLS Setup](#ssltls-setup)
7. [Database Migration Strategy](#database-migration-strategy)
8. [Environment Configuration](#environment-configuration)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Backup and Restore](#backup-and-restore)
11. [Scaling and Load Balancing](#scaling-and-load-balancing)
12. [Rollback Procedures](#rollback-procedures)
13. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides step-by-step instructions for deploying TestTrack Pro to production. It covers both Docker-based and traditional deployment methods.

### Deployment Options
- **Option 1:** Docker Compose (Recommended for single-server)
- **Option 2:** Kubernetes (Recommended for multi-server)
- **Option 3:** Traditional (PM2 + Nginx)

---

## Prerequisites

### Required Software
- **Node.js:** >= 20.x LTS
- **pnpm:** >= 8.x
- **PostgreSQL:** >= 14.x (recommended: 16.x)
- **Redis:** >= 6.x (recommended: 7.x)
- **Docker:** >= 24.x (if using Docker deployment)
- **Docker Compose:** >= 2.x (if using Docker deployment)
- **Nginx:** >= 1.24.x (for reverse proxy)

### Required Accounts/Services
- **Cloudinary** - File storage (https://cloudinary.com)
- **Resend** - Email service (https://resend.com)
- **Sentry** - Error tracking (optional, https://sentry.io)
- **SSL Certificate** - Let's Encrypt (free) or commercial

---

## Server Requirements

### Minimum Requirements (< 100 users)
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Disk:** 20 GB SSD
- **Network:** 100 Mbps

### Recommended (100-500 users)
- **CPU:** 4 cores
- **RAM:** 8 GB
- **Disk:** 50 GB SSD
- **Network:** 1 Gbps

### High-Performance (500+ users)
- **CPU:** 8+ cores
- **RAM:** 16+ GB
- **Disk:** 100+ GB SSD (NVMe preferred)
- **Network:** 10 Gbps
- **Load Balancer:** Required for HA

---

## Pre-Deployment Checklist

### Security
- [ ] Generate strong JWT_SECRET (min 32 characters)
- [ ] Generate strong REFRESH_TOKEN_SECRET (different from JWT_SECRET)
- [ ] Generate strong database password
- [ ] Generate strong Redis password
- [ ] Configure Cloudinary credentials
- [ ] Configure Resend API key with verified sender domain
- [ ] Set FORCE_HTTPS=true
- [ ] Disable Swagger in production (ENABLE_SWAGGER=false)
- [ ] Configure OAuth credentials (Google, GitHub)

### Database
- [ ] Create production database
- [ ] Create database user with appropriate permissions
- [ ] Configure SSL/TLS for database connection
- [ ] Set up automated backups
- [ ] Configure connection pooling

### Infrastructure
- [ ] Set up firewall rules (allow only 80, 443, SSH)
- [ ] Configure DNS records
- [ ] Obtain SSL/TLS certificate
- [ ] Set up monitoring (Sentry, Datadog, etc.)
- [ ] Configure log aggregation
- [ ] Set up automated backups

---

## Deployment Steps

### Option 1: Docker Compose Deployment (Recommended)

#### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/testtrack-pro.git
cd testtrack-pro
git checkout main  # or your production branch
```

#### Step 2: Create Production Environment File
```bash
cp apps/api/.env.example apps/api/.env.production
nano apps/api/.env.production
```

**CRITICAL:** Update all values in `.env.production`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:STRONG_PASSWORD@postgres:5432/testtrack_prod?connection_limit=10&pool_timeout=20
JWT_SECRET=<generate with: openssl rand -base64 32>
REFRESH_TOKEN_SECRET=<generate with: openssl rand -base64 32>
FORCE_HTTPS=true
# ... (see .env.example for all required variables)
```

#### Step 3: Build Docker Images
```bash
docker-compose -f docker-compose.production.yml build
```

#### Step 4: Start Services
```bash
docker-compose -f docker-compose.production.yml up -d
```

#### Step 5: Run Database Migrations
```bash
docker-compose -f docker-compose.production.yml exec api pnpm exec prisma migrate deploy
```

#### Step 6: Create Admin User
```bash
docker-compose -f docker-compose.production.yml exec api node scripts/dev/create-admin.js
```

#### Step 7: Verify Deployment
```bash
# Check health endpoints
curl http://localhost:3001/health
curl http://localhost/health

# Check logs
docker-compose -f docker-compose.production.yml logs -f api
docker-compose -f docker-compose.production.yml logs -f web
```

---

## SSL/TLS Setup

### Option 1: Let's Encrypt (Free, Recommended)

#### Using Certbot with Nginx

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate (interactive)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

Certbot automatically:
- Obtains certificates
- Configures Nginx
- Sets up auto-renewal (cron job)

#### Manual Nginx Configuration
Create `/etc/nginx/sites-available/testtrack-pro`:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Main Application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend (React SPA)
    location / {
        proxy_pass http://localhost:80;  # Docker web container
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket Support
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 86400;
    }
}
```

#### Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/testtrack-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2: Commercial SSL Certificate

If using a commercial SSL provider (GoDaddy, DigiCert, etc.):

1. Generate CSR:
```bash
openssl req -new -newkey rsa:2048 -nodes \
  -keyout yourdomain.com.key \
  -out yourdomain.com.csr
```

2. Submit CSR to provider and download certificate

3. Update Nginx configuration:
```nginx
ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
ssl_certificate_key /etc/ssl/private/yourdomain.com.key;
```

### Option 3: Cloudflare (Free SSL)

If using Cloudflare:
1. Add site to Cloudflare
2. Update nameservers
3. Enable "Always Use HTTPS"
4. Set SSL/TLS mode to "Full (strict)"
5. Enable HSTS

---

## Database Migration Strategy

### Zero-Downtime Migrations

For production with existing users, use this strategy:

#### 1. Backup Database
```bash
docker-compose -f docker-compose.production.yml exec postgres \
  pg_dump -U testtrack testtrack_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. Test Migration on Staging
```bash
# On staging environment
pnpm --filter api exec prisma migrate deploy
```

#### 3. Deploy Migration to Production
```bash
# During low-traffic window
docker-compose -f docker-compose.production.yml exec api \
  pnpm exec prisma migrate deploy
```

#### 4. Verify Migration
```bash
docker-compose -f docker-compose.production.yml exec postgres \
  psql -U testtrack testtrack_prod -c "\dt"
```

### Rollback Strategy
If migration fails:
```bash
# Restore from backup
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U testtrack testtrack_prod < backup_TIMESTAMP.sql
```

---

## Environment Configuration

### Required Environment Variables

See `apps/api/.env.example` for complete list. Critical variables:

```env
# Application
NODE_ENV=production
PORT=3001
FORCE_HTTPS=true

# Database (with connection pooling)
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20

# Authentication (MUST be 32+ characters)
JWT_SECRET=<openssl rand -base64 32>
REFRESH_TOKEN_SECRET=<openssl rand -base64 32>

# Redis
REDIS_URL=redis://:password@host:6379

# External Services
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Frontend
FRONTEND_URL=https://yourdomain.com
WEBHOOK_BASE_URL=https://api.yourdomain.com

# Monitoring
SENTRY_DSN=https://your_dsn@sentry.io/project
```

---

## Monitoring and Logging

### Health Checks

TestTrack Pro provides health check endpoints:

```bash
# Liveness probe (is service running?)
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2026-03-02T10:30:00.000Z"}
```

### Log Locations

**Docker Deployment:**
```bash
# View API logs
docker-compose logs -f api

# View Web logs
docker-compose logs -f web

# View all logs
docker-compose logs -f
```

**Traditional Deployment:**
- API logs: `/var/log/testtrack/api.log`
- Nginx access: `/var/log/nginx/access.log`
- Nginx error: `/var/log/nginx/error.log`

### Sentry Integration

Error tracking is pre-configured. Just set `SENTRY_DSN`:

```env
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
```

---

## Backup and Restore

### Automated Database Backups

#### Using Docker

Create backup script `/root/backup-testtrack.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/backups/testtrack"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Backup database
docker-compose -f /path/to/docker-compose.production.yml exec -T postgres \
  pg_dump -U testtrack testtrack_prod | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

#### Schedule with Cron
```bash
sudo crontab -e

# Add line for daily backup at 2 AM
0 2 * * * /root/backup-testtrack.sh
```

### Manual Backup
```bash
docker-compose -f docker-compose.production.yml exec postgres \
  pg_dump -U testtrack testtrack_prod > backup.sql
```

### Restore from Backup
```bash
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U testtrack testtrack_prod < backup.sql
```

---

## Scaling and Load Balancing

### Horizontal Scaling (Multi-Instance)

TestTrack Pro is designed for horizontal scaling with:
- Stateless JWT authentication
- Redis pub/sub for Socket.IO
- Shared database

#### Load Balancer Configuration (Nginx)

```nginx
upstream testtrack_api {
    least_conn;
    server api1.internal:3001;
    server api2.internal:3001;
    server api3.internal:3001;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL configuration...
    
    location / {
        proxy_pass http://testtrack_api;
        # Proxy headers...
    }
}
```

#### Requirements for Multi-Instance:
1. **Redis Required:** For Socket.IO clustering
2. **Shared Database:** All instances connect to same PostgreSQL
3. **Sticky Sessions:** Not required (stateless)
4. **Health Checks:** Configure load balancer health checks

---

## Rollback Procedures

### Quick Rollback (< 5 minutes)

#### Docker Deployment:
```bash
# 1. Stop current deployment
docker-compose -f docker-compose.production.yml down

# 2. Checkout previous version
git checkout <previous-tag>

# 3. Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

#### Database Rollback:
```bash
# Restore database from backup
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U testtrack testtrack_prod < backup_before_deploy.sql
```

### Blue-Green Deployment (Zero Downtime)

1. Deploy new version to green environment
2. Test green environment
3. Switch load balancer to green
4. Keep blue as rollback option for 24h

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
**Symptom:** API won't start, logs show database errors

**Solution:**
```bash
# Check database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify connection string
echo $DATABASE_URL
```

#### 2. Redis Connection Failed
**Symptom:** Socket.IO not working, rate limiting issues

**Solution:**
```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
# Expected: PONG
```

#### 3. SSL Certificate Issues
**Symptom:** Browser shows "Not Secure"

**Solution:**
```bash
# Verify certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx configuration
sudo nginx -t
```

#### 4. High Memory Usage
**Symptom:** Server slowing down, OOM errors

**Solution:**
```bash
# Check Docker container stats
docker stats

# Restart specific service
docker-compose restart api

# Add memory limits in docker-compose.yml
```

---

## Support and Maintenance

### Recommended Maintenance Schedule

- **Daily:** Check logs for errors
- **Weekly:** Review Sentry errors, check disk space
- **Monthly:** Update dependencies (security patches), test backups
- **Quarterly:** Rotate secrets, review SSL certificates

### Emergency Contacts

- **Primary Admin:** [Your contact]
- **DevOps Team:** [Team contact]
- **24/7 On-Call:** [Pager duty/contact]

---

## Appendix: Quick Reference

### Useful Commands

```bash
# View logs
docker-compose logs -f api

# Restart API
docker-compose restart api

# Scale API instances
docker-compose up -d --scale api=3

# Database shell
docker-compose exec postgres psql -U testtrack testtrack_prod

# Redis shell
docker-compose exec redis redis-cli

# Run migrations
docker-compose exec api pnpm exec prisma migrate deploy

# Create database backup
docker-compose exec postgres pg_dump -U testtrack testtrack_prod > backup.sql
```

### Performance Tuning

See [PERFORMANCE.md](PERFORMANCE.md) for detailed performance optimization guide.

---

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Next Review:** June 2, 2026
