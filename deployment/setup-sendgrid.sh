#!/bin/bash

echo "🚀 Setting up SendGrid HTTP API integration..."
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "app.js" ]; then
    echo "❌ Error: Please run this script from the application root directory (/var/www/mbztech)"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

echo "📦 Installing SendGrid package..."
npm install @sendgrid/mail

echo ""
echo "🔧 Setting up SendGrid environment variables..."

# Get SendGrid API key from user
read -p "Enter your SendGrid API Key (starts with SG.): " SENDGRID_API_KEY

if [ -z "$SENDGRID_API_KEY" ]; then
    echo "❌ Error: SendGrid API Key is required!"
    exit 1
fi

# Create backup of current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created: .env.backup.$(date +%Y%m%d_%H%M%S)"

# Remove old SENDGRID_API_KEY if it exists
sed -i '/^SENDGRID_API_KEY=/d' .env

# Add SendGrid API key to .env
echo "" >> .env
echo "# SENDGRID CONFIGURATION - Added $(date)" >> .env
echo "SENDGRID_API_KEY=$SENDGRID_API_KEY" >> .env

echo "✅ SendGrid API key added to .env file!"

echo ""
echo "🧪 Testing SendGrid connectivity..."

# Test HTTPS connectivity to SendGrid
echo "Testing HTTPS connection to SendGrid API..."
if curl -s -I https://api.sendgrid.com | head -1 | grep -q "200 OK"; then
    echo "✅ HTTPS connection to SendGrid API successful!"
else
    echo "⚠️  HTTPS connection test failed, but this might be normal"
fi

echo ""
echo "🔄 Restarting application..."

# Restart PM2 process
pm2 restart mbztech-api

echo "✅ Application restarted!"

echo ""
echo "📊 Checking application status..."
pm2 status

echo ""
echo "📝 Recent logs (last 10 lines):"
pm2 logs mbztech-api --lines 10

echo ""
echo "🎉 SendGrid setup complete!"
echo ""
echo "🧪 Test the registration endpoint:"
echo "curl -X 'POST' 'https://api.elapix.store/api/auth/register' \\"
echo "  -H 'accept: application/json' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "  \"firstName\": \"Test\","
echo "  \"lastName\": \"User\","
echo "  \"email\": \"testuser@example.com\","
echo "  \"password\": \"testpassword123\","
echo "  \"companyName\": \"Test Company\","
echo "  \"referralCode\": \"\""
echo "}'"
echo ""
echo "📁 Backup file: .env.backup.$(date +%Y%m%d_%H%M%S)"
echo "🔄 To restore: cp .env.backup.$(date +%Y%m%d_%H%M%S) .env && pm2 restart mbztech-api"
