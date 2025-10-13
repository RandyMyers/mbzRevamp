# Test Environment Setup Guide

## Overview
This guide helps you set up a separate test environment for your MBZ Technology Platform, completely isolated from your production environment.

## Architecture

```
Production Environment          Test Environment
├── /var/www/mbztech           ├── /var/www/mbztech-test
├── Port: 8800                 ├── Port: 8801
├── Database: MBZCRM           ├── Database: MBZCRM_TEST
├── PM2: mbztech-api           ├── PM2: mbztech-test-api
├── Domain: api.elapix.store   ├── Domain: test-api.elapix.store
└── NODE_ENV: production       └── NODE_ENV: test
```

## Quick Setup

### 1. Run the Setup Script
```bash
chmod +x deployment/setup-test-environment.sh
./deployment/setup-test-environment.sh
```

### 2. What Gets Created
- ✅ **Test directory**: `/var/www/mbztech-test`
- ✅ **Test database**: `MBZCRM_TEST`
- ✅ **Test PM2 process**: `mbztech-test-api`
- ✅ **Test port**: `8801`
- ✅ **Test configuration**: Separate `.env` file
- ✅ **Management scripts**: Start, stop, restart, logs

## Environment Comparison

| Aspect | Production | Test |
|--------|------------|------|
| **Directory** | `/var/www/mbztech` | `/var/www/mbztech-test` |
| **Port** | 8800 | 8801 |
| **Database** | MBZCRM | MBZCRM_TEST |
| **PM2 Process** | mbztech-api | mbztech-test-api |
| **Domain** | api.elapix.store | test-api.elapix.store |
| **Environment** | production | test |
| **Logs** | `/var/log/mbztech/` | `/var/log/mbztech/` |

## Management Commands

### Test Environment
```bash
# Navigate to test directory
cd /var/www/mbztech-test

# Start test environment
./start-test.sh

# Stop test environment
./stop-test.sh

# Restart test environment
./restart-test.sh

# View logs
./logs-test.sh

# Seed test data
node seed-test-data.js
```

### Production Environment
```bash
# Navigate to production directory
cd /var/www/mbztech

# Start production
pm2 start mbztech-api

# Stop production
pm2 stop mbztech-api

# Restart production
pm2 restart mbztech-api

# View logs
pm2 logs mbztech-api
```

## Testing Workflow

### 1. Development → Test → Production
```
Code Changes → Test Environment → Production Environment
     ↓              ↓                    ↓
  Local Dev    Test & Validate    Deploy to Live
```

### 2. Typical Workflow
1. **Develop** features locally
2. **Deploy** to test environment
3. **Test** all functionality
4. **Validate** with stakeholders
5. **Deploy** to production

## Test Data Management

### Seed Test Data
```bash
cd /var/www/mbztech-test
node seed-test-data.js
```

### Reset Test Database
```bash
# Drop test database
mongosh --eval "use MBZCRM_TEST; db.dropDatabase()"

# Recreate and seed
mongosh --eval "use MBZCRM_TEST; db.createCollection('test')"
node seed-test-data.js
```

## CORS Configuration

Update your production CORS to include test domain:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:8080',
  'http://localhost:8081',
  'https://api.elapix.store',
  'https://crm.mbztechnology.com',
  'https://app.mbztechnology.com',
  'https://elapix.mbztechnology.com',
  'https://elapix.store',
  'https://test-api.elapix.store'  // Add this
];
```

## DNS Configuration (Optional)

If you want a separate domain for testing:

1. **Add DNS record**:
   ```
   test-api.elapix.store → YOUR_SERVER_IP
   ```

2. **SSL Certificate** (if needed):
   ```bash
   certbot --nginx -d test-api.elapix.store
   ```

## Environment Variables

### Production (.env)
```bash
NODE_ENV=production
PORT=8800
MONGO_URL=mongodb://127.0.0.1:27017/MBZCRM
JWT_SECRET=your_production_secret
```

### Test (.env)
```bash
NODE_ENV=test
PORT=8801
MONGO_URL=mongodb://127.0.0.1:27017/MBZCRM_TEST
JWT_SECRET=test_jwt_secret_key_2024_mbztech
```

## Monitoring

### Check Both Environments
```bash
# Check PM2 status
pm2 status

# Check both processes
pm2 logs mbztech-api --lines 10      # Production
pm2 logs mbztech-test-api --lines 10 # Test

# Check ports
netstat -tlnp | grep :8800  # Production
netstat -tlnp | grep :8801  # Test
```

### Health Checks
```bash
# Production health
curl http://localhost:8800/api/health

# Test health
curl http://localhost:8801/api/health
```

## Backup Strategy

### Test Database Backup
```bash
# Backup test database
mongodump --db=MBZCRM_TEST --out=/backup/test-$(date +%Y%m%d)

# Restore test database
mongorestore --db=MBZCRM_TEST /backup/test-20241201/MBZCRM_TEST
```

### Production Database Backup
```bash
# Backup production database
mongodump --db=MBZCRM --out=/backup/production-$(date +%Y%m%d)

# Restore production database
mongorestore --db=MBZCRM /backup/production-20241201/MBZCRM
```

## Best Practices

### 1. Always Test First
- Deploy changes to test environment first
- Validate all functionality
- Check performance and stability
- Only then deploy to production

### 2. Keep Environments Separate
- Never mix test and production data
- Use different API keys and secrets
- Separate email configurations
- Different database instances

### 3. Regular Maintenance
- Clean up test data regularly
- Monitor both environments
- Keep backups of both databases
- Update both environments consistently

### 4. Team Workflow
- Developers work on test environment
- QA tests on test environment
- Stakeholders review on test environment
- Only deploy to production after approval

## Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using the port
   netstat -tlnp | grep :8801
   ```

2. **Database connection issues**:
   ```bash
   # Check MongoDB status
   systemctl status mongod
   
   # Check database exists
   mongosh --eval "show dbs"
   ```

3. **PM2 process issues**:
   ```bash
   # Check PM2 status
   pm2 status
   
   # Restart if needed
   pm2 restart mbztech-test-api
   ```

## Success!

With this setup, you now have:
- ✅ **Isolated test environment**
- ✅ **Safe testing space**
- ✅ **Easy deployment workflow**
- ✅ **Separate data and configurations**
- ✅ **Professional development process**

Your development workflow is now production-ready! 🎉
