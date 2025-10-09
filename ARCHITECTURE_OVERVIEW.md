# 🏗️ MBZ Tech Platform - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                          │
│                   (Web, Mobile, Third-party APIs)                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTPS/REST
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          VERCEL CDN/EDGE                            │
│                      (Load Balancing, SSL)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EXPRESS.JS API LAYER                         │
│                          (Node.js v18+)                             │
├─────────────────────────────────────────────────────────────────────┤
│  Middleware Stack:                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │ CORS Handler │→│ Body Parser  │→│ File Upload  │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │ Auth (JWT)   │→│ Onboarding   │→│ Morgan Log   │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  ROUTES LAYER   │ │  ROUTES LAYER   │ │  ROUTES LAYER   │
│   (62 Routes)   │ │   (62 Routes)   │ │   (62 Routes)   │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ • Auth Routes   │ │ • Store Routes  │ │ • Email Routes  │
│ • User Routes   │ │ • Order Routes  │ │ • Task Routes   │
│ • Admin Routes  │ │ • Product Rts   │ │ • Notif Routes  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CONTROLLER LAYER                               │
│                      (96 Controllers)                               │
├─────────────────────────────────────────────────────────────────────┤
│  Business Logic & Data Processing:                                  │
│  • Request Validation                                               │
│  • Business Rules Enforcement                                       │
│  • Data Transformation                                              │
│  • Response Formatting                                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ SERVICE LAYER   │ │  HELPER LAYER   │ │  MODEL LAYER    │
│  (12 Services)  │ │  (14 Helpers)   │ │  (91 Models)    │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ • Email Svc     │ │ • Email Helpers │ │ • Organization  │
│ • WooCom Svc    │ │ • WC Helpers    │ │ • User          │
│ • Payment Svc   │ │ • Notif Helpers │ │ • Store         │
│ • Exchange Svc  │ │ • Queue Workers │ │ • Product       │
│ • Webhook Svc   │ │ • Sync Helpers  │ │ • Order         │
│ • Notif Svc     │ │ • Audit Helper  │ │ • Customer      │
│ • OTP Service   │ │ • Event Logger  │ │ • Payment       │
│ • Timezone Svc  │ │                 │ │ • + 84 more     │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       MONGODB DATABASE                              │
│                      (Mongoose ODM)                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Collections:                                                       │
│  • organizations  • users       • stores      • products            │
│  • orders        • customers   • emails       • tasks               │
│  • payments      • invoices    • notifications • webhooks           │
│  • + 80+ more collections                                           │
├─────────────────────────────────────────────────────────────────────┤
│  Indexes:                                                           │
│  • organizationId (multi-tenant isolation)                          │
│  • userId (user queries)                                            │
│  • storeId (store operations)                                       │
│  • status fields (filtering)                                        │
│  • date fields (range queries)                                      │
└─────────────────────────────────────────────────────────────────────┘

                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ EXTERNAL APIS   │ │  QUEUE SYSTEM   │ │  CRON JOBS      │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ • WooCommerce   │ │ • Bull Queue    │ │ • Email Sync    │
│ • Flutterwave   │ │ • Customer Sync │ │   (2 tiers)     │
│ • Paystack      │ │ • Order Sync    │ │ • Rate Sync     │
│ • Squad         │ │ • Product Sync  │ │   (Daily)       │
│ • Exchange Rate │ │ • Email Queue   │ │ • Notif Check   │
│ • Email (IMAP)  │ │ • Notif Queue   │ │ • Task Alerts   │
│ • Email (SMTP)  │ │                 │ │ • Cleanup Jobs  │
│ • Cloudinary    │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Multi-Tenant Data Flow

```
┌──────────────┐
│   Request    │
│ (with token) │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  JWT Verification    │
│  Extract: userId     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Lookup User         │
│  Get: organizationId │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  All DB Queries Include:             │
│  { organization: organizationId }    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Tenant-Isolated     │
│  Data Response       │
└──────────────────────┘
```

---

## Email Sync Architecture (Two-Tier)

