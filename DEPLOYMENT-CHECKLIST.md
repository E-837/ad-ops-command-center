# Production Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] All tests passing (unit, integration, performance)
- [ ] Database migrations tested (forward + rollback)
- [ ] Environment variables documented and configured
- [ ] Secrets stored securely (not in code)
- [ ] `.env` file configured for production
- [ ] Production database created (or SQLite file location set)

### Configuration
- [ ] API rate limits configured
- [ ] Error logging configured (log level, destination)
- [ ] Monitoring dashboards created
- [ ] SSE connection limits set
- [ ] CORS origins configured
- [ ] Session secrets generated

### Security
- [ ] All API keys rotated for production
- [ ] Google Ads credentials configured
- [ ] Meta Ads credentials configured
- [ ] Pinterest credentials configured
- [ ] LinkedIn Ads credentials configured
- [ ] TikTok credentials configured
- [ ] Microsoft Ads credentials configured
- [ ] Asana credentials configured
- [ ] Webhook secrets generated
- [ ] HTTPS enabled (if applicable)

### Dependencies
- [ ] Node.js version verified (v16+ required)
- [ ] All npm packages installed (`npm install`)
- [ ] Production dependencies only (`npm prune --production`)
- [ ] No known security vulnerabilities (`npm audit`)

### Database
- [ ] Database schema up to date
- [ ] Migrations tested in staging
- [ ] Rollback procedures documented
- [ ] Backup strategy implemented
- [ ] Initial seed data prepared (if needed)

## Deployment Steps

### 1. Database Migration

```bash
# Backup existing database (if applicable)
cp database/ad-ops.db database/ad-ops.db.backup

# Run migrations
npx knex migrate:latest

# Verify migration status
npx knex migrate:status
```

### 2. Seed Initial Data (Optional)

```bash
# Seed example data (only on fresh install)
npx knex seed:run
```

### 3. Build and Start Server

```bash
# Install dependencies
npm install --production

# Start server with PM2 (recommended)
npm install -g pm2
pm2 start ecosystem.config.js

# OR start with npm
npm start
```

### 4. Health Check

```bash
# Verify server is running
curl http://localhost:3002/health

# Expected response:
# {
#   "status": "healthy",
#   "uptime": 1234,
#   "database": "connected",
#   "version": "3.0.0"
# }
```

### 5. Test Critical Paths

```bash
# Test workflow execution
curl -X POST http://localhost:3002/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "campaign_launch",
    "platform": "google_ads",
    "campaign": {"name": "Production Test", "budget": 100}
  }'

# Test analytics endpoint
curl http://localhost:3002/api/analytics/summary

# Test SSE connection
curl http://localhost:3002/sse
```

### 6. Verify SSE Connections

- [ ] Open browser to dashboard
- [ ] Check Network tab for SSE connection
- [ ] Verify real-time updates working
- [ ] Test reconnection on disconnect

### 7. Check Database Connection Pool

```bash
# Check PM2 logs
pm2 logs

# Look for database connection messages
# Should see: "✅ Database connected"
```

### 8. Monitor Error Logs (First Hour)

```bash
# Watch logs in real-time
pm2 logs --lines 100

# Check for errors
pm2 logs --err

# Check specific app logs
tail -f logs/error.log
```

## Post-Deployment

### Monitoring Setup

- [ ] PM2 monitoring configured
- [ ] Log rotation enabled (`pm2 install pm2-logrotate`)
- [ ] Error alerting configured
- [ ] Performance metrics dashboard created
- [ ] Database size monitoring enabled

### Verification

- [ ] All workflows execute successfully
- [ ] SSE connections stable
- [ ] Analytics data flowing
- [ ] Webhooks receiving events
- [ ] Notifications sending correctly
- [ ] Agent memory persisting
- [ ] Cross-platform integrations working

### Documentation

- [ ] Production configuration documented
- [ ] Deployment-specific settings noted
- [ ] Backup procedures documented
- [ ] Rollback procedures documented
- [ ] Monitoring dashboards shared

### Communication

- [ ] Announce to users
- [ ] Share new features
- [ ] Document breaking changes (if any)
- [ ] Schedule maintenance windows
- [ ] Provide support channels

### Backup and Recovery

- [ ] Automated backups scheduled
  ```bash
  # Example: Daily backup cron job
  0 2 * * * cp /path/to/ad-ops.db /path/to/backups/ad-ops-$(date +\%Y\%m\%d).db
  ```
