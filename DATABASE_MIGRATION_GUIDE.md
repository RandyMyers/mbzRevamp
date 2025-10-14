# Database Migration Guide: Render to Digital Ocean

## Overview
You have several options for migrating your MongoDB database from Render to Digital Ocean:

## Option 1: MongoDB Atlas (Recommended) ☁️

**Best for:** Most users - managed, reliable, scalable

### Steps:
1. **Create MongoDB Atlas account** (free tier available)
2. **Run the setup script:**
   ```bash
   chmod +x deployment/setup-mongodb-atlas.sh
   ./deployment/setup-mongodb-atlas.sh
   ```

### Benefits:
- ✅ Managed service (no server maintenance)
- ✅ Automatic backups
- ✅ Built-in monitoring
- ✅ Easy scaling
- ✅ Global availability
- ✅ Free tier available

### Cost:
- Free tier: 512MB storage
- Paid plans start at $9/month

---

## Option 2: Local MongoDB on Digital Ocean 🖥️

**Best for:** Full control, cost optimization

### Steps:
1. **Run the migration script:**
   ```bash
   chmod +x deployment/migrate-database-from-render.sh
   ./deployment/migrate-database-from-render.sh
   ```

### Benefits:
- ✅ Full control over database
- ✅ No external dependencies
- ✅ Lower cost (just server resources)
- ✅ Data stays on your server

### Considerations:
- ❌ You manage backups
- ❌ You handle scaling
- ❌ Server maintenance required

---

## Option 3: Digital Ocean Managed Database 🏢

**Best for:** Enterprise users who want managed service on Digital Ocean

### Steps:
1. **Create Digital Ocean Database cluster:**
   - Go to Digital Ocean dashboard
   - Create → Databases → MongoDB
   - Choose size and region
   - Create database user

2. **Update connection string in .env:**
   ```bash
   MONGO_URL=mongodb://username:password@host:port/database?authSource=admin
   ```

3. **Restart application:**
   ```bash
   pm2 restart mbztech-api
   ```

### Benefits:
- ✅ Managed by Digital Ocean
- ✅ Integrated with your DO infrastructure
- ✅ Automatic backups
- ✅ Monitoring included

### Cost:
- Starts at $15/month

---

## Migration Process (for Options 1 & 2)

### Prerequisites:
- Your Render MongoDB connection string
- Access to your Digital Ocean server
- MongoDB tools installed (for Option 2)

### What the scripts do:
1. **Export data** from Render MongoDB
2. **Import data** to new database
3. **Update environment variables**
4. **Test connections**
5. **Restart application**

### Data included:
- ✅ All collections
- ✅ All documents
- ✅ Indexes
- ✅ User accounts
- ✅ Application data

---

## Recommendation

**For most users, I recommend MongoDB Atlas (Option 1)** because:
- It's the easiest to set up
- No server maintenance required
- Automatic backups and monitoring
- Free tier available
- Can scale as you grow

---

## After Migration

### Testing Checklist:
- [ ] User login works
- [ ] Data displays correctly
- [ ] Analytics load properly
- [ ] All API endpoints respond
- [ ] File uploads work (if applicable)

### Backup Strategy:
- **Atlas:** Automatic backups included
- **Local MongoDB:** Set up regular backups
- **DO Managed:** Automatic backups included

### Monitoring:
- **Atlas:** Built-in monitoring dashboard
- **Local MongoDB:** Set up monitoring tools
- **DO Managed:** DO monitoring included

---

## Need Help?

If you encounter issues during migration:
1. Check the error logs: `pm2 logs mbztech-api`
2. Verify connection strings
3. Check network connectivity
4. Ensure proper permissions

The migration scripts include detailed error handling and will guide you through any issues.
