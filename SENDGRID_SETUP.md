# SendGrid Email Service Setup

## Why SendGrid?

The server now uses **SendGrid HTTP API** instead of traditional SMTP for sending emails because:

- ✅ **Most hosting providers block SMTP ports** (25, 465, 587) to prevent spam
- ✅ **More reliable** - HTTP API doesn't have firewall/port blocking issues
- ✅ **Faster delivery** - SendGrid's infrastructure is optimized for email delivery
- ✅ **Better deliverability** - Professional email infrastructure
- ✅ **Free tier available** - 100 emails/day for free

## Getting Your SendGrid API Key

### Step 1: Create SendGrid Account
1. Go to [https://sendgrid.com/](https://sendgrid.com/)
2. Click **"Start for free"** or **"Sign Up"**
3. Fill in your details and verify your email

### Step 2: Create API Key
1. Log in to your SendGrid dashboard
2. Navigate to **Settings** → **API Keys** (left sidebar)
3. Click **"Create API Key"** button
4. Choose **"Restricted Access"** for security
5. Give it a name (e.g., "MBZ Tech Production API")
6. Under **Mail Send**, select **"Full Access"**
7. Click **"Create & View"**
8. **COPY THE API KEY IMMEDIATELY** - You won't see it again!

### Step 3: Add to Environment Variables

Add these to your `.env` file in the server directory:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_actual_api_key_here
SMTP_USER=noreply@mbztechnology.com
FROM_NAME=MBZ Technology
```

### Step 4: Restart Server

```bash
# If using PM2
pm2 restart mbztech-api

# Or if running with npm
npm restart
```

## Email Templates Using SendGrid

The following email templates are now powered by SendGrid:

- ✅ **Password Reset Email** (with token link)
- ✅ **Password Reset Code Email** (6-digit code)
- ✅ **Password Reset Success Email**
- ✅ **Invitation Email** (team invitations)
- ✅ **Verification Email** (email verification codes)

All templates use the **MBZ Technology branding**:
- Primary Color: `#800020` (burgundy)
- Professional HTML layout
- Mobile-responsive design
- Matches frontend design in `mbznexusmain`

## Testing Email Sending

After setup, test the forgot password endpoint:

```bash
curl -X POST 'https://api.elapix.store/api/auth/forgot-password' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "your-test-email@example.com",
    "organizationId": "your-org-id"
  }'
```

Check server logs for:
```
✅ [SENDGRID] Email sent successfully to: your-test-email@example.com
📧 [SENDGRID] Response status: 202
```

## Troubleshooting

### Error: "SENDGRID_API_KEY environment variable is not set"
- Make sure you added `SENDGRID_API_KEY=SG.xxx` to your `.env` file
- Restart your server after adding the environment variable
- Check that the `.env` file is in the same directory as `app.js`

### Error: "Invalid API key"
- Verify the API key starts with `SG.`
- Make sure you copied the entire key
- Generate a new API key if the old one was compromised

### Emails not being received
- Check spam/junk folder
- Verify the "from" email in SendGrid settings
- Check SendGrid dashboard → Activity → Email Activity
- Ensure you haven't exceeded the free tier limit (100 emails/day)

## SendGrid Free Tier Limits

- **100 emails/day** (forever free)
- Email statistics and analytics
- API and SMTP access
- Basic email templates

For higher volumes, see [SendGrid Pricing](https://sendgrid.com/pricing/)

## Security Best Practices

1. ✅ **Never commit `.env` file** to git (it's in `.gitignore`)
2. ✅ **Use environment variables** for production servers
3. ✅ **Rotate API keys** periodically
4. ✅ **Use "Restricted Access"** API keys (not "Full Access")
5. ✅ **Monitor usage** in SendGrid dashboard

## Alternative: Using SMTP (Not Recommended)

If you must use SMTP instead of SendGrid HTTP API, uncomment the Nodemailer code in `services/emailService.js` and comment out the SendGrid imports in controllers. However, this is **not recommended** for production environments.

---

**Need help?** Contact the development team or check the [SendGrid Documentation](https://docs.sendgrid.com/)