```
┌─────────────────────────────────────────────────────────────┐
│                    EMAIL SYNC SYSTEM                        │
└─────────────────────────────────────────────────────────────┘

TIER 1: Incoming Email Listener (Every 2 Minutes)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Cron: */2 * * * *                                         │
│  ┌──────────────────────────────────────────┐              │
│  │ For each active receiver:                │              │
│  │  1. Connect to IMAP                      │              │
│  │  2. Check INBOX only                     │              │
│  │  3. Search for UNSEEN emails             │              │
│  │  4. Download & parse new emails          │              │
│  │  5. Check for duplicates                 │              │
│  │  6. Save to Inbox collection             │              │
│  │  7. Disconnect                           │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  Resource Usage: LOW                                        │
│  Purpose: Real-time incoming email detection               │
└─────────────────────────────────────────────────────────────┘

TIER 2: Full Email Sync (Daily at 2 AM)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Cron: 0 2 * * *                                           │
│  ┌──────────────────────────────────────────┐              │
│  │ For each active receiver:                │              │
│  │  1. Connect to IMAP                      │              │
│  │  2. Check ALL folders:                   │              │
│  │     - INBOX                              │              │
│  │     - Sent                               │              │
│  │     - Drafts                             │              │
│  │     - Trash                              │              │
│  │     - Archive                            │              │
│  │     - Spam                               │              │
│  │  3. Search for ALL emails                │              │
│  │  4. Download & parse all emails          │              │
│  │  5. Check for duplicates                 │              │
│  │  6. Save to respective collections       │              │
│  │  7. Disconnect                           │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  Resource Usage: HIGH                                       │
│  Purpose: Complete email backup & access                   │
└─────────────────────────────────────────────────────────────┘
```

---

## WooCommerce Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WOOCOMMERCE SYNC FLOW                    │
└─────────────────────────────────────────────────────────────┘

BIDIRECTIONAL SYNC
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  MBZ Platform ←─────────→ WooCommerce Store                │
│                                                             │
│  ┌─────────────┐           ┌─────────────┐                 │
│  │  Products   │ ←────────→│  Products   │                 │
│  └─────────────┘           └─────────────┘                 │
│                                                             │
│  ┌─────────────┐           ┌─────────────┐                 │
│  │  Customers  │ ←────────→│  Customers  │                 │
│  └─────────────┘           └─────────────┘                 │
│                                                             │
│  ┌─────────────┐           ┌─────────────┐                 │
│  │   Orders    │ ←────────→│   Orders    │                 │
│  └─────────────┘           └─────────────┘                 │
│                                                             │
│  ┌─────────────┐           ┌─────────────┐                 │
│  │ Categories  │ ←────────→│ Categories  │                 │
│  └─────────────┘           └─────────────┘                 │
└─────────────────────────────────────────────────────────────┘

WEBHOOK FLOW (Real-time Updates)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  WooCommerce Store                                          │
│  ┌────────────────────────────────────┐                     │
│  │ Event Occurs (e.g., new order)     │                     │
│  └───────────────┬────────────────────┘                     │
│                  │                                          │
│                  ▼                                          │
│  ┌────────────────────────────────────┐                     │
│  │ WooCommerce Webhook Triggered      │                     │
│  └───────────────┬────────────────────┘                     │
│                  │ POST                                     │
│                  ▼                                          │
│  MBZ Platform                                               │
│  ┌────────────────────────────────────┐                     │
│  │ /api/webhooks/woocommerce          │                     │
│  │ 1. Verify webhook signature        │                     │
│  │ 2. Parse webhook payload           │                     │
│  │ 3. Update local database           │                     │
│  │ 4. Trigger notifications           │                     │
│  └────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘

BATCH SYNC FLOW (Manual/Scheduled)
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User/Cron Trigger                                          │
│         │                                                   │
│         ▼                                                   │
│  ┌────────────────────────────────────┐                     │
│  │ Sync Request Received              │                     │
│  └───────────┬────────────────────────┘                     │
│              │                                              │
│              ▼                                              │
│  ┌────────────────────────────────────┐                     │
│  │ Add to Bull Queue                  │                     │
│  │ (Customer/Order/Product Queue)     │                     │
│  └───────────┬────────────────────────┘                     │
│              │                                              │
│              ▼                                              │
│  ┌────────────────────────────────────┐                     │
│  │ Worker Processes Queue:            │                     │
│  │ 1. Fetch from WooCommerce API      │                     │
│  │ 2. Map data format                 │                     │
│  │ 3. Check for duplicates            │                     │
│  │ 4. Upsert to MongoDB               │                     │
│  │ 5. Log sync results                │                     │
│  └────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Payment Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW                             │
└─────────────────────────────────────────────────────────────┘

