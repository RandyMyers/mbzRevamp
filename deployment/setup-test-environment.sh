#!/bin/bash

echo "🧪 Setting up Test Environment"
echo "============================="

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

# Navigate to the application directory
cd /var/www/mbztech

echo ""
print_info "This script will set up a separate test environment for your application"
echo ""

# Step 1: Create test directory structure
print_info "Step 1: Creating test environment directory structure..."

# Create test directory
mkdir -p /var/www/mbztech-test
cd /var/www/mbztech-test

# Clone the repository for test environment
print_info "Cloning repository for test environment..."
git clone https://github.com/RandyMyers/mbzRevamp.git .

# Install dependencies
print_info "Installing dependencies for test environment..."
npm install

print_success "Test environment directory created"

# Step 2: Create test environment configuration
print_info "Step 2: Creating test environment configuration..."

# Create test .env file
cat > .env << EOF
# ========================================
# TEST ENVIRONMENT CONFIGURATION
# ========================================
NODE_ENV=test
PORT=8801

# ========================================
# DATABASE CONFIGURATION (TEST)
# ========================================
MONGO_URL=mongodb://127.0.0.1:27017/MBZCRM_TEST

# ========================================
# JWT CONFIGURATION
# ========================================
JWT_SECRET=test_jwt_secret_key_2024_mbztech
JWT_EXPIRE=7d

# ========================================
# EMAIL CONFIGURATION (TEST)
# ========================================
# Use a test email service or disable email sending
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=test@mbztechnology.com
SMTP_PASS=test_password

# SendGrid for test (optional)
SENDGRID_API_KEY=your_test_sendgrid_key
SENDGRID_SENDER_EMAIL=test@mbztechnology.com

# ========================================
# CLOUDINARY CONFIGURATION (TEST)
# ========================================
CLOUDINARY_CLOUD_NAME=your_test_cloud_name
CLOUDINARY_API_KEY=your_test_api_key
CLOUDINARY_API_SECRET=your_test_api_secret

# ========================================
# API CONFIGURATION
# ========================================
API_KEY=test_api_key_2024

# ========================================
# EXCHANGE RATE API (TEST)
# ========================================
EXCHANGE_RATE_API_KEY=your_test_exchange_rate_key
EXCHANGE_RATE_API_URL=https://v6.exchangerate-api.com/v6
EXCHANGE_RATE_CACHE_TTL=3600
EOF

print_success "Test environment configuration created"

# Step 3: Set up test database
print_info "Step 3: Setting up test database..."

# Create test database
mongosh --eval "
use MBZCRM_TEST;
db.createCollection('test_collection');
db.test_collection.insertOne({message: 'Test database created', timestamp: new Date()});
print('Test database MBZCRM_TEST created successfully');
"

print_success "Test database created"

# Step 4: Create PM2 ecosystem file for test
print_info "Step 4: Creating PM2 configuration for test environment..."

cat > ecosystem.test.config.js << EOF
module.exports = {
  apps: [{
    name: 'mbztech-test-api',
    script: 'app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'test',
      PORT: 8801
    },
    env_test: {
      NODE_ENV: 'test',
      PORT: 8801
    },
    error_file: '/var/log/mbztech/test-error.log',
    out_file: '/var/log/mbztech/test-out.log',
    log_file: '/var/log/mbztech/test-combined.log',
    time: true
  }]
};
EOF

print_success "PM2 test configuration created"

# Step 5: Create log directories
print_info "Step 5: Creating log directories..."
mkdir -p /var/log/mbztech
chown -R root:root /var/log/mbztech

# Step 6: Start test service
print_info "Step 6: Starting test service..."
pm2 start ecosystem.test.config.js --env test

# Wait for startup
sleep 5

# Check status
pm2 status

print_success "Test service started"

# Step 7: Configure Nginx for test environment
print_info "Step 7: Configuring Nginx for test environment..."

