#!/bin/bash

echo "🌐 Setting up Test Domain"
echo "========================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
print_info "Setting up test domain for your test environment"
echo ""

# Step 1: Create Nginx configuration for test domain
print_info "Step 1: Creating Nginx configuration for test domain..."

cat > /etc/nginx/sites-available/test-api.elapix.store << EOF
server {
    listen 80;
    server_name test-api.elapix.store;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name test-api.elapix.store;

    # SSL configuration (will be set up by certbot)
    ssl_certificate /etc/letsencrypt/live/test-api.elapix.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/test-api.elapix.store/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy to test API
    location / {
        proxy_pass http://localhost:8801;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers for test environment
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With, Accept, Origin' always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With, Accept, Origin';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/test-api.elapix.store /etc/nginx/sites-enabled/

print_success "Nginx configuration created"

# Step 2: Test Nginx configuration
print_info "Step 2: Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    print_success "Nginx configuration is valid and reloaded"
else
    print_warning "Nginx configuration test failed. Please check manually."
fi

# Step 3: SSL Certificate setup
print_info "Step 3: Setting up SSL certificate..."

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    print_info "Installing certbot..."
    apt update -qq
    apt install -y -qq certbot python3-certbot-nginx
fi

# Get SSL certificate
print_info "Getting SSL certificate for test-api.elapix.store..."
certbot --nginx -d test-api.elapix.store --non-interactive --agree-tos --email admin@elapix.store

if [ $? -eq 0 ]; then
    print_success "SSL certificate obtained and configured"
else
    print_warning "SSL certificate setup failed. You can set it up manually later."
fi

# Step 4: Update CORS configuration
print_info "Step 4: Updating CORS configuration for test domain..."

# Navigate to production app directory
cd /var/www/mbztech

# Backup current app.js
cp app.js app.js.backup-$(date +%Y%m%d-%H%M%S)

# Update CORS to include test domain
sed -i '/https:\/\/elapix\.store/a\      "https://test-api.elapix.store"' app.js

print_success "CORS configuration updated"

# Step 5: Restart services
print_info "Step 5: Restarting services..."

# Restart test environment
cd /var/www/mbztech-test
pm2 restart mbztech-test-api

# Restart production environment
cd /var/www/mbztech
pm2 restart mbztech-api

# Reload Nginx
systemctl reload nginx

print_success "Services restarted"

# Step 6: Test the setup
print_info "Step 6: Testing the setup..."

# Test HTTP redirect
echo "Testing HTTP redirect..."
curl -I http://test-api.elapix.store/api/health 2>/dev/null | head -3

# Test HTTPS endpoint
echo "Testing HTTPS endpoint..."
curl -s https://test-api.elapix.store/api/health | head -3

print_success "Test domain setup completed!"
echo ""
echo "🎉 Your test environment is now accessible via:"
echo ""
echo "📋 Test Environment URLs:"
echo "  🌐 Test API: https://test-api.elapix.store"
echo "  🔍 Health Check: https://test-api.elapix.store/api/health"
echo "  🔐 Auth Endpoint: https://test-api.elapix.store/api/auth/login"
echo "  📖 API Docs: https://test-api.elapix.store/api-docs"
echo ""
echo "📋 Production Environment URLs:"
echo "  🌐 Production API: https://api.elapix.store"
echo "  🔍 Health Check: https://api.elapix.store/api/health"
echo "  🔐 Auth Endpoint: https://api.elapix.store/api/auth/login"
echo "  📖 API Docs: https://api.elapix.store/api-docs"
echo ""
echo "🔧 DNS Configuration Required:"
echo "  Add this DNS record to your domain:"
echo "  test-api.elapix.store → $SERVER_IP"
echo ""
echo "💡 Next Steps:"
echo "  1. Add DNS record: test-api.elapix.store → $SERVER_IP"
echo "  2. Wait for DNS propagation (5-15 minutes)"
echo "  3. Test your endpoints"
echo "  4. Update your frontend to use test domain for testing"
echo ""
echo "⚠️  Note: SSL certificate will be automatically renewed by certbot"