- [ ] Backup retention policy set (keep last 30 days)
- [ ] Recovery procedure tested
- [ ] Disaster recovery plan documented

### Performance Tuning

- [ ] Database indexes verified
- [ ] Query performance acceptable (<100ms)
- [ ] API response times acceptable (<500ms)
- [ ] Memory usage stable
- [ ] No memory leaks detected
- [ ] CPU usage within limits

### Security Hardening

- [ ] Firewall rules configured
- [ ] Unnecessary ports closed
- [ ] Rate limiting enabled
- [ ] Input validation enabled
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented (if applicable)

## Rollback Procedure

If deployment fails:

### 1. Stop the Application

```bash
pm2 stop ad-ops-command
```

### 2. Restore Database

```bash
# Restore from backup
cp database/ad-ops.db.backup database/ad-ops.db

# OR rollback migration
npx knex migrate:rollback
```

### 3. Revert Code

```bash
git checkout previous-version
npm install
```

### 4. Restart Application

```bash
pm2 restart ad-ops-command
```

### 5. Verify Health

```bash
curl http://localhost:3002/health
```

## Maintenance Windows

### Weekly Maintenance

- [ ] Review error logs
- [ ] Check database size
- [ ] Verify backup integrity
- [ ] Update dependencies (if needed)
- [ ] Review performance metrics

### Monthly Maintenance

- [ ] Database optimization (`VACUUM` for SQLite)
- [ ] Log cleanup (remove old logs)
- [ ] Security updates
- [ ] Dependency updates
- [ ] Performance review

## Environment Variables Reference

```bash
# Server
NODE_ENV=production
PORT=3002
BASE_URL=https://your-domain.com

# Database
DATABASE_PATH=./database/ad-ops.db

# Google Ads
GOOGLE_ADS_CLIENT_ID=xxx
GOOGLE_ADS_CLIENT_SECRET=xxx
GOOGLE_ADS_DEVELOPER_TOKEN=xxx
GOOGLE_ADS_REFRESH_TOKEN=xxx

# Meta Ads
META_APP_ID=xxx
META_APP_SECRET=xxx
META_ACCESS_TOKEN=xxx

# Pinterest
PINTEREST_APP_ID=xxx
PINTEREST_APP_SECRET=xxx
PINTEREST_ACCESS_TOKEN=xxx

# LinkedIn Ads
LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx
LINKEDIN_ACCESS_TOKEN=xxx

# TikTok
TIKTOK_APP_ID=xxx
TIKTOK_SECRET=xxx
TIKTOK_ACCESS_TOKEN=xxx

# Microsoft Ads
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
MICROSOFT_REFRESH_TOKEN=xxx

# Asana
ASANA_ACCESS_TOKEN=xxx

# Notifications
DISCORD_WEBHOOK_URL=xxx
SLACK_WEBHOOK_URL=xxx
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=xxx

# Security
SESSION_SECRET=xxx
WEBHOOK_SECRET=xxx

# Logging
LOG_LEVEL=info
ERROR_LOG_PATH=./logs/error.log
ACCESS_LOG_PATH=./logs/access.log
```

## PM2 Ecosystem Configuration

`ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'ad-ops-command',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10
  }]
};
```

## Troubleshooting

### Server won't start
- Check `pm2 logs` for errors
- Verify environment variables set
- Check database file permissions
- Ensure port 3002 is available

### Database errors
- Verify database file exists
- Check file permissions
- Run migrations: `npx knex migrate:latest`
- Check disk space

### SSE connections failing
- Check CORS configuration
- Verify reverse proxy settings (if using nginx/apache)
- Check firewall rules
- Increase SSE timeout limits

### High memory usage
- Check for memory leaks in custom code
- Reduce SSE connection limit
- Increase max_memory_restart in PM2 config
- Review database query efficiency

## Success Criteria

✅ **Deployment is successful when:**

1. Health check returns 200 OK
2. All tests passing
3. SSE connections stable
4. Analytics data flowing
5. Workflows executing successfully
6. No errors in logs (first hour)
7. Performance within targets
8. Monitoring dashboards green
9. Backups running
10. Team notified and trained

---

**After completing this checklist, the Ad Ops Command Center is production-ready!** 🚀
