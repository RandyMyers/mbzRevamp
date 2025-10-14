# Swagger Documentation Troubleshooting Guide

## Issue
The Swagger documentation endpoint `/api-docs` is returning 404 errors.

## Root Cause
The server may need to be restarted to pick up the Swagger configuration changes, or there might be an issue with the Swagger setup.

## Solution Steps

### 1. Restart the Server
Run the restart script to restart the server and test all endpoints:

```bash
cd /var/www/mbztech
./deployment/restart-and-test.sh
```

### 2. Manual Testing
If the script doesn't work, test manually:

```bash
# Test health endpoint
curl https://api.elapix.store/api/health

# Test Swagger test endpoint
curl https://api.elapix.store/api-docs/test

# Test Swagger JSON
curl https://api.elapix.store/api-docs/swagger.json

# Test Swagger UI
curl -I https://api.elapix.store/api-docs
```

### 3. Check Server Logs
Check PM2 logs for any errors:

```bash
pm2 logs mbztech-api
```

### 4. Verify Dependencies
Ensure Swagger dependencies are installed:

```bash
cd /var/www/mbztech
npm list swagger-jsdoc swagger-ui-express
```

### 5. Check File Permissions
Ensure the application files have correct permissions:

```bash
chown -R www-data:www-data /var/www/mbztech
chmod -R 755 /var/www/mbztech
```

## Expected Results

After restarting, you should be able to access:
- **Swagger UI**: https://api.elapix.store/api-docs
- **Swagger JSON**: https://api.elapix.store/api-docs/swagger.json
- **Test Endpoint**: https://api.elapix.store/api-docs/test

## Common Issues

1. **404 Error**: Server needs restart
2. **500 Error**: Check server logs for JavaScript errors
3. **CORS Issues**: Already configured in app.js
4. **File Path Issues**: Ensure all files are in correct locations

## Debug Information

The updated app.js now includes debug logging for Swagger setup. Check the server logs to see:
- "Setting up Swagger documentation..."
- "Swagger specs loaded: Yes/No"
- "Swagger UI available: Yes/No"
- "Swagger documentation setup complete"
