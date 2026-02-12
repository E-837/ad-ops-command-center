# Troubleshooting Guide

Common issues and solutions for the Ad Ops Command Center.

## Table of Contents

1. [Server Issues](#server-issues)
2. [Database Issues](#database-issues)
3. [SSE Connection Issues](#sse-connection-issues)
4. [Workflow Execution Issues](#workflow-execution-issues)
5. [Connector Issues](#connector-issues)
6. [Performance Issues](#performance-issues)
7. [UI Issues](#ui-issues)
8. [Deployment Issues](#deployment-issues)

---

## Server Issues

### Server Won't Start

**Symptoms:**
- `pm2 status` shows stopped or errored
- Port already in use error
- Cannot connect to server

**Solutions:**

1. **Check if port is already in use:**
   ```bash
   # Linux/Mac
   lsof -i :3002
   
   # Windows
   netstat -ano | findstr :3002
   
   # Kill the process using the port
   kill -9 <PID>
   ```

2. **Check environment variables:**
   ```bash
   # Verify .env file exists
   ls -la .env
   
   # Check required variables are set
   cat .env | grep -E "NODE_ENV|PORT|DATABASE"
   ```

3. **Check Node.js version:**
   ```bash
   node --version
   # Should be v16.0.0 or higher
   ```

4. **Check PM2 logs:**
   ```bash
   pm2 logs --err
   pm2 describe ad-ops-command
   ```

5. **Permission issues:**
   ```bash
   # Ensure user has permission to bind to port
   sudo setcap 'cap_net_bind_service=+ep' $(which node)
   ```

### Server Crashes Frequently

**Symptoms:**
- PM2 shows many restarts
- Out of memory errors
- Segmentation faults

**Solutions:**

1. **Check memory usage:**
   ```bash
   pm2 monit
   # If memory is high, increase max_memory_restart in ecosystem.config.js
   ```

2. **Enable core dumps:**
   ```bash
   ulimit -c unlimited
   # Restart server and check for core files
   ```

3. **Check for unhandled promise rejections:**
   ```javascript
   // Add to server.js
   process.on('unhandledRejection', (reason, promise) => {
     console.error('Unhandled Rejection:', reason);
     // Don't exit - log and continue
   });
   ```

4. **Increase memory limit:**
   ```bash
   # In ecosystem.config.js
   max_memory_restart: '2G' // Increase from 1G
   ```

### High CPU Usage

**Symptoms:**
- Server becomes unresponsive
- CPU at 100%
- Slow API responses

**Solutions:**

1. **Profile the application:**
   ```bash
   node --prof server.js
   # After crash, analyze:
   node --prof-process isolate-*.log
   ```

2. **Check for infinite loops:**
   - Review recent code changes
   - Check SSE event loops
   - Review workflow execution logic

3. **Limit concurrent operations:**
   ```javascript
   // Add rate limiting
   const rateLimit = require('express-rate-limit');
   
   app.use('/api/', rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   }));
   ```

---

## Database Issues

### Database Connection Failed

**Symptoms:**
- Error: "SQLITE_CANTOPEN"
- Error: "database is locked"
- 500 errors on all API endpoints

**Solutions:**

1. **Check database file exists:**
   ```bash
   ls -la database/ad-ops.db
   ```

2. **Check file permissions:**
   ```bash
   chmod 644 database/ad-ops.db
   chmod 755 database/
   ```

3. **Check disk space:**
   ```bash
   df -h
   # Ensure sufficient free space
   ```

4. **Database locked:**
   ```bash
   # Find process locking database
   lsof database/ad-ops.db
   
   # If stuck, restart application
   pm2 restart ad-ops-command
   ```

5. **Corrupted database:**
   ```bash
   # Check integrity
   sqlite3 database/ad-ops.db "PRAGMA integrity_check;"
   
   # If corrupted, restore from backup
   cp backups/ad-ops-latest.db.gz .
   gunzip ad-ops-latest.db.gz
   mv ad-ops-latest.db database/ad-ops.db
   ```

### Migration Failures

**Symptoms:**
- Error during `knex migrate:latest`
- Schema mismatch errors

**Solutions:**

1. **Check migration status:**
   ```bash
   npx knex migrate:status
   ```

2. **Rollback and retry:**
   ```bash
   npx knex migrate:rollback
   npx knex migrate:latest
   ```

3. **Force unlock migrations:**
   ```bash
   npx knex migrate:unlock
   ```

4. **Manual migration:**
   ```bash
   # Enter SQLite shell
   sqlite3 database/ad-ops.db
   
   # Check tables
   .tables
   
   # Manually run SQL from migration file
   ```

### Slow Database Queries

**Symptoms:**
- API responses >1 second
- Database timeout errors

**Solutions:**

1. **Add indexes:**
   ```sql
   CREATE INDEX idx_campaigns_platform ON campaigns(platform);
   CREATE INDEX idx_executions_status ON workflow_executions(status);
   CREATE INDEX idx_metrics_timestamp ON metrics(timestamp);
   ```

2. **Optimize queries:**
   ```javascript
   // Use select() to fetch only needed columns
   db('campaigns').select('id', 'name', 'status')
   
   // Use limit() for large datasets
   db('executions').orderBy('created_at', 'desc').limit(100)
   ```

3. **Run VACUUM:**
   ```bash
   sqlite3 database/ad-ops.db "VACUUM;"
   ```

4. **Enable query logging:**
   ```javascript
   // knexfile.js
   development: {
     client: 'sqlite3',
     connection: {
       filename: './database/ad-ops.db'
     },
     debug: true // Enable query logging
   }
   ```

---

## SSE Connection Issues

### SSE Connections Not Established

**Symptoms:**
- Dashboard doesn't update in real-time
- Network tab shows failed SSE connection
- EventSource errors in console

**Solutions:**

1. **Check CORS settings:**
   ```javascript
   // server.js
   app.use(cors({
     origin: ['http://localhost:3002', 'https://yourdomain.com'],
     credentials: true
   }));
   ```

2. **Check reverse proxy configuration:**
   ```nginx
   # Nginx - ensure these are set for /sse
   proxy_buffering off;
   proxy_cache off;
   proxy_read_timeout 86400s;
   chunked_transfer_encoding on;
   ```

3. **Check browser console:**
   - Open DevTools → Network → Filter by "sse"
   - Look for connection errors

4. **Test SSE endpoint directly:**
   ```bash
   curl -N http://localhost:3002/sse
   # Should stay open and receive events
   ```

### SSE Connections Drop Frequently

**Symptoms:**
- Connection resets every few seconds
- "EventSource failed" errors

**Solutions:**

1. **Increase timeouts:**
   ```javascript
   // server.js
   req.socket.setTimeout(0);
   req.socket.setNoDelay(true);
   req.socket.setKeepAlive(true);
   ```

2. **Send keepalive events:**
   ```javascript
   // Send ping every 30 seconds
   setInterval(() => {
     sseManager.broadcast('ping', { timestamp: Date.now() });
   }, 30000);
   ```

3. **Check network stability:**
   - Test with local connection first
   - Check for proxy/firewall interference

### Events Not Received

**Symptoms:**
- SSE connected but no events
- Missing real-time updates

**Solutions:**

1. **Verify event emission:**
   ```javascript
   // Add logging
   console.log('Broadcasting event:', eventType, data);
   sseManager.broadcast(eventType, data);
   ```

2. **Check event listeners:**
   ```javascript
   // Client-side
   eventSource.addEventListener('workflow.completed', (event) => {
     console.log('Received event:', event);
     // ...
   });
   ```

3. **Check SSE manager:**
   ```bash
   curl http://localhost:3002/api/sse/stats
   # Check activeConnections > 0
   ```

---

## Workflow Execution Issues

### Workflows Stuck in "Running" State

**Symptoms:**
- Workflow shows "running" but never completes
- No progress updates

**Solutions:**

1. **Check workflow execution logs:**
   ```bash
   curl http://localhost:3002/api/workflows/executions/{executionId}
   ```

2. **Manually mark as failed:**
   ```javascript
   // In database
   db('workflow_executions')
     .where('id', executionId)
     .update({ status: 'timeout', completed_at: db.fn.now() });
   ```

3. **Add timeout to workflows:**
   ```javascript
   // workflows/campaign_launch.js
   const WORKFLOW_TIMEOUT = 5 * 60 * 1000; // 5 minutes
   
   const timeout = setTimeout(() => {
     throw new Error('Workflow timeout');
   }, WORKFLOW_TIMEOUT);
   
   try {
     // ... workflow execution
   } finally {
     clearTimeout(timeout);
   }
   ```

### Workflow Fails Immediately

**Symptoms:**
- Error: "Workflow not found"
- Error: "Invalid parameters"

**Solutions:**

1. **Check workflow exists:**
   ```bash
   ls workflows/
   # Ensure {workflow_name}.js exists
   ```

2. **Validate input parameters:**
   ```javascript
   // Check required parameters
   if (!workflow || !platform || !campaign) {
     return res.status(400).json({
       error: 'Missing required parameters',
       required: ['workflow', 'platform', 'campaign']
     });
   }
   ```

3. **Check connector configuration:**
   ```javascript
   // Verify connector has credentials
   const connector = connectors[platform];
   if (!connector || !connector.isConfigured()) {
     throw new Error(`Connector ${platform} not configured`);
   }
   ```

---

## Connector Issues

### Google Ads Authentication Failed

**Solutions:**

1. **Regenerate refresh token:**
   ```bash
   node connectors/google-ads/get-refresh-token.js
   ```

2. **Check OAuth scopes:**
   - Ensure all required scopes are granted

3. **Verify credentials:**
   ```bash
   # Test authentication
   node connectors/test-google-ads.js
   ```

### Meta Ads Rate Limit Exceeded

**Solutions:**

1. **Implement exponential backoff:**
   ```javascript
   async function retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (error.code === 'RATE_LIMIT' && i < maxRetries - 1) {
           const delay = Math.pow(2, i) * 1000;
           await sleep(delay);
         } else {
           throw error;
         }
       }
     }
   }
   ```

2. **Check rate limit status:**
   ```javascript
   // Meta provides rate limit headers
   console.log(response.headers['x-app-usage']);
   console.log(response.headers['x-ad-account-usage']);
   ```

### Pinterest API Sandbox Mode

**Symptoms:**
- No real campaigns created
- Test data returned

**Solutions:**

1. **Check environment variable:**
   ```bash
   # Ensure PINTEREST_SANDBOX=false for production
   ```

2. **Verify access token has production access:**
   - Check Pinterest developer dashboard
   - Ensure app is approved for production

---

## Performance Issues

### Slow API Responses

**Solutions:**

1. **Enable caching:**
   ```javascript
   const cache = {};
   const CACHE_TTL = 60 * 1000; // 1 minute
   
   app.get('/api/analytics/summary', (req, res) => {
     const cacheKey = 'analytics:summary';
     
     if (cache[cacheKey] && cache[cacheKey].expires > Date.now()) {
       return res.json(cache[cacheKey].data);
     }
     
     // Fetch data...
     cache[cacheKey] = {
       data: result,
       expires: Date.now() + CACHE_TTL
     };
     
     res.json(result);
   });
   ```

2. **Add pagination:**
   ```javascript
   const page = parseInt(req.query.page) || 1;
   const limit = parseInt(req.query.limit) || 50;
   const offset = (page - 1) * limit;
   
   const results = await db('campaigns')
     .limit(limit)
     .offset(offset);
   ```

3. **Use connection pooling:**
   ```javascript
   // knexfile.js
   pool: {
     min: 2,
     max: 10,
     acquireTimeoutMillis: 30000,
     idleTimeoutMillis: 30000
   }
   ```

### High Memory Usage

**Solutions:**

1. **Find memory leaks:**
   ```bash
   node --inspect server.js
   # Open chrome://inspect
   # Take heap snapshots and compare
   ```

2. **Clear SSE connection registry:**
   ```javascript
   // Remove disconnected clients
   setInterval(() => {
     sseManager.cleanup();
   }, 60000);
   ```

3. **Limit result set sizes:**
   ```javascript
   // Add maximum limits
   const MAX_RESULTS = 1000;
   const limit = Math.min(parseInt(req.query.limit) || 50, MAX_RESULTS);
   ```

---

## UI Issues

### Dashboard Not Loading

**Solutions:**

1. **Check browser console:**
   - Open DevTools → Console
   - Look for JavaScript errors

2. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

3. **Check API endpoint:**
   ```bash
   curl http://localhost:3002/api/analytics/summary
   # Should return JSON
   ```

### Charts Not Rendering

**Solutions:**

1. **Check Chart.js loaded:**
   ```javascript
   // In browser console
   console.log(typeof Chart);
   // Should be "function"
   ```

2. **Check data format:**
   ```javascript
   // Ensure data is in correct format for Chart.js
   console.log(chartData);
   ```

3. **Check canvas element:**
   ```javascript
   const canvas = document.getElementById('chart');
   console.log(canvas); // Should not be null
   ```

---

## Deployment Issues

### PM2 Not Starting on Boot

**Solutions:**

```bash
# Generate startup script
pm2 startup

# Run the command it outputs (will be something like):
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u adops --hp /home/adops

# Save current process list
pm2 save
```

### Nginx 502 Bad Gateway

**Solutions:**

1. **Check backend is running:**
   ```bash
   pm2 status
   curl http://localhost:3002/health
   ```

2. **Check Nginx error log:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Verify proxy_pass URL:**
   ```nginx
   # Should match your backend port
   proxy_pass http://localhost:3002;
   ```

### SSL Certificate Issues

**Solutions:**

1. **Renew Let's Encrypt certificate:**
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

2. **Check certificate expiration:**
   ```bash
   sudo certbot certificates
   ```

3. **Test SSL configuration:**
   ```bash
   sudo nginx -t
   ```

---

## Getting Help

If you're still experiencing issues:

1. **Check logs:**
   ```bash
   pm2 logs --lines 100
   tail -f logs/error.log
   ```

2. **Enable debug mode:**
   ```bash
   NODE_ENV=development DEBUG=* npm start
   ```

3. **Collect diagnostic information:**
   ```bash
   # System info
   node --version
   npm --version
   pm2 --version
   
   # Application status
   pm2 status
   pm2 describe ad-ops-command
   
   # Health check
   curl http://localhost:3002/health
   ```

4. **Open an issue:**
   - Include error messages
   - Include relevant logs
   - Include steps to reproduce
   - Include system information

---

**Remember: Most issues can be resolved by checking logs first!** 📋🔍
