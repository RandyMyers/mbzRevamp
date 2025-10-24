# MongoDB Migration Guide: Local to Remote

## Overview
This guide will help you migrate your MongoDB database from the local instance on Digital Ocean to a remote MongoDB service (MongoDB Atlas recommended).

---

## Why Migrate?

**Current Setup:**
- Local MongoDB on Digital Ocean: `mongodb://localhost:27017/mbztech`
- Runs on server memory/storage
- You manage backups and maintenance

**Benefits of Remote MongoDB:**
- ✅ Managed backups and monitoring
- ✅ Better scalability
- ✅ Reduced server load
- ✅ Professional-grade infrastructure
- ✅ Geographic redundancy
- ✅ Free tier available

---

## Recommended: MongoDB Atlas

### Why MongoDB Atlas?
- **Free tier:** 512MB storage (good for starting)
- **Fully managed:** No server maintenance
- **Automatic backups:** Point-in-time recovery
- **Built-in monitoring:** Performance insights
- **Easy scaling:** Upgrade as you grow
- **Global:** Deploy anywhere

---

## Step-by-Step Migration Process

### Part 1: Set Up MongoDB Atlas

#### 1. Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with email or Google
3. Choose the **Free tier** (M0)

#### 2. Create a Cluster
1. Click **"Build a Database"**
2. Choose **"M0 Free"** tier
3. Select a region close to your Digital Ocean server
   - Example: If server is in NYC, choose `us-east-1`
4. Name your cluster (e.g., `mbztech-production`)
5. Click **"Create"**
6. Wait 3-5 minutes for cluster creation

#### 3. Create Database User
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username (e.g., `mbztech-admin`)
5. **IMPORTANT:** Generate a strong password and save it securely
6. Under **"Database User Privileges"**, select **"Atlas admin"**
7. Click **"Add User"**

#### 4. Whitelist Your Digital Ocean Server IP
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. SSH into your Digital Ocean droplet and run:
   ```bash
   curl ifconfig.me
   ```
4. Copy the IP address
5. In Atlas, enter your server IP
6. Add description (e.g., "Digital Ocean Production Server")
7. Click **"Confirm"**

**Alternative (Not Recommended for Production):**
- You can temporarily click **"Allow Access from Anywhere"** (0.0.0.0/0) for testing
- Remember to restrict this later for security

#### 5. Get Your Connection String
1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and latest version
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://mbztech-admin:<password>@cluster.mongodb.net/mbztech?retryWrites=true&w=majority
   ```
6. **IMPORTANT:** Replace `<password>` with your actual database user password
7. **IMPORTANT:** Replace the database name (`mbztech`) if different

#### Example Connection String:
```
mongodb+srv://mbztech-admin:MySecurePass123@cluster.abc123.mongodb.net/mbztech?retryWrites=true&w=majority
```

---

### Part 2: Run the Migration

#### 1. SSH into Your Digital Ocean Server
```bash
ssh root@your-server-ip
```

#### 2. Navigate to Your Project
```bash
cd /var/www/mbztech  # Or wherever your project is
```

#### 3. Make the Script Executable
```bash
chmod +x deployment/migrate-local-to-remote-mongodb.sh
```

#### 4. Run the Migration Script
```bash
./deployment/migrate-local-to-remote-mongodb.sh
```

#### 5. Follow the Prompts
The script will:
1. Ask if you've completed the Atlas setup
2. Request your new MongoDB connection string
3. Export all data from local MongoDB
4. Test connection to new MongoDB
5. Import all data to new MongoDB
6. Update your `.env` file
7. Restart your application

---

### Part 3: Verify Migration

#### 1. Check Application Logs
```bash
pm2 logs mbztech-api --lines 100
```

Look for:
- ✅ "MongoDB connected successfully"
- ✅ No connection errors

#### 2. Test Your Application
Visit your application and verify:
- [ ] User login works
- [ ] Dashboard loads with data
- [ ] API endpoints respond
- [ ] Data displays correctly
- [ ] Can create/update records

#### 3. Check MongoDB Atlas Dashboard
1. Go to your Atlas cluster
2. Click **"Browse Collections"**
3. Verify your collections are there:
   - users
   - organizations
   - stores
   - products
   - orders
   - etc.

#### 4. Verify Collection Counts
In your application or using MongoDB Compass:
```javascript
// Run in MongoDB shell or your app
db.users.countDocuments()
db.organizations.countDocuments()
db.stores.countDocuments()
// etc.
```

Compare counts with your local database to ensure all data migrated.

---

## Troubleshooting

### Issue: Cannot Connect to New MongoDB

**Error:** `MongoServerError: bad auth`
**Solution:**
- Check username/password in connection string
- Ensure password doesn't contain special characters (or URL-encode them)
- Verify database user has correct permissions

**Error:** `MongoServerError: IP not whitelisted`
**Solution:**
- Add your server IP to Atlas Network Access
- Double-check the IP with `curl ifconfig.me`

**Error:** `ETIMEDOUT` or `ECONNREFUSED`
**Solution:**
- Check network connectivity
- Verify your server can access external networks
- Try `ping google.com` to test internet connection

### Issue: Migration Script Fails

**If export fails:**
```bash
# Manually check local MongoDB
mongo
> show dbs
> use mbztech
> show collections
```

**If import fails:**
- Check if new database has enough space
- Verify connection string format
- Check Atlas cluster status (should be green)

### Issue: Application Won't Start After Migration

**Check PM2 status:**
```bash
pm2 status
pm2 logs mbztech-api --err
```

**Verify .env file:**
```bash
cat .env | grep MONGO_URL
```

**Restore old configuration if needed:**
```bash
# List backups
ls -la .env.backup-*

