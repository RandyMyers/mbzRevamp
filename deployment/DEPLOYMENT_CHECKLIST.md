# 📋 Deployment Checklist

Quick checklist to ensure successful deployment to Digital Ocean.

---

## Pre-Deployment Checklist

### ☐ Digital Ocean Account Setup
- [ ] Digital Ocean account created
- [ ] Payment method added
- [ ] SSH key generated and added to account
- [ ] Domain name purchased (optional but recommended)

### ☐ Domain Configuration (If Using Custom Domain)
- [ ] Domain DNS A record points to server IP
- [ ] DNS propagation verified (`dig api.yourdomain.com`)
- [ ] Waited at least 1 hour for DNS propagation

### ☐ Third-Party Service Accounts
- [ ] Cloudinary account created and credentials ready
- [ ] Email service configured (Gmail app password or SMTP credentials)
- [ ] Payment gateway accounts (Flutterwave, Paystack, Squad)
- [ ] MongoDB Atlas account (if using cloud MongoDB)
- [ ] Exchange rate API key obtained

### ☐ Application Preparation
- [ ] Code tested locally
- [ ] All sensitive data removed from code
- [ ] Git repository ready (if using Git deployment)
- [ ] Database seed scripts tested
- [ ] Documentation reviewed

---

## Server Creation Checklist

### ☐ Create Droplet
- [ ] Ubuntu 22.04 LTS selected
- [ ] Appropriate droplet size chosen (minimum 2GB RAM)
- [ ] Datacenter region selected (close to users)
- [ ] SSH key authentication enabled
- [ ] Meaningful hostname set
- [ ] Droplet IP address noted

### ☐ Initial Server Access
- [ ] SSH connection successful
- [ ] Root access confirmed
- [ ] Server responding to commands

---

## Server Setup Checklist

### ☐ Option A: Automated Setup
- [ ] Downloaded `server-setup.sh` to local machine
- [ ] Uploaded script to server
- [ ] Made script executable: `chmod +x server-setup.sh`
- [ ] Ran script: `bash server-setup.sh`
- [ ] Saved generated credentials securely
- [ ] Verified all services started successfully

### ☐ Option B: Manual Setup
- [ ] System packages updated
- [ ] Timezone set
- [ ] Swap file created
- [ ] Node.js 18.x installed
- [ ] PM2 installed
- [ ] MongoDB installed and secured
- [ ] Redis installed
- [ ] Nginx installed
- [ ] Application user created
- [ ] Directories created with proper permissions
- [ ] Firewall configured

---

## Application Deployment Checklist

### ☐ Code Deployment
- [ ] Application code deployed to `/var/www/mbztech/`
- [ ] File ownership set to `mbzapp:mbzapp`
- [ ] Dependencies installed (`npm install --production`)

### ☐ Environment Configuration
- [ ] `.env` file created from template
- [ ] MongoDB credentials configured
- [ ] JWT secret set (strong, random)
- [ ] Email credentials configured
- [ ] Cloudinary credentials configured
- [ ] Payment gateway credentials configured
- [ ] Frontend/Backend URLs configured
- [ ] `.env` file permissions set to 600

### ☐ Database Setup
- [ ] MongoDB connection tested
- [ ] Database seeded (notification templates)
- [ ] Database backup tested

### ☐ PM2 Configuration
- [ ] `ecosystem.config.js` configured
- [ ] Application started with PM2
- [ ] PM2 process list saved
- [ ] PM2 startup configured for boot
- [ ] Application logs checked for errors

### ☐ Nginx Configuration
- [ ] Nginx config file created
- [ ] Nginx config tested (`nginx -t`)
- [ ] Nginx reloaded
- [ ] Reverse proxy working
- [ ] Health endpoint accessible

---

## SSL & Security Checklist

### ☐ SSL Certificate
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] HTTPS working correctly
- [ ] HTTP to HTTPS redirect configured
- [ ] Auto-renewal tested

### ☐ Firewall & Security
- [ ] UFW firewall enabled
- [ ] Only necessary ports open (80, 443, SSH)
- [ ] Fail2ban installed (optional)
- [ ] MongoDB authentication enabled
- [ ] Root login disabled (recommended)
- [ ] SSH key-only authentication (recommended)

