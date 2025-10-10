# ⚡ Quick Start - Deploy to Digital Ocean in 30 Minutes

The fastest way to get your MBZ Tech Platform running on Digital Ocean.

---

## 🎯 What You'll Need (5 minutes)

Before starting, have these ready:

1. **Digital Ocean Account** - [Sign up here](https://www.digitalocean.com/)
2. **Domain Name** (optional) - e.g., `api.yourdomain.com`
3. **SSH Key** - [Generate if needed](https://docs.digitalocean.com/products/droplets/how-to/add-ssh-keys/)
4. **Cloudinary Account** - [Sign up here](https://cloudinary.com/)
5. **Email for SMTP** - Gmail, SendGrid, or any SMTP service

---

## 🚀 Step 1: Create Droplet (3 minutes)

1. **Log in to Digital Ocean** → Click **"Create"** → **"Droplets"**

2. **Configure Droplet:**
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic - **$18/month** (2GB RAM, 2 vCPU) minimum
   - **Region:** Choose closest to your users
   - **Authentication:** SSH Key (recommended)
   - **Hostname:** `mbz-production`

3. **Click "Create Droplet"** and wait ~60 seconds

4. **Note your IP address:** `xxx.xxx.xxx.xxx`

---

## 🔧 Step 2: Point Domain to Server (2 minutes)

**If using a custom domain:**

1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Add an **A Record:**
   - **Name:** `api` (or `@` for root domain)
   - **Value:** Your droplet IP address
   - **TTL:** 300 (5 minutes)

3. Wait 5-10 minutes for DNS propagation

**Or skip this and use your server IP address directly**

---

## 💻 Step 3: Automated Server Setup (10 minutes)

### 3.1 Connect to Your Server

```bash
# Open your terminal
ssh root@your_server_ip

# If using SSH key
ssh -i ~/.ssh/your_key root@your_server_ip
```

### 3.2 Run Automated Setup Script

```bash
# Make the script executable
chmod +x /path/to/server-setup.sh

# Run the script
bash server-setup.sh
```

**The script will prompt you for:**
- Domain name (or press Enter to skip)
- Email for SSL certificate  
- MongoDB password (or auto-generate)
- JWT secret (or auto-generate)

**⚠️ IMPORTANT:** Save the generated passwords! The script will display them at the end.

**What the script does:**
- Updates system packages
- Installs Node.js, MongoDB, Redis, Nginx
- Configures security (firewall, MongoDB auth)
- Creates application user and directories
- Sets up PM2 and Nginx configuration

**Duration:** ~5-7 minutes

---

## 📦 Step 4: Deploy Your Application (5 minutes)

```bash
# Switch to application user
su - mbzapp

# Navigate to app directory
cd /var/www/mbztech

# Clone your repository  
git clone https://github.com/yourusername/mbzRevamp.git .

# Install dependencies
npm install --production
```

---

## ⚙️ Step 5: Configure Environment (5 minutes)

```bash
# Copy the environment template
cp deployment/env.production.example .env

# Edit environment file
nano .env
```

**Update these required fields in .env:**

```bash
# Database  
MONGO_URL=mongodb://mbzuser:YOUR_PASSWORD_HERE@localhost:27017/mbztech?authSource=mbztech

# JWT  
JWT_SECRET=YOUR_JWT_SECRET_HERE

# Email  
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# URLs  
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

**Save and exit:** `Ctrl + X`, then `Y`, then `Enter`

**Secure the file:**

```bash
chmod 600 .env
exit
```

---

## 🚀 Step 6: Start Application (2 minutes)

```bash
# As mbzapp user
su - mbzapp
cd /var/www/mbztech

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status

# Exit to root
exit

# Setup PM2 to start on boot
su - mbzapp -c "pm2 startup" | tail -1 | bash
```

---

## 🔒 Step 7: Setup SSL Certificate (2 minutes)

**Only if you're using a custom domain:**

```bash
# As root  
certbot --nginx -d api.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms (Y)
# - Redirect HTTP to HTTPS (2)
```

**Skip this if using IP address** - you can add SSL later.

---

## ✅ Step 8: Test Your Deployment (1 minute)

### Test from Command Line:

```bash
# Test health endpoint
curl https://api.yourdomain.com/api/health

# Should return:
# {"success":true,"message":"MBZ Tech Platform API is running",...}
```

### Test from Browser:

1. Open browser
2. Go to `https://api.yourdomain.com/api/health`
3. Should see JSON response

---

## 🎉 Success! Your API is Live!

Your MBZ Tech Platform is now running at:
- **HTTP:** `http://your_server_ip` (if no domain)
- **HTTPS:** `https://api.yourdomain.com` (if using domain)

---

## 📚 Next Steps

1. **Seed Database:** Run notification template scripts
2. **Setup Monitoring:** Use UptimeRobot for uptime monitoring
3. **Configure Backups:** Test the MongoDB backup script
4. **Connect Frontend:** Update frontend with API URL
5. **Test All Features:** Registration, login, stores, etc.

For detailed documentation, see `DIGITAL_OCEAN_DEPLOYMENT_GUIDE.md`

---

**Happy deploying! 🚀**
