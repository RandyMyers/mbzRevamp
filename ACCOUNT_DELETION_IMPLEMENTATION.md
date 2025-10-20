# 🗑️ Account Self-Deletion Implementation

## ✅ **Implementation Complete**

This document outlines the comprehensive account self-deletion functionality implemented for **organization users only** (clients).

---

## 🎯 **Key Features**

### **1. User Type Restrictions**
- ✅ **Organization Users**: Can delete their own accounts
- ❌ **Super Admins**: Cannot delete their accounts (platform owners)
- ❌ **Affiliates**: Cannot delete their accounts (referral partners)

### **2. Soft Deletion with Grace Period**
- ✅ **30-day grace period** before permanent deletion
- ✅ **Account archiving** instead of immediate deletion
- ✅ **Recovery option** during grace period
- ✅ **Automatic cleanup** after grace period expires

### **3. Security Measures**
- ✅ **Password confirmation** required for deletion
- ✅ **Audit logging** for all deletion activities
- ✅ **Status tracking** for deletion requests
- ✅ **Prevention of duplicate requests**

---

## 📋 **API Endpoints**

### **1. Request Account Deletion**
```http
POST /api/users/delete-account
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "currentPassword123",
  "reason": "No longer need the service"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account deletion initiated. You have 30 days to cancel this request.",
  "data": {
    "deletionScheduledFor": "2024-02-15T10:30:00.000Z",
    "gracePeriodDays": 30,
    "canCancel": true
  }
}
```

### **2. Cancel Account Deletion**
```http
POST /api/users/cancel-deletion
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Account deletion cancelled successfully. Your account is now active."
}
```

### **3. Get Deletion Status**
```http
GET /api/users/deletion-status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isDeleted": false,
    "isDeletionScheduled": true,
    "deletionScheduledFor": "2024-02-15T10:30:00.000Z",
    "daysRemaining": 25,
    "canCancel": true,
    "deletionReason": "user-requested"
  }
}
```

---

## 🗄️ **Database Schema Updates**

### **User Model Fields Added:**
```javascript
{
  // Soft deletion fields
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  deletionReason: { 
    type: String, 
    enum: ['user-requested', 'admin-requested', 'inactive', 'policy-violation'],
    default: null 
  },
  deletionScheduledFor: { type: Date, default: null },
  deletionConfirmationToken: { type: String, default: null },
  deletionConfirmationExpires: { type: Date, default: null }
}
```

### **User Model Methods Added:**
```javascript
// Check if user can be deleted
user.canBeDeleted() // Returns false for super-admin/affiliate

// Initiate soft deletion
user.initiateSoftDeletion('user-requested')

// Cancel soft deletion
user.cancelSoftDeletion()

// Check if deletion is scheduled
user.isDeletionScheduled()
```

---

## 🧹 **Data Cleanup Process**

### **What Gets Cleaned Up:**
1. **User's Stores** - All stores and related data
2. **User's Orders** - All order history
3. **User's Customers** - All customer data
4. **User's Products** - All products and inventory
5. **User's Analytics** - All analytics data
6. **Organization** - If no active users remain

### **Cleanup Service:**
- **File**: `server/services/accountCleanupService.js`
- **Cron Job**: `server/scripts/cleanupScheduledAccounts.js`
- **Daily Execution**: Processes accounts past their deletion date

---

## ⚙️ **Setup Instructions**

### **1. Database Migration**
The new fields are automatically added to the User model. No manual migration needed.

### **2. Cron Job Setup**
Add this to your crontab to run daily cleanup:
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/server && node scripts/cleanupScheduledAccounts.js
```

### **3. Manual Cleanup (if needed)**
```bash
# Run cleanup manually
node scripts/cleanupScheduledAccounts.js
```

---

## 🔒 **Security Considerations**

### **1. User Type Validation**
- Only organization users can delete their accounts
- Super admins and affiliates are protected from self-deletion

### **2. Password Confirmation**
- Current password required for deletion request
- Prevents unauthorized deletion attempts

### **3. Audit Logging**
- All deletion activities are logged
- Includes user details, timestamps, and reasons

### **4. Grace Period**
- 30-day window for account recovery
- Prevents accidental permanent deletion

---

## 📊 **Monitoring & Statistics**

### **Get Cleanup Statistics:**
```javascript
const AccountCleanupService = require('./services/accountCleanupService');
const stats = await AccountCleanupService.getCleanupStats();
```

**Response:**
```json
{
  "scheduledForDeletion": 5,
  "pendingDeletion": 12,
  "totalPending": 17
}
```

---

## 🚨 **Error Handling**

### **Common Error Scenarios:**
1. **Invalid Password**: Returns 400 with clear message
2. **User Type Not Allowed**: Returns 403 for super-admin/affiliate
3. **Already Scheduled**: Returns 400 if deletion already requested
4. **No Deletion Found**: Returns 400 when trying to cancel non-existent deletion

### **Logging:**
- All errors are logged with context
- Failed cleanup attempts are tracked
- Audit trail maintained for compliance

---

## ✅ **Testing Checklist**

### **Frontend Integration:**
- [ ] Add "Delete Account" option in user settings
- [ ] Show deletion status and countdown
- [ ] Implement password confirmation modal
- [ ] Add "Cancel Deletion" option
- [ ] Display grace period information

### **Backend Testing:**
- [ ] Test deletion request with valid password
- [ ] Test deletion request with invalid password
- [ ] Test cancellation of scheduled deletion
- [ ] Test status endpoint
- [ ] Test cleanup service manually

### **Security Testing:**
- [ ] Verify super-admin cannot delete account
- [ ] Verify affiliate cannot delete account
- [ ] Test duplicate deletion requests
- [ ] Verify audit logging works

---

## 📝 **Notes**

1. **Grace Period**: Currently set to 30 days (configurable)
2. **Cleanup Frequency**: Daily via cron job
3. **Data Retention**: All data is permanently deleted after grace period
4. **Recovery**: Users can cancel deletion during grace period
5. **Organization Impact**: Organizations are marked for deletion if no active users remain

---

## 🔄 **Future Enhancements**

1. **Email Notifications**: Send reminders during grace period
2. **Data Export**: Allow users to export data before deletion
3. **Extended Grace Period**: Configurable grace period per organization
4. **Bulk Operations**: Admin tools for managing scheduled deletions
5. **Analytics**: Track deletion patterns and reasons
