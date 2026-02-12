# Deployment Guide

Complete guide for deploying the Ad Ops Command Center to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Reverse Proxy Configuration](#reverse-proxy-configuration)
6. [SSL/TLS Setup](#ssltls-setup)
7. [Process Management](#process-management)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup Strategy](#backup-strategy)
10. [Scaling Considerations](#scaling-considerations)

---

## Prerequisites

### System Requirements

- **OS:** Linux (Ubuntu 20.04+, Debian 10+, CentOS 7+) or Windows Server
- **Node.js:** v16.0.0 or higher
- **RAM:** Minimum 2GB, recommended 4GB+
- **Disk:** Minimum 10GB free space
- **Network:** Public IP address (if internet-facing)

### Required Tools

```bash
# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Install PM2 (process manager)
sudo npm install -g pm2

# Install build tools (for native dependencies)
sudo apt-get install -y build-essential
```

### API Credentials

Ensure you have credentials for all platforms you'll integrate:

- ✅ Google Ads (Client ID, Secret, Developer Token, Refresh Token)
- ✅ Meta Ads (App ID, Secret, Access Token)
- ✅ Pinterest (App ID, Secret, Access Token)
- ✅ LinkedIn Ads (Client ID, Secret, Access Token)
- ✅ TikTok (App ID, Secret, Access Token)
- ✅ Microsoft Ads (Client ID, Secret, Refresh Token)
- ✅ Asana (Access Token)

---

## Server Setup

### 1. Create Deployment User

```bash
# Create dedicated user
sudo adduser adops
sudo usermod -aG sudo adops

# Switch to deployment user
su - adops
```

### 2. Clone Repository

```bash
# Clone from Git
git clone https://github.com/your-org/ad-ops-command.git
cd ad-ops-command

# OR upload files via SCP/SFTP
# scp -r ./ad-ops-command user@server:/home/adops/
```

### 3. Install Dependencies

```bash
# Install production dependencies
npm install --production

# Verify installation
npm list --depth=0
```

### 4. Create Directory Structure

```bash
# Create necessary directories
mkdir -p logs
mkdir -p database
mkdir -p backups
mkdir -p uploads

# Set permissions
chmod 755 logs database backups uploads
```

---

## Database Setup

### SQLite (Default)

```bash
# Database will be created automatically at:
./database/ad-ops.db

# Ensure directory is writable
chmod 755 database

# Run migrations
npx knex migrate:latest

# Verify migrations
npx knex migrate:status
```

### PostgreSQL (Optional, for scale)

```bash
# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE ad_ops_command;
CREATE USER adops WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ad_ops_command TO adops;
\q

# Update knexfile.js to use PostgreSQL
# See config/knexfile.js for PostgreSQL configuration
```

### MySQL (Optional)

```bash
# Install MySQL
sudo apt-get install -y mysql-server

# Create database
sudo mysql
CREATE DATABASE ad_ops_command;
CREATE USER 'adops'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON ad_ops_command.* TO 'adops'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Update knexfile.js to use MySQL
```

---

## Application Deployment

### 1. Environment Configuration

Create `.env` file:

```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**.env contents:**

```bash
# Server Configuration
NODE_ENV=production
PORT=3002
BASE_URL=https://adops.yourdomain.com

# Database
DATABASE_PATH=./database/ad-ops.db
# OR for PostgreSQL:
# DATABASE_URL=postgresql://adops:password@localhost/ad_ops_command

# Google Ads
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_dev_token
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token

# Meta Ads
META_APP_ID=your_app_id
META_APP_SECRET=your_secret
META_ACCESS_TOKEN=your_access_token

# Pinterest
PINTEREST_APP_ID=your_app_id
PINTEREST_APP_SECRET=your_secret
PINTEREST_ACCESS_TOKEN=your_access_token

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_secret
LINKEDIN_ACCESS_TOKEN=your_access_token

# TikTok
TIKTOK_APP_ID=your_app_id
TIKTOK_SECRET=your_secret
TIKTOK_ACCESS_TOKEN=your_access_token

# Microsoft Ads
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_secret
MICROSOFT_REFRESH_TOKEN=your_refresh_token

# Asana
ASANA_ACCESS_TOKEN=your_access_token

# Notifications
DISCORD_WEBHOOK_URL=your_webhook_url
SLACK_WEBHOOK_URL=your_webhook_url
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your_api_key

# Security
SESSION_SECRET=generate_random_string_here
WEBHOOK_SECRET=generate_random_string_here

# Logging
LOG_LEVEL=info
ERROR_LOG_PATH=./logs/error.log
ACCESS_LOG_PATH=./logs/access.log
```

### 2. Generate Secrets

```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Test Application

```bash
# Start in development mode first
NODE_ENV=development npm start

# Test health endpoint
curl http://localhost:3002/health

# If healthy, stop with Ctrl+C
```

---

## Reverse Proxy Configuration

### Nginx (Recommended)

Install Nginx:

```bash
sudo apt-get install -y nginx
```

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/ad-ops-command
```

**Nginx configuration:**

```nginx
# /etc/nginx/sites-available/ad-ops-command

upstream ad_ops_backend {
    server 127.0.0.1:3002;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name adops.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name adops.yourdomain.com;

    # SSL configuration (add after certbot)
    ssl_certificate /etc/letsencrypt/live/adops.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/adops.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/ad-ops-access.log;
    error_log /var/log/nginx/ad-ops-error.log;

    # Client upload size
    client_max_body_size 50M;

    # SSE specific settings
    location /sse {
        proxy_pass http://ad_ops_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE requires these
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        chunked_transfer_encoding on;
    }

    # API and static files
    location / {
        proxy_pass http://ad_ops_backend;
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

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://ad_ops_backend;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/ad-ops-command /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Apache (Alternative)

```bash
sudo apt-get install -y apache2

# Enable required modules
sudo a2enmod proxy proxy_http proxy_wstunnel headers ssl rewrite

# Create configuration
sudo nano /etc/apache2/sites-available/ad-ops-command.conf
```

**Apache configuration:**

```apache
<VirtualHost *:80>
    ServerName adops.yourdomain.com
    Redirect permanent / https://adops.yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName adops.yourdomain.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/adops.yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/adops.yourdomain.com/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:3002/
    ProxyPassReverse / http://localhost:3002/

    # SSE support
    ProxyPass /sse http://localhost:3002/sse disablereuse=On
    ProxyPassReverse /sse http://localhost:3002/sse

    ErrorLog ${APACHE_LOG_DIR}/ad-ops-error.log
    CustomLog ${APACHE_LOG_DIR}/ad-ops-access.log combined
</VirtualHost>
```

Enable site:

```bash
sudo a2ensite ad-ops-command
sudo systemctl reload apache2
```

---

## SSL/TLS Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate (Nginx)
sudo certbot --nginx -d adops.yourdomain.com

# OR for Apache
sudo certbot --apache -d adops.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Using Custom Certificate

```bash
# Place your certificate files
sudo mkdir -p /etc/ssl/adops
sudo cp your-certificate.crt /etc/ssl/adops/
sudo cp your-private-key.key /etc/ssl/adops/

# Update Nginx/Apache configuration
# ssl_certificate /etc/ssl/adops/your-certificate.crt;
# ssl_certificate_key /etc/ssl/adops/your-private-key.key;
```

---

## Process Management

### Using PM2 (Recommended)

**Start application:**

```bash
# Start with PM2
pm2 start ecosystem.config.js

# OR start directly
pm2 start server.js --name ad-ops-command

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

**PM2 Commands:**

```bash
# Status
pm2 status

# Logs
pm2 logs ad-ops-command
pm2 logs --lines 100

# Restart
pm2 restart ad-ops-command

# Stop
pm2 stop ad-ops-command

# Delete
pm2 delete ad-ops-command

# Monitor
pm2 monit
```

**ecosystem.config.js:**

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
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### Using Systemd (Alternative)

```bash
sudo nano /etc/systemd/system/ad-ops-command.service
```

**Service file:**

```ini
[Unit]
Description=Ad Ops Command Center
After=network.target

[Service]
Type=simple
User=adops
WorkingDirectory=/home/adops/ad-ops-command
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ad-ops-command

[Install]
WantedBy=multi-user.target
```

**Enable service:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable ad-ops-command
sudo systemctl start ad-ops-command
sudo systemctl status ad-ops-command
```

---

## Monitoring & Logging

### PM2 Monitoring

```bash
# Install PM2 web dashboard
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### Application Logs

Logs are stored in `./logs/`:
- `error.log` - Application errors
- `access.log` - HTTP access logs
- `pm2-error.log` - PM2 errors
- `pm2-out.log` - PM2 output

### Log Rotation

```bash
# Install logrotate
sudo nano /etc/logrotate.d/ad-ops-command
```

**Logrotate configuration:**

```
/home/adops/ad-ops-command/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    create 0644 adops adops
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Backup Strategy

### Database Backup

```bash
# Create backup script
nano ~/backup-database.sh
```

**Backup script:**

```bash
#!/bin/bash
BACKUP_DIR=/home/adops/backups
DB_PATH=/home/adops/ad-ops-command/database/ad-ops.db
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
cp $DB_PATH $BACKUP_DIR/ad-ops-$DATE.db

# Compress
gzip $BACKUP_DIR/ad-ops-$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "ad-ops-*.db.gz" -mtime +30 -delete

echo "Backup completed: ad-ops-$DATE.db.gz"
```

**Make executable and schedule:**

```bash
chmod +x ~/backup-database.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/adops/backup-database.sh
```

### Full Application Backup

```bash
#!/bin/bash
tar -czf /home/adops/backups/ad-ops-full-$(date +%Y%m%d).tar.gz \
  /home/adops/ad-ops-command \
  --exclude=node_modules \
  --exclude=logs
```

---

## Scaling Considerations

### Horizontal Scaling

For high traffic, run multiple instances:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ad-ops-command',
    script: 'server.js',
    instances: 4, // or 'max' for all CPU cores
    exec_mode: 'cluster',
    // ... other options
  }]
};
```

### Load Balancing

Use Nginx as load balancer:

```nginx
upstream ad_ops_backend {
    least_conn;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    server 127.0.0.1:3004;
    server 127.0.0.1:3005;
}
```

### Database Scaling

For PostgreSQL/MySQL:
- Use connection pooling (already configured)
- Add read replicas for analytics queries
- Implement caching layer (Redis)

---

## Post-Deployment Verification

```bash
# 1. Health check
curl https://adops.yourdomain.com/health

# 2. Test workflow
curl -X POST https://adops.yourdomain.com/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{"workflow":"campaign_launch","platform":"google_ads","campaign":{"name":"Test","budget":100}}'

# 3. Test SSE
curl https://adops.yourdomain.com/sse

# 4. Check logs
pm2 logs --lines 50

# 5. Monitor performance
pm2 monit
```

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Monitoring

See [MONITORING-GUIDE.md](./MONITORING-GUIDE.md) for comprehensive monitoring setup.

---

**Congratulations! Your Ad Ops Command Center is now deployed to production!** 🚀
