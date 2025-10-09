# 🚀 Digital Ocean Ubuntu Droplet Deployment Guide

**Complete Step-by-Step Guide for Deploying MBZ Tech Platform**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Digital Ocean Droplet](#step-1-create-digital-ocean-droplet)
3. [Step 2: Initial Server Setup](#step-2-initial-server-setup)
4. [Step 3: Install Node.js](#step-3-install-nodejs)
5. [Step 4: Install MongoDB](#step-4-install-mongodb)
6. [Step 5: Install Redis (Optional but Recommended)](#step-5-install-redis-optional-but-recommended)
7. [Step 6: Setup Application User](#step-6-setup-application-user)
8. [Step 7: Deploy Application Code](#step-7-deploy-application-code)
9. [Step 8: Configure Environment Variables](#step-8-configure-environment-variables)
10. [Step 9: Install PM2 Process Manager](#step-9-install-pm2-process-manager)
11. [Step 10: Setup Nginx Reverse Proxy](#step-10-setup-nginx-reverse-proxy)
12. [Step 11: Configure SSL with Let's Encrypt](#step-11-configure-ssl-with-lets-encrypt)
13. [Step 12: Setup Firewall](#step-12-setup-firewall)
14. [Step 13: Start Application](#step-13-start-application)
15. [Step 14: Setup Monitoring & Logs](#step-14-setup-monitoring--logs)
16. [Step 15: Database Backup Strategy](#step-15-database-backup-strategy)
17. [Troubleshooting](#troubleshooting)
18. [Maintenance](#maintenance)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ Digital Ocean account
- ✅ Domain name (recommended) or you can use IP address
- ✅ SSH key pair (for secure access)
- ✅ Local terminal access
- ✅ Basic Linux command knowledge

**Required Information:**
- Your domain name (e.g., `api.yourdomain.com`)
- Email for SSL certificate
- MongoDB connection details (if using external MongoDB like Atlas)

---

## Step 1: Create Digital Ocean Droplet

### 1.1 Create Droplet

1. **Log in to Digital Ocean**
2. **Click "Create" → "Droplets"**
3. **Choose an Image:**
   - Select **Ubuntu 22.04 LTS** (recommended)
   
4. **Choose Droplet Type:**
   - **Development/Testing:** Basic - $12/month (2GB RAM, 1 vCPU, 50GB SSD)
   - **Small Production:** Basic - $18/month (2GB RAM, 2 vCPU, 60GB SSD)
   - **Recommended Production:** Basic - $24/month (4GB RAM, 2 vCPU, 80GB SSD)

5. **Choose a Datacenter Region:**
   - Select closest to your users (e.g., New York, Singapore, London)

6. **Authentication:**
   - Select **SSH Key** (recommended)
   - Or use **Password** (less secure)

7. **Hostname:**
   - Set a meaningful name (e.g., `mbz-production-server`)

8. **Click "Create Droplet"**

### 1.2 Note Down Server Details

After creation, note:
```
Server IP: xxx.xxx.xxx.xxx
SSH Command: ssh root@xxx.xxx.xxx.xxx
```

---

## Step 2: Initial Server Setup

### 2.1 Connect to Your Server

```bash
# SSH into your droplet
ssh root@your_server_ip

# If using SSH key
ssh -i /path/to/your/private/key root@your_server_ip
```

### 2.2 Update System Packages

```bash
# Update package index
apt update

# Upgrade installed packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git build-essential ufw
```

### 2.3 Set Timezone

```bash
# Set timezone (adjust to your preference)
timedatectl set-timezone UTC

# Or use your timezone
# timedatectl set-timezone America/New_York

# Verify
timedatectl
```

### 2.4 Create Swap File (Recommended for servers with <4GB RAM)

```bash
# Create 2GB swap file
fallocate -l 2G /swapfile

# Set permissions
chmod 600 /swapfile

# Setup swap
mkswap /swapfile

# Enable swap
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Verify
swapon --show
free -h
```

---

## Step 3: Install Node.js

### 3.1 Install Node.js 18.x LTS (Recommended)

```bash
# Download and setup NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Install Node.js
apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 3.2 Install Global NPM Packages

```bash
# Install PM2 globally (process manager)
npm install -g pm2

# Install nodemon globally (optional, for development)
npm install -g nodemon

# Verify
pm2 --version
```

---

## Step 4: Install MongoDB

### Option A: Install MongoDB Locally (Recommended for Small/Medium Apps)

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
   tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
apt update

# Install MongoDB
apt install -y mongodb-org

# Start MongoDB
systemctl start mongod

# Enable MongoDB to start on boot
systemctl enable mongod

# Verify MongoDB is running
systemctl status mongod

# Check MongoDB version
mongod --version
```

### Option B: Use MongoDB Atlas (Cloud MongoDB)

If using MongoDB Atlas:
1. Create cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Skip local MongoDB installation
4. Use connection string in `.env` file

### 4.1 Secure MongoDB (If Using Local MongoDB)

```bash
# Connect to MongoDB shell
mongosh

# In MongoDB shell, create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "YourStrongPasswordHere",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})

# Exit MongoDB shell
exit

# Create database and user for your application
mongosh

use mbztech
db.createUser({
  user: "mbzuser",
  pwd: "YourAppPasswordHere",
  roles: [ { role: "readWrite", db: "mbztech" } ]
})
exit

# Enable authentication
nano /etc/mongod.conf

# Add/uncomment these lines:
# security:
#   authorization: enabled

# Restart MongoDB
systemctl restart mongod
```

---

## Step 5: Install Redis (Optional but Recommended)

Redis is recommended for session storage and caching.

```bash
# Install Redis
apt install -y redis-server

# Configure Redis for production
nano /etc/redis/redis.conf

# Find and update these settings:
# supervised systemd
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Restart Redis
systemctl restart redis-server

# Enable Redis on boot
systemctl enable redis-server

# Test Redis
redis-cli ping
# Should return: PONG
```

---

## Step 6: Setup Application User

**Security Best Practice:** Don't run applications as root!

```bash
# Create application user
adduser --disabled-password --gecos "" mbzapp

# Add user to sudo group (optional)
usermod -aG sudo mbzapp

# Create application directory
mkdir -p /var/www/mbztech

# Set ownership
chown -R mbzapp:mbzapp /var/www/mbztech

# Create logs directory
mkdir -p /var/log/mbztech
chown -R mbzapp:mbzapp /var/log/mbztech
```

---

## Step 7: Deploy Application Code

### Option A: Clone from Git (Recommended)

```bash
# Switch to application user
su - mbzapp

# Navigate to application directory
cd /var/www/mbztech

# Clone repository (replace with your repo URL)
git clone https://github.com/yourusername/mbzRevamp.git .

# Or if using private repository
# git clone https://your-username:your-token@github.com/yourusername/mbzRevamp.git .

# Install dependencies
npm install --production

# Exit back to root
exit
```

### Option B: Upload via SCP/SFTP

**From your local machine:**

```bash
# Compress your project
cd /Users/maleo/Documents/Work/mbzRevamp
tar -czf mbztech.tar.gz --exclude=node_modules --exclude=.git .

# Upload to server
scp mbztech.tar.gz root@your_server_ip:/var/www/mbztech/

# On server, extract
ssh root@your_server_ip
cd /var/www/mbztech
tar -xzf mbztech.tar.gz
chown -R mbzapp:mbzapp /var/www/mbztech
su - mbzapp
cd /var/www/mbztech
npm install --production
exit
```

---

## Step 8: Configure Environment Variables

### 8.1 Create .env File

```bash
# Switch to application user
su - mbzapp

# Navigate to application directory
cd /var/www/mbztech

# Create .env file
nano .env
```

### 8.2 Add Environment Variables

```bash
# ========================================
# SERVER CONFIGURATION
# ========================================
NODE_ENV=production
PORT=8800

# ========================================
# DATABASE CONFIGURATION
# ========================================

# Option A: Local MongoDB with authentication
MONGO_URL=mongodb://mbzuser:YourAppPasswordHere@localhost:27017/mbztech?authSource=mbztech

# Option B: MongoDB Atlas (Cloud)
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/mbztech?retryWrites=true&w=majority

# ========================================
# JWT CONFIGURATION
# ========================================
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
JWT_EXPIRE=7d

# ========================================
# EMAIL CONFIGURATION (Nodemailer)
# ========================================

# SMTP Settings (Example with Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# For Gmail, create app-specific password:
# https://support.google.com/accounts/answer/185833

# ========================================
# IMAP CONFIGURATION (Email Receiving)
# ========================================
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-specific-password

# ========================================
# CLOUDINARY CONFIGURATION
# ========================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ========================================
# PAYMENT GATEWAY CONFIGURATION
# ========================================

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=your-public-key
FLUTTERWAVE_SECRET_KEY=your-secret-key
FLUTTERWAVE_ENCRYPTION_KEY=your-encryption-key

# Paystack
PAYSTACK_PUBLIC_KEY=your-public-key
PAYSTACK_SECRET_KEY=your-secret-key

# Squad
SQUAD_PUBLIC_KEY=your-public-key
SQUAD_SECRET_KEY=your-secret-key

# ========================================
# WOOCOMMERCE CONFIGURATION
# ========================================
WOOCOMMERCE_BYPASS_SSL=false

# ========================================
# REDIS CONFIGURATION (Optional)
# ========================================
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your-redis-password (if you set one)

# ========================================
# APPLICATION URLs
# ========================================
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# ========================================
# EXCHANGE RATE API
# ========================================
EXCHANGE_RATE_API_KEY=your-api-key
# Get free key from: https://exchangeratesapi.io/

# ========================================
# CORS SETTINGS
# ========================================
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ========================================
# FILE UPLOAD
# ========================================
MAX_FILE_SIZE=10485760
# 10MB in bytes

# ========================================
# LOGGING
# ========================================
LOG_LEVEL=info
```

### 8.3 Secure .env File

```bash
# Set proper permissions (only owner can read/write)
chmod 600 .env

# Verify
ls -la .env
# Should show: -rw------- mbzapp mbzapp

# Exit back to root
exit
```

---

## Step 9: Install PM2 Process Manager

PM2 keeps your application running and restarts it automatically if it crashes.

### 9.1 Create PM2 Ecosystem File

```bash
# Switch to application user
su - mbzapp
cd /var/www/mbztech

# Create ecosystem config
nano ecosystem.config.js
```

**Add this configuration:**

```javascript
module.exports = {
  apps: [{
    name: 'mbztech-api',
    script: './app.js',
    instances: 2, // or 'max' to use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8800
    },
    error_file: '/var/log/mbztech/error.log',
    out_file: '/var/log/mbztech/out.log',
    log_file: '/var/log/mbztech/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
```

### 9.2 Start Application with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u mbzapp --hp /home/mbzapp

# The above command will output a command to run as root
# Copy that command, exit to root, and run it
exit

# Run the command PM2 provided (will look similar to):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u mbzapp --hp /home/mbzapp
```

### 9.3 Verify PM2 is Running

```bash
# Switch back to mbzapp user
su - mbzapp

# Check PM2 status
pm2 status

# Check logs
pm2 logs mbztech-api

# Monitor in real-time
pm2 monit
```

---

## Step 10: Setup Nginx Reverse Proxy

Nginx will handle incoming requests and forward them to your Node.js application.

### 10.1 Install Nginx

```bash
# Exit to root
exit

# Install Nginx
apt install -y nginx

# Start Nginx
systemctl start nginx

# Enable Nginx on boot
systemctl enable nginx

# Check status
systemctl status nginx
```

### 10.2 Configure Nginx for Your Application

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/mbztech
```

**Add this configuration:**

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

# Upstream configuration
upstream mbztech_backend {
    least_conn;
    server 127.0.0.1:8800 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    
    # Replace with your domain or use _ for any domain
    server_name api.yourdomain.com;
    # or use: server_name _;
    
    # Increase client body size for file uploads
    client_max_body_size 10M;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Logging
    access_log /var/log/nginx/mbztech-access.log;
    error_log /var/log/nginx/mbztech-error.log;
    
    # Root location
    location / {
        # Rate limiting
        limit_req zone=api_limit burst=200 nodelay;
        
        # Proxy headers
        proxy_pass http://mbztech_backend;
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
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://mbztech_backend/api/health;
        access_log off;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 10.3 Enable Nginx Configuration

```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/mbztech /etc/nginx/sites-enabled/

# Remove default Nginx site
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# If test passes, reload Nginx
systemctl reload nginx
```

### 10.4 Test Your Application

```bash
# Test from server
curl http://localhost/api/health

# Test from your browser
# http://your_server_ip/api/health

# Should return:
# {"success":true,"message":"MBZ Tech Platform API is running",...}
```

---

## Step 11: Configure SSL with Let's Encrypt

### 11.1 Point Domain to Server

**Before proceeding, ensure:**
- Your domain DNS A record points to your server IP
- Wait for DNS propagation (can take up to 48 hours, usually faster)
- Test: `ping api.yourdomain.com` should resolve to your server IP

### 11.2 Install Certbot

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d api.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

# Certbot will automatically:
# - Obtain certificate
# - Update Nginx configuration
# - Setup auto-renewal
```

### 11.3 Test SSL

```bash
# Visit your site in browser
# https://api.yourdomain.com/api/health

# Should show secure connection (padlock icon)
```

### 11.4 Setup Auto-Renewal

```bash
# Test renewal
certbot renew --dry-run

# Auto-renewal is already setup via cron/systemd timer
# Check timer
systemctl status certbot.timer
```

---

## Step 12: Setup Firewall

### 12.1 Configure UFW Firewall

```bash
# Allow SSH (important - don't lock yourself out!)
ufw allow OpenSSH

# Allow HTTP
ufw allow 'Nginx HTTP'

# Allow HTTPS
ufw allow 'Nginx HTTPS'

# Enable firewall
ufw enable

# Verify status
ufw status

# Should show:
# Status: active
# To                         Action      From
# --                         ------      ----
# OpenSSH                    ALLOW       Anywhere
# Nginx HTTP                 ALLOW       Anywhere
# Nginx HTTPS                ALLOW       Anywhere
```

---

## Step 13: Start Application

### 13.1 Final Application Start

```bash
# Switch to application user
su - mbzapp

# Navigate to app directory
cd /var/www/mbztech

# Start with PM2
pm2 restart ecosystem.config.js

# Check status
pm2 status

# Check logs
pm2 logs --lines 50

# Exit
exit
```

### 13.2 Verify Everything is Running

```bash
# Check all services
systemctl status nginx
systemctl status mongod
systemctl status redis-server

# Check PM2
su - mbzapp
pm2 status
pm2 logs --lines 20
exit
```

---

## Step 14: Setup Monitoring & Logs

### 14.1 Setup PM2 Monitoring (Optional)

```bash
# Switch to application user
su - mbzapp

# Link to PM2 Plus for monitoring (optional)
pm2 link your_secret_key your_public_key

# Or use local monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

exit
```

### 14.2 Setup Log Rotation for Nginx

```bash
# Nginx logs are already rotated by default
# Check configuration
cat /etc/logrotate.d/nginx
```

### 14.3 Monitor System Resources

```bash
# Install htop for better monitoring
apt install -y htop

# View processes
htop

# View disk usage
df -h

# View memory usage
free -h

# View MongoDB status
systemctl status mongod
```

---

## Step 15: Database Backup Strategy

### 15.1 Create Backup Script

```bash
# Create backup directory
mkdir -p /var/backups/mongodb

# Create backup script
nano /usr/local/bin/backup-mongodb.sh
```

**Add this script:**

```bash
#!/bin/bash

# MongoDB backup script
BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="mbztech"
DB_USER="mbzuser"
DB_PASS="YourAppPasswordHere"

# Create backup
mongodump --username=$DB_USER --password=$DB_PASS --db=$DB_NAME --out=$BACKUP_DIR/$TIMESTAMP

# Compress backup
tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz -C $BACKUP_DIR $TIMESTAMP

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$TIMESTAMP

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$TIMESTAMP.tar.gz"
```

### 15.2 Make Script Executable

```bash
chmod +x /usr/local/bin/backup-mongodb.sh

# Test backup
/usr/local/bin/backup-mongodb.sh

# Verify backup exists
ls -lh /var/backups/mongodb/
```

### 15.3 Setup Automated Backups

```bash
# Create cron job for daily backups at 3 AM
crontab -e

# Add this line:
# 0 3 * * * /usr/local/bin/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

---

## Step 16: Post-Deployment Tasks

### 16.1 Run Database Seed Scripts (If Needed)

```bash
su - mbzapp
cd /var/www/mbztech

# Seed notification templates
node scripts/seedNotificationTemplates.js

# Seed task templates
node scripts/seedTaskNotificationTemplates.js

# Any other seed scripts you need
# node scripts/seedDefaultTemplates.js

exit
```

### 16.2 Test All Critical Endpoints

```bash
# Health check
curl https://api.yourdomain.com/api/health

# Test registration endpoint
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "fullName": "Test User"
  }'

# Test other endpoints as needed
```

---

## Troubleshooting

### Issue: Application Not Starting

```bash
# Check PM2 logs
su - mbzapp
pm2 logs mbztech-api --lines 100

# Check if port is in use
netstat -tulpn | grep 8800

# Check .env file exists and has correct permissions
ls -la /var/www/mbztech/.env
```

### Issue: Cannot Connect to MongoDB

```bash
# Check MongoDB status
systemctl status mongod

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Try connecting manually
mongosh -u mbzuser -p --authenticationDatabase mbztech

# Check MongoDB is listening
netstat -tulpn | grep 27017
```

### Issue: Nginx Returns 502 Bad Gateway

```bash
# Check if Node.js app is running
su - mbzapp
pm2 status

# Check Nginx error logs
tail -f /var/log/nginx/mbztech-error.log

# Test upstream connection
curl http://localhost:8800/api/health

# Restart Nginx
systemctl restart nginx
```

### Issue: SSL Certificate Issues

```bash
# Check certificate status
certbot certificates

# Renew certificate manually
certbot renew

# Check Nginx SSL configuration
nginx -t

# Check if ports are open
ufw status
```

### Issue: High Memory Usage

```bash
# Check memory
free -h

# Check which process is using memory
htop

# Restart PM2
su - mbzapp
pm2 restart all

# Consider increasing server RAM or optimizing app
```

---

## Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check application logs: `pm2 logs`
- Monitor server resources: `htop`

**Weekly:**
- Check disk space: `df -h`
- Review Nginx access logs for unusual activity
- Check for failed login attempts: `/var/log/auth.log`

**Monthly:**
- Update system packages: `apt update && apt upgrade`
- Review and rotate old logs
- Test backup restoration
- Review PM2 metrics
- Check SSL certificate expiration

### Updating Application Code

```bash
# Switch to application user
su - mbzapp
cd /var/www/mbztech

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --production

# Run database migrations if any
# node scripts/migrate.js

# Restart application
pm2 restart mbztech-api

# Check logs
pm2 logs --lines 50

exit
```

### Scaling Your Application

**Vertical Scaling (Upgrade Server):**
```bash
# On Digital Ocean dashboard:
# 1. Power off droplet
# 2. Resize to larger plan
# 3. Power on
# 4. Verify application starts correctly
```

**Horizontal Scaling (Load Balancer):**
```bash
# 1. Create multiple droplets with same setup
# 2. Setup Digital Ocean Load Balancer
# 3. Point load balancer to all droplets
# 4. Update DNS to point to load balancer
```

---

## Security Checklist

- ✅ SSH key authentication enabled
- ✅ Root login disabled (recommended: `PermitRootLogin no` in `/etc/ssh/sshd_config`)
- ✅ Firewall configured (UFW)
- ✅ SSL certificate installed
- ✅ MongoDB authentication enabled
- ✅ Strong passwords for all services
- ✅ Application runs as non-root user
- ✅ Regular security updates
- ✅ Fail2ban installed (optional but recommended)
- ✅ Rate limiting configured in Nginx

### Install Fail2ban (Recommended)

```bash
# Install fail2ban
apt install -y fail2ban

# Configure
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
nano /etc/fail2ban/jail.local

# Enable for SSH and Nginx
# [sshd]
# enabled = true
# [nginx-http-auth]
# enabled = true

# Start fail2ban
systemctl start fail2ban
systemctl enable fail2ban

# Check status
fail2ban-client status
```

---

## Quick Reference Commands

### Application Management
```bash
# Start application
su - mbzapp && pm2 start ecosystem.config.js

# Stop application
su - mbzapp && pm2 stop mbztech-api

# Restart application
su - mbzapp && pm2 restart mbztech-api

# View logs
su - mbzapp && pm2 logs mbztech-api

# View status
su - mbzapp && pm2 status
```

### Service Management
```bash
# Nginx
systemctl status nginx
systemctl restart nginx
systemctl reload nginx

# MongoDB
systemctl status mongod
systemctl restart mongod

# Redis
systemctl status redis-server
systemctl restart redis-server
```

### Monitoring
```bash
# System resources
htop
free -h
df -h

# Network connections
netstat -tulpn

# Active processes
ps aux | grep node
```

---

## Additional Resources

- **Digital Ocean Documentation:** https://docs.digitalocean.com/
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **MongoDB Documentation:** https://docs.mongodb.com/
- **Let's Encrypt Documentation:** https://letsencrypt.org/docs/

---

## Support & Next Steps

Your MBZ Tech Platform is now deployed! 🎉

**Next Steps:**
1. Test all API endpoints thoroughly
2. Setup monitoring alerts (consider services like UptimeRobot)
3. Configure email notifications for server issues
4. Setup automated database backups to external storage (S3, Dropbox)
5. Document your deployment configuration
6. Setup staging environment for testing updates

**Need Help?**
- Check application logs: `/var/log/mbztech/`
- Check Nginx logs: `/var/log/nginx/`
- Check MongoDB logs: `/var/log/mongodb/`
- Check system logs: `/var/log/syslog`

---

**Deployment Guide Version:** 1.0  
**Last Updated:** October 2025  
**Platform:** Digital Ocean Ubuntu 22.04 LTS