USER PAYMENT REQUEST
│
├─→ [Gateway: Flutterwave/Paystack/Squad]
│   │
│   ├─→ 1. Create payment record (status: pending)
│   ├─→ 2. Generate reference ID
│   ├─→ 3. Initialize payment with gateway
│   ├─→ 4. Return payment URL to user
│   │
│   └─→ USER REDIRECTED TO GATEWAY
│       │
│       ├─→ User completes payment
│       │
│       └─→ GATEWAY WEBHOOK
│           │
│           ├─→ Verify webhook signature
│           ├─→ Update payment status
│           ├─→ Activate subscription (if applicable)
│           ├─→ Generate receipt
│           └─→ Send confirmation notification
│
├─→ [Gateway: Bank Transfer]
│   │
│   ├─→ 1. Create payment record (status: pending)
│   ├─→ 2. Show bank details to user
│   ├─→ 3. User uploads payment screenshot
│   ├─→ 4. Upload to Cloudinary
│   ├─→ 5. Update payment (status: manual_review)
│   │
│   └─→ ADMIN REVIEW
│       │
│       ├─→ Admin verifies screenshot
│       ├─→ Update payment (status: success/failed)
│       ├─→ Activate subscription (if approved)
│       └─→ Send confirmation notification
│
└─→ [Gateway: Crypto (BTC/USDT)]
    │
    ├─→ 1. Create payment record (status: pending)
    ├─→ 2. Generate crypto wallet address
    ├─→ 3. Show address & amount to user
    ├─→ 4. User sends crypto
    │
    └─→ BLOCKCHAIN CONFIRMATION
        │
        ├─→ Webhook from crypto provider
        ├─→ Update payment (status: success)
        ├─→ Activate subscription
        └─→ Send confirmation notification
```

---

## Notification System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              NOTIFICATION GENERATION FLOW                   │
└─────────────────────────────────────────────────────────────┘

TRIGGER EVENT
│
├─→ [Business Event Occurs]
│   Examples:
│   • Customer created
│   • Order placed
│   • Inventory low
│   • Task assigned
│   • Payment received
│
└─→ NOTIFICATION HELPER CALLED
    │
    ├─→ 1. Identify notification type
    │       (e.g., "order_created")
    │
    ├─→ 2. Fetch notification template
    │       from NotificationTemplate collection
    │
    ├─→ 3. Get target users
    │       • Admin users for organization
    │       • Specific assigned users
    │       • Based on notification category
    │
    ├─→ 4. Check user preferences
    │       • Email enabled?
    │       • In-app enabled?
    │       • Category enabled?
    │       • Quiet hours active?
    │
    ├─→ 5. Generate notification content
    │       • Replace template variables
    │       • Apply formatting
    │
    ├─→ 6. Create notification records
    │       • Save to Notification collection
    │       • Set priority
    │       • Set read status (unread)
    │
    ├─→ 7. Send via channels
    │   ┌──────────────────────────────┐
    │   │ EMAIL CHANNEL               │
    │   │ • Format as HTML email      │
    │   │ • Send via emailService     │
    │   │ • Log in EmailLogs          │
    │   └──────────────────────────────┘
    │   ┌──────────────────────────────┐
    │   │ IN-APP CHANNEL              │
    │   │ • Store in Notification     │
    │   │ • Available via API         │
    │   │ • Real-time update (future) │
    │   └──────────────────────────────┘
    │
    └─→ 8. Audit log entry
        • Log notification sent
        • Track delivery status
```

---

## Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION FLOW                         │
└─────────────────────────────────────────────────────────────┘

