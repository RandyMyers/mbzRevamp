# 🚀 Deployment Resources

This directory contains all the resources you need to deploy the MBZ Tech Platform to a Digital Ocean Ubuntu droplet.

---

## 📚 Documentation Files

### 1. **QUICK_START.md** ⚡
**Start here!** The fastest way to deploy in ~30 minutes.

Perfect for:
- Quick production deployment
- First-time deployment
- Getting up and running fast

### 2. **DIGITAL_OCEAN_DEPLOYMENT_GUIDE.md** 📖
Complete, comprehensive deployment guide with detailed explanations.

Perfect for:
- Understanding each deployment step
- Troubleshooting issues
- Custom configurations
- Reference documentation

### 3. **DEPLOYMENT_CHECKLIST.md** ✅
Step-by-step checklist to ensure nothing is missed.

Perfect for:
- Tracking deployment progress
- Team deployments
- Pre-deployment verification
- Post-deployment validation

---

## 🛠️ Deployment Scripts

### 1. **server-setup.sh**
Automated server setup script that installs and configures everything.

**What it does:**
- ✅ Updates system packages
- ✅ Installs Node.js 18.x
- ✅ Installs MongoDB 6.0
- ✅ Installs Redis
- ✅ Installs Nginx
- ✅ Installs PM2
- ✅ Configures firewall (UFW)
- ✅ Creates application user
- ✅ Sets up directories
- ✅ Configures MongoDB authentication
- ✅ Creates backup script
- ✅ Generates secure passwords

**Usage:**
```bash
# On your Digital Ocean droplet (as root)
wget https://raw.githubusercontent.com/yourusername/mbzRevamp/main/deployment/server-setup.sh
chmod +x server-setup.sh
bash server-setup.sh
```

---

## 📝 Configuration Templates

### 1. **env.production.example**
Production-ready environment variable template.

**Usage:**
```bash
# On your server
cp deployment/env.production.example /var/www/mbztech/.env
nano /var/www/mbztech/.env
# Fill in your actual credentials
chmod 600 /var/www/mbztech/.env
```

---

## 🎯 Quick Deployment Guide

### Fastest Path to Production (30 minutes):

1. **Create Digital Ocean Droplet** (3 min)
   - Ubuntu 22.04 LTS
   - Minimum 2GB RAM
   - Add SSH key

2. **Run Automated Setup** (10 min)
   ```bash
   ssh root@your_server_ip
   wget https://raw.githubusercontent.com/.../server-setup.sh
   bash server-setup.sh
   ```

3. **Deploy Code** (5 min)
   ```bash
   su - mbzapp
   cd /var/www/mbztech
   git clone your-repo.git .
   npm install --production
   ```

4. **Configure Environment** (5 min)
   ```bash
   cp deployment/env.production.example .env
   nano .env  # Fill in credentials
   chmod 600 .env
   ```

5. **Start Application** (2 min)
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   exit
   ```

6. **Setup SSL** (2 min)
   ```bash
   # As root
   certbot --nginx -d api.yourdomain.com
   ```

7. **Test** (1 min)
   ```bash
   curl https://api.yourdomain.com/api/health
   ```

**Done! 🎉**

---

## 📋 Pre-Deployment Checklist

Before you start, ensure you have:

- [ ] Digital Ocean account
- [ ] SSH key generated
- [ ] Domain name (optional but recommended)
- [ ] Cloudinary account credentials
- [ ] Email service credentials (Gmail, SMTP)
- [ ] Payment gateway credentials
- [ ] MongoDB Atlas account (if using cloud MongoDB)
- [ ] Exchange rate API key

---

## 🔧 Server Requirements

### Minimum Requirements:
- **OS:** Ubuntu 22.04 LTS
- **RAM:** 2GB (4GB recommended)
- **CPU:** 2 vCPU
- **Storage:** 50GB SSD
- **Network:** 2TB transfer

### Recommended for Production:
- **OS:** Ubuntu 22.04 LTS
- **RAM:** 4GB
- **CPU:** 2 vCPU
- **Storage:** 80GB SSD
- **Network:** 4TB transfer
- **Cost:** ~$24/month on Digital Ocean

---

## 📖 Documentation Structure

```
deployment/
├── README.md                          # You are here
├── QUICK_START.md                     # 30-minute deployment
├── DIGITAL_OCEAN_DEPLOYMENT_GUIDE.md  # Complete guide
├── DEPLOYMENT_CHECKLIST.md            # Step-by-step checklist
├── server-setup.sh                    # Automated setup script
└── env.production.example             # Environment template
```

---

## 🎓 Deployment Paths

Choose the path that fits your needs:

### Path 1: Quick Deployment (Recommended for Most Users)
1. Read `QUICK_START.md`
2. Run `server-setup.sh`
3. Deploy and test

**Time:** ~30 minutes  
**Difficulty:** Easy  
**Best for:** First deployment, production

### Path 2: Manual Deployment (Full Control)
1. Read `DIGITAL_OCEAN_DEPLOYMENT_GUIDE.md`
2. Follow each step manually
3. Customize as needed

**Time:** ~60 minutes  
**Difficulty:** Medium  
**Best for:** Custom configurations, learning

### Path 3: Checklist-Guided (Team Deployment)
1. Use `DEPLOYMENT_CHECKLIST.md`
2. Check off items as you complete them
3. Verify each step

**Time:** ~45 minutes  
**Difficulty:** Easy-Medium  
**Best for:** Team deployments, verification

---

## 🚨 Common Issues & Solutions

### Issue: Script fails during MongoDB installation
**Solution:**
```bash
# Check system architecture
uname -m  # Should be x86_64 or aarch64