# Create Nginx configuration for test
cat > /etc/nginx/sites-available/mbztech-test << EOF
server {
    listen 80;
    server_name test-api.elapix.store;

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
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/mbztech-test /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    print_success "Nginx configured for test environment"
else
    print_warning "Nginx configuration test failed. Please check manually."
fi

# Step 8: Create test data seeding script
print_info "Step 8: Creating test data seeding script..."

cat > seed-test-data.js << EOF
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to test database
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ Connected to test database');
    return seedTestData();
  })
  .catch(console.error)
  .finally(() => {
    mongoose.disconnect();
  });

async function seedTestData() {
  try {
    console.log('🌱 Seeding test data...');
    
    // Add your test data seeding logic here
    // For example:
    
    // Test users
    const User = mongoose.model('User', new mongoose.Schema({
      fullName: String,
      email: String,
      role: String,
      organization: String,
      createdAt: { type: Date, default: Date.now }
    }));
    
    // Create test users
    await User.create([
      {
        fullName: 'Test Admin',
        email: 'admin@test.com',
        role: 'admin',
        organization: 'Test Organization'
      },
      {
        fullName: 'Test User',
        email: 'user@test.com',
        role: 'user',
        organization: 'Test Organization'
      }
    ]);
    
    console.log('✅ Test data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  }
}
EOF

print_success "Test data seeding script created"

# Step 9: Create management scripts
print_info "Step 9: Creating management scripts..."

# Create start test script
cat > start-test.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting test environment..."
cd /var/www/mbztech-test
pm2 start ecosystem.test.config.js --env test
pm2 status
EOF

# Create stop test script
cat > stop-test.sh << 'EOF'
#!/bin/bash
echo "⏹️  Stopping test environment..."
pm2 stop mbztech-test-api
pm2 status
EOF

# Create restart test script
cat > restart-test.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting test environment..."
pm2 restart mbztech-test-api
pm2 status
EOF

# Create logs script
cat > logs-test.sh << 'EOF'
#!/bin/bash
echo "📝 Showing test environment logs..."
pm2 logs mbztech-test-api --lines 50
EOF

# Make scripts executable
chmod +x start-test.sh stop-test.sh restart-test.sh logs-test.sh

print_success "Management scripts created"

# Step 10: Test the setup
print_info "Step 10: Testing the setup..."

# Test API endpoint
curl -s http://localhost:8801/api/health | head -5

if [ $? -eq 0 ]; then
    print_success "Test API is responding"
else
    print_warning "Test API might not be ready yet. Check logs with: pm2 logs mbztech-test-api"
fi

print_success "Test environment setup completed!"
echo ""
echo "🎉 Your test environment is ready!"
echo ""
echo "📋 Test Environment Details:"
echo "  🌐 Test API URL: http://localhost:8801"
echo "  🌐 Test API Domain: test-api.elapix.store (if DNS configured)"
echo "  🗄️  Test Database: MBZCRM_TEST"
echo "  📁 Test Directory: /var/www/mbztech-test"
echo "  📝 PM2 Process: mbztech-test-api"
echo ""
echo "🔧 Management Commands:"
echo "  Start:   cd /var/www/mbztech-test && ./start-test.sh"
echo "  Stop:    cd /var/www/mbztech-test && ./stop-test.sh"
echo "  Restart: cd /var/www/mbztech-test && ./restart-test.sh"
echo "  Logs:    cd /var/www/mbztech-test && ./logs-test.sh"
echo ""
echo "🧪 Test Endpoints:"
echo "  Health:  http://localhost:8801/api/health"
echo "  Auth:    http://localhost:8801/api/auth/login"
echo "  Docs:    http://localhost:8801/api-docs"
echo ""
echo "💡 Next Steps:"
echo "  1. Configure DNS for test-api.elapix.store (optional)"
echo "  2. Update CORS to include test domain"
echo "  3. Seed test data: node seed-test-data.js"
echo "  4. Test all functionality in test environment"
echo "  5. Set up CI/CD to deploy to test first"