USER REGISTRATION
│
├─→ POST /api/auth/register
│   ├─→ Validate input data
│   ├─→ Check if email exists
│   ├─→ Hash password (bcrypt)
│   ├─→ Create user (status: pending-verification)
│   ├─→ Generate verification token
│   ├─→ Send verification email
│   └─→ Return success message
│
USER EMAIL VERIFICATION
│
├─→ GET /api/auth/verify-email?token=xxx
│   ├─→ Verify token validity
│   ├─→ Update user (emailVerified: true)
│   ├─→ Update user (status: active)
│   └─→ Return success message
│
USER LOGIN
│
├─→ POST /api/auth/login
│   ├─→ Validate email & password
│   ├─→ Check email verified
│   ├─→ Check OTP enabled
│   │   ├─→ If yes: Generate OTP
│   │   │            Send OTP email
│   │   │            Return { requiresOTP: true }
│   │   │
│   │   └─→ If no: Generate JWT token
│   │                Include: userId, organizationId, role
│   │                Return { token, user }
│   │
│   └─→ Update lastLogin timestamp
│
OTP VERIFICATION (if enabled)
│
├─→ POST /api/auth/verify-otp
│   ├─→ Verify OTP code
│   ├─→ Check OTP expiration
│   ├─→ Generate JWT token
│   └─→ Return { token, user }
│
AUTHENTICATED REQUEST
│
├─→ ANY /api/* request with token
│   │
│   └─→ MIDDLEWARE: authMiddleware
│       │
│       ├─→ Extract token from header
│       ├─→ Verify JWT signature
│       ├─→ Decode token payload
│       ├─→ Lookup user in database
│       ├─→ Check user status (active)
│       ├─→ Check email verified
│       ├─→ Attach user to req.user
│       │
│       └─→ MIDDLEWARE: roleMiddleware (if applicable)
│           │
│           ├─→ Check user role
│           ├─→ Check user permissions
│           ├─→ Verify organization access
│           │
│           └─→ PROCEED TO CONTROLLER
│               OR
│               RETURN 403 Forbidden
```

---

## Data Isolation Strategy (Multi-Tenant)

```
┌─────────────────────────────────────────────────────────────┐
│              ORGANIZATION-BASED ISOLATION                   │
└─────────────────────────────────────────────────────────────┘

DATABASE STRUCTURE
│
├─→ Organizations Collection
│   └─→ Each org has unique _id
│
└─→ All Other Collections
    └─→ Include organizationId field
        (indexed for performance)

QUERY PATTERN
│
├─→ User makes request
│   └─→ JWT contains organizationId
│
└─→ All queries automatically filter:
    {
      organization: req.user.organization,
      // ... other query params
    }

EXAMPLE: Fetch Products
│
├─→ Request: GET /api/products
│   Headers: { Authorization: "Bearer <token>" }
│
├─→ JWT decoded:
│   { userId: "xxx", organizationId: "org_123" }
│
└─→ Database Query:
    Product.find({
      organization: "org_123"  ← AUTOMATIC FILTER
    })
    
    Result: Only products for org_123 returned

CROSS-TENANT ISOLATION GUARANTEE
│
├─→ Organization A cannot access Organization B's data
├─→ Even with valid JWT, queries are scoped
├─→ Database indexes ensure performance
└─→ Super-admin has special bypass (if needed)
```

---

## File Upload & Storage Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 FILE UPLOAD FLOW                            │
└─────────────────────────────────────────────────────────────┘

USER UPLOADS FILE
│
├─→ POST request with multipart/form-data
│   │
│   └─→ MIDDLEWARE: express-fileupload
│       │
│       ├─→ Parse file from request
│       ├─→ Store temporarily in /tmp/
│       │
│       └─→ CONTROLLER receives file
│           │
│           ├─→ [Option 1: Cloudinary]
│           │   │
│           │   ├─→ Upload to Cloudinary
│           │   │   cloudinary.uploader.upload(file.tempFilePath)
│           │   │
│           │   ├─→ Receive Cloudinary URL
│           │   ├─→ Store URL in MongoDB
│           │   └─→ Delete temp file
│           │
│           └─→ [Option 2: Local Storage]
│               │
│               ├─→ Move to /uploads/ directory
│               ├─→ Generate unique filename
│               ├─→ Store path in MongoDB
│               └─→ Serve via /uploads route

FILE TYPES HANDLED
│
├─→ Images: Profile pictures, logos, screenshots
│   └─→ Cloudinary (with transformations)
│
├─→ Documents: Invoices, receipts, contracts
│   └─→ Cloudinary or local storage
│
└─→ Task Attachments: Any file type
    └─→ Hybrid (Cloudinary preferred)
```

---

## Cron Jobs & Scheduled Tasks

```
┌─────────────────────────────────────────────────────────────┐
│                 SCHEDULED JOBS                              │
└─────────────────────────────────────────────────────────────┘

EMAIL SYNC (Two-Tier)
├─→ Every 2 minutes: Incoming email check
│   Cron: */2 * * * *
│   Function: incomingEmailListener()
│   Purpose: Check INBOX for new emails
│
└─→ Daily at 2 AM: Full email sync
    Cron: 0 2 * * *
    Function: fullEmailSync()
    Purpose: Sync all folders, all emails