# Restore
cp .env.backup-20250124-120000 .env
pm2 restart all
```

---

## After Migration

### 1. Monitor Performance (First 24 Hours)
```bash
# Watch logs
pm2 logs mbztech-api

# Check PM2 status
pm2 status

# Monitor MongoDB Atlas dashboard
# Go to Atlas → Metrics tab
```

### 2. Set Up Monitoring in Atlas
1. Go to **"Alerts"** in Atlas
2. Set up alerts for:
   - High CPU usage
   - High memory usage
   - Connection issues
3. Add your email for notifications

### 3. Stop Local MongoDB (After 1 Week)
Once you're confident everything works:
```bash
# Stop MongoDB service
sudo systemctl stop mongod

# Disable MongoDB from starting on boot
sudo systemctl disable mongod

# Optional: Remove MongoDB to free space
# sudo apt-get remove mongodb-org
```

### 4. Clean Up Backups
```bash
# Remove migration backup
rm -rf /tmp/mongodb-migration-*

# Keep .env backups for a month, then delete
# ls -la .env.backup-*
# rm .env.backup-20250124-120000
```

---

## Security Best Practices

### 1. Secure Your Connection String
- Never commit `.env` to git
- Use strong passwords (16+ characters)
- Rotate passwords every 90 days

### 2. Restrict Network Access
- In Atlas, remove "0.0.0.0/0" if you added it
- Only whitelist your server IP
- Use VPC peering for better security (paid plans)

### 3. Enable Encryption
- Atlas encrypts data at rest by default
- Use TLS for connections (already in connection string)

### 4. Set Up Backups
- Atlas Free tier: Daily snapshots (retained 2 days)
- Paid tiers: Continuous backups with point-in-time recovery

---

## Cost Planning

### Free Tier Limits
- **Storage:** 512MB
- **RAM:** Shared
- **Connections:** 500 concurrent

### When to Upgrade?
Upgrade to M10 ($9/month) when:
- Storage exceeds 400MB
- Need more concurrent connections
- Want better performance
- Need advanced features

### Monitoring Usage
1. Go to Atlas → Metrics
2. Check:
   - Storage usage
   - Connections
   - Operations per second

---

## Rollback Plan

If something goes wrong and you need to go back:

### 1. Stop Application
```bash
pm2 stop all
```

### 2. Restore Old .env
```bash
cp .env.backup-[timestamp] .env
```

### 3. Restart Local MongoDB
```bash
sudo systemctl start mongod
```

### 4. Restart Application
```bash
pm2 restart all
pm2 logs mbztech-api
```

### 5. Verify
```bash
# Check if connected to local DB
node -e "require('dotenv').config(); console.log(process.env.MONGO_URL)"
```

---

## Support

### MongoDB Atlas Support
- Documentation: [https://docs.atlas.mongodb.com/](https://docs.atlas.mongodb.com/)
- Community Forums: [https://www.mongodb.com/community/forums/](https://www.mongodb.com/community/forums/)
- Free tier includes email support

### Additional Resources
- MongoDB University (Free courses): [https://university.mongodb.com/](https://university.mongodb.com/)
- Connection String Format: [https://docs.mongodb.com/manual/reference/connection-string/](https://docs.mongodb.com/manual/reference/connection-string/)

---

## Quick Reference

### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/database?options
```

### Important Commands
```bash
# Check server IP
curl ifconfig.me

# Test MongoDB connection locally
mongo

# Check PM2 status
pm2 status

# View logs
pm2 logs mbztech-api

# Restart app
pm2 restart all
```

### File Locations
- Application: `/var/www/mbztech` (or your path)
- Environment: `.env`
- Backups: `.env.backup-*`
- Logs: `~/.pm2/logs/`

---

## Success Checklist

Before considering migration complete:

- [ ] MongoDB Atlas cluster created and running
- [ ] Database user created with proper permissions
- [ ] Server IP whitelisted in Atlas
- [ ] Migration script completed successfully
- [ ] Application starts without errors
- [ ] Can log in to application
- [ ] All data visible in application
- [ ] API endpoints working
- [ ] Collections verified in Atlas
- [ ] Monitoring set up in Atlas
- [ ] Backups configured
- [ ] Old .env backed up
- [ ] Application monitored for 24+ hours
- [ ] Performance is acceptable

---

## Next Steps

After successful migration:

1. **Week 1:** Monitor daily
2. **Week 2:** Set up alerts and monitoring
3. **Week 3:** Review performance metrics
4. **Week 4:** Stop local MongoDB
5. **Month 2:** Review costs and usage
6. **Month 3:** Plan scaling if needed

---

Good luck with your migration! 🚀
