# 🚀 Vercel Deployment Guide for MBZ Tech Platform API

## 📋 **Swagger UI Fix for Vercel**

The Swagger UI error you encountered is fixed with the following changes:

### **Problem:**
```
swagger-ui-bundle.js:3 Uncaught SyntaxError: Unexpected token '<'
swagger-ui-standalone-preset.js:3 Uncaught SyntaxError: Unexpected token '<'
```

This happens because Vercel doesn't serve Swagger UI assets correctly by default.

### **Solution Applied:**

1. **Updated `app.js`** to use CDN-hosted Swagger UI assets
2. **Added `vercel.json`** configuration
3. **Enhanced Swagger setup** with Vercel-compatible options

---

## 🔧 **Files Modified:**

### **1. `app.js` - Swagger Configuration**
```javascript
// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MBZ Tech Platform API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true,
    // Vercel-compatible options
    url: '/api-docs/swagger.json',
    validatorUrl: null
  },
  // Serve Swagger UI assets from CDN for better compatibility
  customJs: [
    'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js',
    'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js'
  ],
  customCssUrl: 'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css'
}));

// Serve Swagger JSON
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});
```

### **2. `vercel.json` - Vercel Configuration**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api-docs/(.*)",
      "dest": "/api-docs/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/app.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### **3. `package.json` - Added Start Script**
```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### **4. `swagger.js` - Updated Server URLs**
```javascript
servers: [
  {
    url: 'https://mbzrevamp.onrender.com',
    description: 'Production server (Render)'
  },
  {
    url: 'https://your-vercel-app.vercel.app',
    description: 'Production server (Vercel)'
  },
  {
    url: 'http://localhost:8800',
    description: 'Development server'
  }
]
```

---

## 🚀 **Deployment Steps:**

### **1. Update Your Vercel URL**
Replace `https://your-vercel-app.vercel.app` in `swagger.js` with your actual Vercel URL.

### **2. Deploy to Vercel**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy from server directory
cd server
vercel --prod
```

### **3. Set Environment Variables**
Make sure these environment variables are set in your Vercel dashboard:
- `MONGODB_URI`
- `JWT_SECRET`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_HOST`
- `SMTP_PORT`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

---

## ✅ **Expected Results:**

After deployment, your Swagger UI should work correctly at:
- `https://your-vercel-app.vercel.app/api-docs`

### **Features Working:**
- ✅ Swagger UI loads without JavaScript errors
- ✅ API documentation displays correctly
- ✅ Try it out functionality works
- ✅ Authentication with JWT tokens
- ✅ All API endpoints documented

---

## 🔍 **Testing:**

1. **Visit Swagger UI:** `https://your-vercel-app.vercel.app/api-docs`
2. **Test API Health:** `https://your-vercel-app.vercel.app/api/health`
3. **Test Swagger JSON:** `https://your-vercel-app.vercel.app/api-docs/swagger.json`

---

## 🛠️ **Troubleshooting:**

### **If Swagger still doesn't work:**
1. Check browser console for errors
2. Verify all environment variables are set
3. Ensure `vercel.json` is in the server directory
4. Check Vercel deployment logs

### **Common Issues:**
- **404 errors:** Check `vercel.json` routes configuration
- **CORS errors:** Verify CORS settings in `app.js`
- **Database errors:** Check MongoDB connection string

---

## 📞 **Support:**

If you continue to have issues, check:
1. Vercel deployment logs
2. Browser network tab for failed requests
3. Environment variables configuration
4. Database connectivity

The Swagger UI should now work perfectly on Vercel! 🎉

