#!/bin/bash

################################################################################
# MBZ Tech Platform - Automated Server Setup Script
# 
# This script automates the initial server setup for Ubuntu 22.04
# Run this script as root on your fresh Digital Ocean droplet
#
# Usage: bash server-setup.sh
################################################################################

set -e  # Exit on error

echo "=================================="
echo "MBZ Tech Platform Server Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_success "Running as root"

# Get domain name
print_info "Enter your domain name (e.g., api.yourdomain.com) or press Enter to skip:"
read DOMAIN_NAME

# Get email for SSL
if [ ! -z "$DOMAIN_NAME" ]; then
    print_info "Enter your email for SSL certificate:"
    read SSL_EMAIL
fi

# Get MongoDB password
print_info "Enter password for MongoDB user (or press Enter for auto-generated):"
read MONGO_PASSWORD
if [ -z "$MONGO_PASSWORD" ]; then
    MONGO_PASSWORD=$(openssl rand -base64 32)
    print_info "Generated MongoDB password: $MONGO_PASSWORD"
fi

# Get JWT secret
print_info "Enter JWT secret (or press Enter for auto-generated):"
read JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 64)
    print_info "Generated JWT secret (save this securely)"
fi

echo ""
print_info "Starting server setup..."
echo ""

# Update system
print_info "Updating system packages..."
apt update -qq
apt upgrade -y -qq
print_success "System updated"

# Install essential tools
print_info "Installing essential tools..."
apt install -y -qq curl wget git build-essential ufw htop
print_success "Essential tools installed"

# Set timezone
print_info "Setting timezone to UTC..."
timedatectl set-timezone UTC
print_success "Timezone set to UTC"

# Create swap file (2GB)
if [ ! -f /swapfile ]; then
    print_info "Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile > /dev/null
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab > /dev/null
    print_success "Swap file created"
else
    print_info "Swap file already exists"
fi

# Install Node.js 18.x
print_info "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
apt install -y -qq nodejs
print_success "Node.js $(node --version) installed"

# Install PM2
print_info "Installing PM2..."
npm install -g pm2 > /dev/null 2>&1
print_success "PM2 installed"

# Install MongoDB
print_info "Installing MongoDB 6.0..."
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor 2>/dev/null

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
   tee /etc/apt/sources.list.d/mongodb-org-6.0.list > /dev/null

apt update -qq
apt install -y -qq mongodb-org
systemctl start mongod
systemctl enable mongod
print_success "MongoDB installed and started"

# Configure MongoDB authentication
print_info "Configuring MongoDB authentication..."
sleep 3  # Wait for MongoDB to start

mongosh --quiet --eval "
use admin;
db.createUser({
  user: 'admin',
  pwd: '$MONGO_PASSWORD',
  roles: [ { role: 'userAdminAnyDatabase', db: 'admin' }, 'readWriteAnyDatabase' ]
});
use mbztech;
db.createUser({
  user: 'mbzuser',
  pwd: '$MONGO_PASSWORD',
  roles: [ { role: 'readWrite', db: 'mbztech' } ]
});
" > /dev/null 2>&1

# Enable MongoDB authentication
sed -i 's/#security:/security:\n  authorization: enabled/' /etc/mongod.conf
systemctl restart mongod
print_success "MongoDB authentication configured"

# Install Redis
print_info "Installing Redis..."
apt install -y -qq redis-server
systemctl enable redis-server
systemctl start redis-server
print_success "Redis installed and started"

# Install Nginx
print_info "Installing Nginx..."
apt install -y -qq nginx
systemctl enable nginx
systemctl start nginx
print_success "Nginx installed and started"

# Create application user
print_info "Creating application user 'mbzapp'..."
if id "mbzapp" &>/dev/null; then
    print_info "User 'mbzapp' already exists"
else
    adduser --disabled-password --gecos "" mbzapp
    print_success "User 'mbzapp' created"
fi

# Create application directories
print_info "Creating application directories..."
mkdir -p /var/www/mbztech
mkdir -p /var/log/mbztech
chown -R mbzapp:mbzapp /var/www/mbztech
chown -R mbzapp:mbzapp /var/log/mbztech
print_success "Directories created"

# Create .env template
print_info "Creating .env template..."
cat > /var/www/mbztech/.env.example << EOF
# ========================================
# SERVER CONFIGURATION
# ========================================
NODE_ENV=production
PORT=8800

# ========================================
# DATABASE CONFIGURATION
# ========================================
MONGO_URL=mongodb://mbzuser:${MONGO_PASSWORD}@localhost:27017/mbztech?authSource=mbztech

# ========================================
# JWT CONFIGURATION
# ========================================
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d

