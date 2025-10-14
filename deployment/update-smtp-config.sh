#!/bin/bash

echo "🔧 SMTP Configuration Update Script"
echo "=================================="

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

echo "📋 Current SMTP configuration:"
echo "-----------------------------"
grep -E "^SMTP_" .env || echo "No SMTP configuration found"

echo ""
echo "📝 Please provide the new SMTP configuration:"
echo ""

# Get SMTP configuration from user
read -p "SMTP Host (e.g., smtp.gmail.com): " SMTP_HOST
read -p "SMTP Port (e.g., 587): " SMTP_PORT
read -p "SMTP Secure (true/false): " SMTP_SECURE
read -p "SMTP User (e.g., your-email@gmail.com): " SMTP_USER
read -s -p "SMTP Password: " SMTP_PASS
echo ""

# Validate inputs
if [ -z "$SMTP_HOST" ] || [ -z "$SMTP_PORT" ] || [ -z "$SMTP_SECURE" ] || [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASS" ]; then
    echo "❌ Error: All fields are required!"
    exit 1
fi

echo ""
echo "🔄 Updating SMTP configuration..."

# Create backup of current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created: .env.backup.$(date +%Y%m%d_%H%M%S)"

# Remove old SMTP configuration
sed -i '/^SMTP_HOST=/d' .env
sed -i '/^SMTP_PORT=/d' .env
sed -i '/^SMTP_SECURE=/d' .env
sed -i '/^SMTP_USER=/d' .env
sed -i '/^SMTP_PASS=/d' .env

# Add new SMTP configuration
echo "" >> .env
echo "# EMAIL CONFIGURATION (SMTP) - Updated $(date)" >> .env
echo "SMTP_HOST=$SMTP_HOST" >> .env
echo "SMTP_PORT=$SMTP_PORT" >> .env
echo "SMTP_SECURE=$SMTP_SECURE" >> .env
echo "SMTP_USER=$SMTP_USER" >> .env
echo "SMTP_PASS=$SMTP_PASS" >> .env

echo "✅ SMTP configuration updated successfully!"

echo ""
echo "📋 New SMTP configuration:"
echo "-------------------------"
grep -E "^SMTP_" .env

echo ""
echo "🧪 Testing SMTP connectivity..."

# Test SMTP connectivity
if command -v telnet &> /dev/null; then
    echo "Testing connection to $SMTP_HOST:$SMTP_PORT..."
    timeout 10 telnet $SMTP_HOST $SMTP_PORT 2>/dev/null && echo "✅ Connection successful!" || echo "⚠️  Connection failed or timed out"
else
    echo "⚠️  telnet not available, skipping connectivity test"
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
echo "🎉 SMTP configuration update complete!"
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