EXCHANGE RATE SYNC
└─→ Daily at 12 AM: Update exchange rates
    Function: rateSyncService.initialize()
    Purpose: Fetch latest currency rates

NOTIFICATION CHECKS (Potential)
└─→ Daily at 9 AM: Task due date checks
    Purpose: Send due soon/overdue notifications

SUBSCRIPTION CHECKS (Potential)
└─→ Daily: Check subscription expiration
    Purpose: Renew, expire, or notify users

CLEANUP JOBS (Potential)
└─→ Weekly: Clean old logs, temp files
    Purpose: Database maintenance
```

---

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 ERROR HANDLING PATTERN                      │
└─────────────────────────────────────────────────────────────┘

CONTROLLER LEVEL
│
└─→ try {
       // Business logic
       
       const result = await service.doSomething();
       
       return res.status(200).json({
         success: true,
         data: result
       });
       
    } catch (error) {
       console.error('[ControllerName]', error);
       
       // Specific error handling
       if (error.name === 'ValidationError') {
         return res.status(400).json({
           success: false,
           message: error.message
         });
       }
       
       // Generic error
       return res.status(500).json({
         success: false,
         message: 'Internal server error',
         error: process.env.NODE_ENV === 'development' 
                ? error.message 
                : undefined
       });
    }

SERVICE LEVEL
│
└─→ Return success/failure objects
    
    return {
      success: false,
      error: error.message,
      statusCode: 400
    }

EXTERNAL API CALLS
│
└─→ WooCommerce Service Example:
    
    try {
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      // Enhanced error logging
      if (error.code === 'CERT_HAS_EXPIRED') {
        console.error('SSL certificate expired');
      }
      
      return {
        success: false,
        error: error.response?.data || error.message,
        statusCode: error.response?.status,
        errorCode: error.code
      };
    }
```

---

## Security Measures

```
┌─────────────────────────────────────────────────────────────┐
│                 SECURITY IMPLEMENTATION                     │
└─────────────────────────────────────────────────────────────┘

AUTHENTICATION
├─→ JWT tokens with expiration
├─→ Bcrypt password hashing (10 rounds)
├─→ Email verification required
├─→ Optional OTP/2FA
└─→ Password reset with time-limited tokens

AUTHORIZATION
├─→ Role-based access control (RBAC)
├─→ Organization-level data isolation
├─→ Route-level middleware protection
└─→ Resource ownership validation

DATA PROTECTION
├─→ MongoDB injection prevention (Mongoose)
├─→ XSS protection (input sanitization)
├─→ CORS configuration
├─→ HTTPS enforcement (Vercel)
└─→ Sensitive data not in logs

API SECURITY
├─→ JWT required for protected routes
├─→ Rate limiting (recommended to add)
├─→ Input validation
└─→ API key management for integrations

AUDIT TRAIL
├─→ Audit logs for critical operations
├─→ User action tracking
├─→ Login history
└─→ Payment transaction logs
```

---

## Performance Optimization Strategies

```
┌─────────────────────────────────────────────────────────────┐
│              PERFORMANCE OPTIMIZATIONS                      │
└─────────────────────────────────────────────────────────────┘

DATABASE
├─→ Indexes on frequently queried fields
│   • organizationId (all collections)
│   • userId, storeId
│   • status fields
│   • date fields
│
├─→ Lean queries (return plain objects)
│
└─→ Pagination for list endpoints

CACHING (Recommended to Add)
├─→ Redis for session storage
├─→ Cache exchange rates
├─→ Cache notification templates
└─→ Cache organization settings

ASYNC PROCESSING
├─→ Bull queue for heavy operations
│   • WooCommerce sync
│   • Email sending
│   • Batch operations
│
└─→ Non-blocking notifications

FILE HANDLING
├─→ Cloudinary CDN for static assets
├─→ Image optimization & transformations
└─→ Lazy loading for large lists

API RESPONSES
├─→ Pagination
├─→ Field selection (select specific fields)
├─→ Gzip compression (Vercel)
└─→ JSON minification
```

---

This architecture document provides a comprehensive visual overview of how the MBZ Tech Platform is structured and how data flows through the system. The platform is designed for scalability, security, and maintainability with clear separation of concerns at every layer.