# Try manual MongoDB installation
# Follow steps in DIGITAL_OCEAN_DEPLOYMENT_GUIDE.md
```

### Issue: Can't connect after deployment
**Solution:**
```bash
# Check firewall
ufw status

# Ensure ports are open
ufw allow 80
ufw allow 443
```

### Issue: SSL certificate fails
**Solution:**
```bash
# Verify DNS propagation
nslookup api.yourdomain.com

# Wait for DNS to propagate (up to 48 hours)
# Try again with certbot
```

### Issue: Application crashes immediately
**Solution:**
```bash
# Check logs
su - mbzapp
pm2 logs mbztech-api --lines 100

# Common causes:
# - Wrong MongoDB password in .env
# - Missing required env variables
# - MongoDB not running
```

---

## 🔐 Security Best Practices

After deployment, ensure:

- [ ] Firewall is enabled (UFW)
- [ ] Only necessary ports are open (22, 80, 443)
- [ ] MongoDB authentication is enabled
- [ ] Strong passwords are used
- [ ] `.env` file has 600 permissions
- [ ] Root login is disabled (optional)
- [ ] SSH key authentication only (optional)
- [ ] Fail2ban is installed (optional)
- [ ] Regular backups are configured
- [ ] SSL certificate is valid
- [ ] Application runs as non-root user

---

## 📊 Monitoring & Maintenance

### Daily:
```bash
# Check application logs
su - mbzapp
pm2 logs --lines 50

# Check system resources
htop
```

### Weekly:
```bash
# Check disk space
df -h

# Review logs for errors
tail -f /var/log/nginx/mbztech-error.log
```

### Monthly:
```bash
# Update system packages
apt update && apt upgrade -y

# Test backups
/usr/local/bin/backup-mongodb.sh

# Review security
fail2ban-client status
```

---

## 🆘 Getting Help

### Resources:
1. **Full Documentation:**
   - `DIGITAL_OCEAN_DEPLOYMENT_GUIDE.md` - Complete deployment guide
   - `PROJECT_ANALYSIS.md` - Project architecture
   - `ARCHITECTURE_OVERVIEW.md` - System architecture

2. **Digital Ocean:**
   - Documentation: https://docs.digitalocean.com/
   - Community: https://www.digitalocean.com/community
   - Support: https://www.digitalocean.com/support

3. **Project Documentation:**
   - API Reference: `../API_REFERENCE.txt`
   - Notification System: `../NOTIFICATION_INTEGRATION_SUMMARY.md`
   - Email System: `../EMAIL_SYNC_SYSTEM.md`

### Support Commands:
```bash
# View all logs
pm2 logs

# Check services
systemctl status nginx mongod redis-server

# Monitor resources
htop

# View disk usage
df -h

# Check network
netstat -tulpn
```

---

## 🎉 Deployment Success Criteria

Your deployment is successful when:

✅ Server is accessible via SSH  
✅ Application starts without errors  
✅ Health endpoint returns 200 OK  
✅ SSL certificate is valid (if using domain)  
✅ Database connection works  
✅ Email sending works  
✅ File uploads work  
✅ PM2 shows app as "online"  
✅ Nginx returns correct responses  
✅ Logs show no errors  
✅ Backups are running  

---

## 📞 Quick Reference

### Important Paths:
```
Application: /var/www/mbztech/
Logs: /var/log/mbztech/
Nginx Config: /etc/nginx/sites-available/mbztech
MongoDB Backups: /var/backups/mongodb/
Environment: /var/www/mbztech/.env
```

### Important Commands:
```bash
# Application
pm2 status
pm2 restart mbztech-api
pm2 logs

# Services
systemctl status nginx
systemctl status mongod
systemctl restart nginx

# Monitoring
htop
df -h
free -h
```

### Important Users:
```
Application User: mbzapp
MongoDB User: mbzuser
Database: mbztech
```

---

## 🔄 Updates & Redeployment

To update your deployed application:

```bash
# SSH into server
ssh root@your_server_ip

# Switch to app user
su - mbzapp

# Navigate to app directory
cd /var/www/mbztech

# Pull latest changes
git pull origin main

# Install new dependencies
npm install --production

# Run migrations if needed
# node scripts/migrate.js

# Restart application
pm2 restart mbztech-api

# Check logs
pm2 logs --lines 50
```

---

## 📝 Notes

- **Environment:** All scripts are tested on Ubuntu 22.04 LTS
- **Node.js:** Version 18.x LTS is installed
- **MongoDB:** Version 6.0 is installed
- **PM2:** Configured for cluster mode
- **Nginx:** Configured with rate limiting
- **Security:** Firewall enabled by default

---

## 🎯 Next Steps After Deployment

1. **Test all endpoints** thoroughly
2. **Setup monitoring** (UptimeRobot, Pingdom)
3. **Configure external backups** (S3, Dropbox)
4. **Setup staging environment** for testing
5. **Document your setup** for your team
6. **Configure email notifications** for errors
7. **Setup log aggregation** (optional)
8. **Configure APM** (Application Performance Monitoring)

---

**Happy Deploying! 🚀**

For detailed instructions, start with `QUICK_START.md`

