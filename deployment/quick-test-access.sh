#!/bin/bash

echo "🚀 Quick Test Environment Access"
echo "==============================="

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

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
print_info "Setting up quick access to your test environment"
echo ""

# Step 1: Check if test environment is running
print_info "Step 1: Checking test environment status..."

cd /var/www/mbztech-test

# Check if PM2 process is running
if pm2 list | grep -q "mbztech-test-api"; then
    print_success "Test environment is running"
    pm2 status mbztech-test-api
else
    print_info "Starting test environment..."
    pm2 start ecosystem.test.config.js --env test
    sleep 3
fi

# Step 2: Test local access
print_info "Step 2: Testing local access..."

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:8801/api/health)
if [[ $HEALTH_RESPONSE == *"success"* ]]; then
    print_success "Test API is responding locally"
else
    print_info "Test API might not be ready yet. Starting..."
    pm2 restart mbztech-test-api
    sleep 5
fi

# Step 3: Configure Nginx for IP access
print_info "Step 3: Configuring Nginx for IP access..."

# Create simple Nginx config for IP access
cat > /etc/nginx/sites-available/test-api-ip << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    location /test-api/ {
        proxy_pass http://localhost:8801/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With, Accept, Origin' always;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/test-api-ip /etc/nginx/sites-enabled/

# Test and reload Nginx
nginx -t && systemctl reload nginx

print_success "Nginx configured for IP access"

# Step 4: Show access URLs
print_success "Test environment access configured!"
echo ""
echo "🎉 Your test environment is accessible via:"
echo ""
echo "📋 Local Access (from server):"
echo "  🌐 http://localhost:8801/api/health"
echo "  🔐 http://localhost:8801/api/auth/login"
echo "  📖 http://localhost:8801/api-docs"
echo ""
echo "📋 External Access (from anywhere):"
echo "  🌐 http://$SERVER_IP/test-api/api/health"
echo "  🔐 http://$SERVER_IP/test-api/api/auth/login"
echo "  📖 http://$SERVER_IP/test-api/api-docs"
echo ""
echo "📋 Production Environment (for comparison):"
echo "  🌐 https://api.elapix.store/api/health"
echo "  🔐 https://api.elapix.store/api/auth/login"
echo "  📖 https://api.elapix.store/api-docs"
echo ""
echo "🧪 Test Commands:"
echo "  # Test health endpoint"
echo "  curl http://$SERVER_IP/test-api/api/health"
echo ""
echo "  # Test from your local machine"
echo "  curl http://$SERVER_IP/test-api/api/health"
echo ""
echo "💡 Management Commands:"
echo "  # Start test environment"
echo "  cd /var/www/mbztech-test && ./start-test.sh"
echo ""
echo "  # Stop test environment"
echo "  cd /var/www/mbztech-test && ./stop-test.sh"
echo ""
echo "  # View test logs"
echo "  cd /var/www/mbztech-test && ./logs-test.sh"
echo ""
echo "🔧 For Custom Domain Setup:"
echo "  Run: ./deployment/setup-test-domain.sh"
echo "  This will set up: https://test-api.elapix.store"