---

## Testing Checklist

### ☐ Basic Functionality Tests
- [ ] Health endpoint responds: `/api/health`
- [ ] Registration endpoint works
- [ ] Login endpoint works
- [ ] Protected routes require authentication
- [ ] Email sending works
- [ ] File upload works (if applicable)

### ☐ Integration Tests
- [ ] MongoDB connection stable
- [ ] Redis connection working
- [ ] Email sync working (if configured)
- [ ] Payment gateway test transactions
- [ ] WooCommerce sync tested (if applicable)

### ☐ Performance Tests
- [ ] Application responds within acceptable time
- [ ] No memory leaks (monitor over 24 hours)
- [ ] Logs show no errors
- [ ] CPU usage acceptable

---

## Monitoring & Maintenance Checklist

### ☐ Monitoring Setup
- [ ] PM2 monitoring configured
- [ ] Log rotation configured
- [ ] Uptime monitoring set up (UptimeRobot, Pingdom)
- [ ] Error alerting configured
- [ ] Resource monitoring dashboard set up

### ☐ Backup Configuration
- [ ] MongoDB backup script created
- [ ] Backup script tested
- [ ] Automated backup cron job configured
- [ ] Backup restoration tested
- [ ] Off-site backup configured (optional)

### ☐ Documentation
- [ ] Server credentials documented securely
- [ ] Deployment process documented
- [ ] Recovery procedures documented
- [ ] Team members have access to documentation

---

## Post-Deployment Checklist

### ☐ Final Verification
- [ ] All API endpoints tested
- [ ] Frontend can connect to backend
- [ ] SSL certificate valid and trusted
- [ ] No console errors in application
- [ ] Performance acceptable under load
- [ ] Email notifications working
- [ ] Payment processing tested

### ☐ Going Live
- [ ] Update DNS to point to production server
- [ ] Monitor logs for first 24 hours
- [ ] Test critical user flows
- [ ] Announce launch to team/users
- [ ] Monitor error rates
- [ ] Have rollback plan ready

### ☐ Ongoing Maintenance
- [ ] Weekly log reviews scheduled
- [ ] Monthly security updates scheduled
- [ ] Backup verification scheduled
- [ ] Performance monitoring scheduled
- [ ] Team trained on deployment process

---

## Emergency Contacts & Resources

### Important Commands
```bash
# Check application status
su - mbzapp
pm2 status
pm2 logs

# Restart application
pm2 restart mbztech-api

# Check services
systemctl status mongod
systemctl status nginx
systemctl status redis-server

# View logs
tail -f /var/log/mbztech/error.log
tail -f /var/log/nginx/mbztech-error.log

# Check disk space
df -h

# Check memory
free -h

# Check processes
htop
```

### Support Resources
- Full deployment guide: `DIGITAL_OCEAN_DEPLOYMENT_GUIDE.md`
- Digital Ocean support: https://www.digitalocean.com/support
- PM2 documentation: https://pm2.keymetrics.io
- MongoDB documentation: https://docs.mongodb.com
- Nginx documentation: https://nginx.org/en/docs/

---

## Success Criteria

Your deployment is successful when:

✅ Application is accessible via HTTPS  
✅ SSL certificate is valid  
✅ All critical endpoints respond correctly  
✅ Authentication works  
✅ Database operations succeed  
✅ File uploads work  
✅ Email sending works  
✅ No errors in logs  
✅ Application restarts automatically  
✅ Backups are running  
✅ Monitoring is active  

---

## Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| 502 Bad Gateway | Check if PM2 app is running: `pm2 status` |
| MongoDB connection failed | Verify credentials in `.env`, check MongoDB is running |
| SSL certificate error | Check DNS propagation, re-run certbot |
| High memory usage | Restart PM2: `pm2 restart all` |
| Can't SSH | Check firewall rules: `ufw status` |
| Application won't start | Check logs: `pm2 logs --lines 100` |

---

**Keep this checklist handy during deployment!**

Print it out or keep it open in a browser tab as you go through each step.

