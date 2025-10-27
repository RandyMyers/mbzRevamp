# Quick MongoDB Migration Guide

## TL;DR - Fast Track Migration

### Prerequisites (5 minutes)
1. Create MongoDB Atlas account: https://www.mongodb.com/cloud/atlas/register
2. Create M0 (Free) cluster
3. Create database user (save password!)
4. Get your server IP: `curl ifconfig.me`
5. Whitelist your server IP in Atlas
6. Get connection string from Atlas

### Migration (10 minutes)
```bash
# SSH to your Digital Ocean server
ssh root@your-server-ip

# Navigate to project
cd /var/www/mbztech

# Run migration script
chmod +x deployment/migrate-local-to-remote-mongodb.sh
./deployment/migrate-local-to-remote-mongodb.sh

# When prompted, enter your Atlas connection string
# Format: mongodb+srv://username:password@cluster.mongodb.net/mbztech
```

### Verify (5 minutes)
```bash
# Check logs
pm2 logs mbztech-api --lines 50

# Test your application
# Login, check dashboard, verify data
```

---

## One-Liner Commands

### Check server IP
```bash
curl ifconfig.me
```

### Run migration
```bash
cd /var/www/mbztech && ./deployment/migrate-local-to-remote-mongodb.sh
```

### Check application status
```bash
pm2 status && pm2 logs --lines 20
```

### Verify new database
```bash
node -e "require('dotenv').config(); console.log('MONGO_URL:', process.env.MONGO_URL)"
```

---

## Connection String Format

**MongoDB Atlas:**
```
mongodb+srv://username:password@cluster.mongodb.net/mbztech?retryWrites=true&w=majority
```

**Replace:**
- `username` → Your Atlas database username
- `password` → Your Atlas database password
- `cluster` → Your cluster name
- `mbztech` → Your database name

---

## Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| "bad auth" | Check username/password in connection string |
| "IP not whitelisted" | Add server IP in Atlas → Network Access |
| "ETIMEDOUT" | Check network, verify IP is whitelisted |
| App won't start | Check `pm2 logs` and verify MONGO_URL in .env |
| Connection refused | Verify MongoDB Atlas cluster is running (green) |

---

## Rollback (If Needed)

```bash
# Stop app
pm2 stop all

# Restore old .env
cp .env.backup-[timestamp] .env

# Start local MongoDB
sudo systemctl start mongod

# Restart app
pm2 restart all
```

---

## Post-Migration Checklist

- [ ] Application starts (pm2 status)
- [ ] Can login
- [ ] Dashboard shows data
- [ ] API works
- [ ] No errors in logs
- [ ] Data in Atlas dashboard

---

## Files Created/Modified

- `deployment/migrate-local-to-remote-mongodb.sh` - Migration script
- `.env` - Updated with new MONGO_URL
- `.env.backup-[timestamp]` - Old configuration backup
- `/tmp/mongodb-migration-[timestamp]` - Data backup

---

## Support Links

- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Connection Issues:** https://docs.atlas.mongodb.com/troubleshoot-connection/
- **Community:** https://www.mongodb.com/community/forums/

---

## Example Session

```bash
$ curl ifconfig.me
123.45.67.89

$ cd /var/www/mbztech
$ ./deployment/migrate-local-to-remote-mongodb.sh

> Enter NEW MongoDB URL: mongodb+srv://admin:pass123@cluster.mongodb.net/mbztech

✅ Database exported successfully
✅ Connected to new MongoDB
✅ Database imported successfully
✅ Environment updated
✅ Application restarted

$ pm2 logs mbztech-api
✅ MongoDB connected successfully

Done! 🎉
```

---

## Need Help?

Full guide: [MONGODB_MIGRATION_GUIDE.md](./MONGODB_MIGRATION_GUIDE.md)
