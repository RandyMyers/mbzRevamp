#!/bin/bash

echo "🔧 Fixing CORS Configuration"
echo "============================"

# Check if we're in the right directory
if [ ! -f "app.js" ]; then
    echo "❌ Error: Please run this script from the application root directory (/var/www/mbztech)"
    exit 1
fi

echo "📋 Current CORS configuration:"
echo "-----------------------------"
grep -A 10 "app.use(cors" app.js

echo ""
echo "🔄 Updating CORS configuration..."

# Create backup
cp app.js app.js.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created: app.js.backup.$(date +%Y%m%d_%H%M%S)"

# Update CORS configuration with comprehensive settings
cat > cors_config.js << 'EOF'
// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:8080',
      'http://localhost:8081',
      'https://api.elapix.store',
      'https://crm.mbztechnology.com',
      'https://app.mbztechnology.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  credentials: false,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false
}));

// Additional CORS middleware for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:8080',
    'http://localhost:8081',
    'https://api.elapix.store',
    'https://crm.mbztechnology.com',
    'https://app.mbztechnology.com'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});
EOF

echo "✅ Enhanced CORS configuration created"

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
echo "🧪 Testing CORS with a sample request..."

# Test CORS with curl
echo "Testing OPTIONS request (preflight):"
curl -X OPTIONS \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v \
  https://api.elapix.store/api/health 2>&1 | grep -E "(Access-Control|HTTP)"

echo ""
echo "Testing GET request:"
curl -X GET \
  -H "Origin: http://localhost:8081" \
  -v \
  https://api.elapix.store/api/health 2>&1 | grep -E "(Access-Control|HTTP)"

echo ""
echo "🎉 CORS fix complete!"
echo ""
echo "📁 Backup file: app.js.backup.$(date +%Y%m%d_%H%M%S)"
echo "🔄 To restore: cp app.js.backup.$(date +%Y%m%d_%H%M%S) app.js && pm2 restart mbztech-api"