# ========================================
# EMAIL CONFIGURATION
# ========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# ========================================
# CLOUDINARY CONFIGURATION
# ========================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ========================================
# PAYMENT GATEWAYS
# ========================================
FLUTTERWAVE_PUBLIC_KEY=your-public-key
FLUTTERWAVE_SECRET_KEY=your-secret-key
PAYSTACK_PUBLIC_KEY=your-public-key
PAYSTACK_SECRET_KEY=your-secret-key

# ========================================
# REDIS
# ========================================
REDIS_HOST=localhost
REDIS_PORT=6379

# ========================================
# URLs
# ========================================
FRONTEND_URL=https://${DOMAIN_NAME:-yourdomain.com}
BACKEND_URL=https://${DOMAIN_NAME:-api.yourdomain.com}
EOF

chown mbzapp:mbzapp /var/www/mbztech/.env.example
print_success ".env template created at /var/www/mbztech/.env.example"

# Configure firewall
print_info "Configuring firewall..."
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx HTTP'
ufw allow 'Nginx HTTPS'
print_success "Firewall configured"

# Create Nginx configuration
if [ ! -z "$DOMAIN_NAME" ]; then
    print_info "Creating Nginx configuration for $DOMAIN_NAME..."
    cat > /etc/nginx/sites-available/mbztech << EOF
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=100r/s;

upstream mbztech_backend {
    least_conn;
    server 127.0.0.1:8800 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_NAME};
    
    client_max_body_size 10M;
    
    access_log /var/log/nginx/mbztech-access.log;
    error_log /var/log/nginx/mbztech-error.log;
    
    location / {
        limit_req zone=api_limit burst=200 nodelay;
        proxy_pass http://mbztech_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/mbztech /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl reload nginx
    print_success "Nginx configured for $DOMAIN_NAME"
fi

# Install Certbot for SSL
if [ ! -z "$DOMAIN_NAME" ]; then
    print_info "Installing Certbot..."
    apt install -y -qq certbot python3-certbot-nginx
    print_success "Certbot installed"
    
    print_info "To obtain SSL certificate, run:"
    echo "  certbot --nginx -d $DOMAIN_NAME --email $SSL_EMAIL --agree-tos --non-interactive"
fi

# Create backup script
print_info "Creating backup script..."
cat > /usr/local/bin/backup-mongodb.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="mbztech"

mkdir -p $BACKUP_DIR

mongodump --username=mbzuser --password=${MONGO_PASSWORD} --db=$DB_NAME --out=$BACKUP_DIR/$TIMESTAMP > /dev/null 2>&1

tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz -C $BACKUP_DIR $TIMESTAMP
rm -rf $BACKUP_DIR/$TIMESTAMP
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "$(date): Backup completed - backup_$TIMESTAMP.tar.gz" >> /var/log/mongodb-backup.log
EOF

chmod +x /usr/local/bin/backup-mongodb.sh
mkdir -p /var/backups/mongodb
print_success "Backup script created at /usr/local/bin/backup-mongodb.sh"

# Create PM2 ecosystem template
print_info "Creating PM2 ecosystem template..."
cat > /var/www/mbztech/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mbztech-api',
    script: './app.js',
    instances: 2,
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
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

chown mbzapp:mbzapp /var/www/mbztech/ecosystem.config.js
print_success "PM2 ecosystem config created"

echo ""
echo "=================================="
print_success "Server setup complete!"
echo "=================================="
echo ""
echo "📝 IMPORTANT CREDENTIALS - SAVE THESE SECURELY:"
echo "   MongoDB Password: $MONGO_PASSWORD"
echo "   JWT Secret: $JWT_SECRET"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Deploy your application code to /var/www/mbztech/"
echo "   Option A: git clone https://your-repo.git /var/www/mbztech/"
echo "   Option B: scp your code to the server"
echo ""
echo "2. Copy and configure environment variables:"
echo "   cd /var/www/mbztech"
echo "   cp .env.example .env"
echo "   nano .env  # Edit with your actual credentials"
echo ""
echo "3. Install dependencies:"
echo "   su - mbzapp"
echo "   cd /var/www/mbztech"
echo "   npm install --production"
echo ""
echo "4. Start the application:"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup systemd -u mbzapp --hp /home/mbzapp"
echo ""
if [ ! -z "$DOMAIN_NAME" ]; then
echo "5. Obtain SSL certificate:"
echo "   certbot --nginx -d $DOMAIN_NAME"
echo ""
fi
echo "6. Check application status:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "7. Test your API:"
if [ ! -z "$DOMAIN_NAME" ]; then
echo "   curl http://$DOMAIN_NAME/api/health"
else
echo "   curl http://localhost/api/health"
fi
echo ""
echo "=================================="

