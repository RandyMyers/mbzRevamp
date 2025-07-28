# 📧 Email Sync System Documentation

## 🎯 Overview

The email sync system has been completely restructured to implement a **two-tier approach** that efficiently handles both incoming email detection and full email synchronization.

## 🔄 Two-Tier System Architecture

### **Tier 1: Incoming Email Listener** (Frequent, Efficient)
- **Purpose**: Check for new incoming emails only
- **Frequency**: Every 2 minutes
- **Scope**: Only INBOX folder
- **Search Criteria**: `['UNSEEN']` (only new emails)
- **Resource Usage**: Minimal
- **Use Case**: Real-time incoming email detection

### **Tier 2: Full Email Sync** (Infrequent, Comprehensive)
- **Purpose**: Complete synchronization of all email folders
- **Frequency**: Once daily at 2:00 AM
- **Scope**: All folders (INBOX, Sent, Drafts, Trash, Archive, Spam)
- **Search Criteria**: `['ALL']` (all emails)
- **Resource Usage**: High (but infrequent)
- **Use Case**: Complete email access and backup

## 📁 File Structure

```
server/
├── helper/
│   ├── receiverEmail.js          # Core email sync functions
│   └── receiverEvent.js          # Cron job scheduling
├── controllers/
│   └── receiverControllers.js    # API endpoints for manual control
├── routes/
│   └── receiverRoutes.js         # API routes
└── test-email-sync.js           # Test script
```

## 🔧 Core Functions

### **incomingEmailListener(receiverId)**
```javascript
// Only checks INBOX for new emails
const searchCriteria = ['UNSEEN'];
const foldersToCheck = ['INBOX'];
```

### **fullEmailSync(receiverId)**
```javascript
// Checks all folders for all emails
const searchCriteria = ['ALL'];
const foldersToCheck = ['INBOX', 'Sent', 'Drafts', 'Trash', 'Archive', 'Spam'];
```

### **manualSync(receiverId, syncType)**
```javascript
// Custom sync with type parameter
// syncType: 'incoming' | 'full'
```

## ⏰ Cron Job Schedule

```javascript
// Tier 1: Incoming email listener - every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  // Check for new incoming emails
});

// Tier 2: Full sync - once daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  // Full email synchronization
});
```

## 🌐 API Endpoints

### **Manual Email Sync Control**

#### **Check Incoming Emails**
```http
POST /api/receivers/:receiverId/check-incoming
```
- **Purpose**: Manually trigger incoming email check
- **Response**: Success/failure status

#### **Full Email Sync**
```http
POST /api/receivers/:receiverId/full-sync
```
- **Purpose**: Manually trigger full email synchronization
- **Response**: Success/failure status

#### **Custom Email Sync**
```http
POST /api/receivers/:receiverId/custom-sync
Content-Type: application/json

{
  "syncType": "incoming"  // or "full"
}
```
- **Purpose**: Custom sync with specified type
- **Response**: Success/failure status with sync type

#### **Legacy Endpoint** (Backward Compatibility)
```http
POST /api/receivers/:receiverId/fetch-emails
```
- **Purpose**: Legacy endpoint for backward compatibility
- **Behavior**: Performs full sync

## 🔍 Duplicate Prevention

The system uses enhanced duplicate prevention:

1. **MessageId Check**: Primary method using email message ID
2. **Subject + Sender + Date Check**: Fallback method
3. **Organization Isolation**: Emails are isolated by organization

```javascript
// Enhanced duplicate prevention
let existingEmail = null;

// Check by messageId first
if (parsedEmail.messageId) {
  existingEmail = await EmailModel.findOne({ 
    messageId: parsedEmail.messageId,
    organization: receiver.organization 
  });
}

// Fallback: check by subject, sender, and date range
if (!existingEmail && parsedEmail.subject && parsedEmail.from) {
  const receivedDate = moment(header.date).toDate();
  const startOfDay = moment(receivedDate).startOf('day').toDate();
  const endOfDay = moment(receivedDate).endOf('day').toDate();
  
  existingEmail = await EmailModel.findOne({
    subject: parsedEmail.subject,
    sender: parsedEmail.from.text,
    organization: receiver.organization,
    receivedAt: { $gte: startOfDay, $lte: endOfDay }
  });
}
```

## 📊 Folder Mapping

```javascript
const FOLDER_MAPPING = {
  'INBOX': { model: Inbox, status: 'unread' },
  'Sent': { model: Email, status: 'sent' },
  'Sent Items': { model: Email, status: 'sent' },
  'Drafts': { model: Draft, status: 'draft' },
  'Trash': { model: Trash, status: 'unread' },
  'Deleted Items': { model: Trash, status: 'unread' },
  'Archive': { model: Archived, status: 'archived' },
  'Spam': { model: Inbox, status: 'spam' },
  'All Mail': { model: Inbox, status: 'unread' }
};
```

## 🧪 Testing

Run the test script to verify the system:

```bash
node server/test-email-sync.js
```

## 📈 Benefits

### **Before (Old System)**
- ❌ Fetched ALL emails every 5 minutes
- ❌ Processed ALL folders repeatedly
- ❌ Wasted server resources
- ❌ Created unnecessary load
- ❌ Wrong purpose (full sync every 5 min)

### **After (New System)**
- ✅ Only checks for NEW emails every 2 minutes
- ✅ Only processes INBOX for incoming emails
- ✅ Efficient resource usage
- ✅ Minimal load for frequent checks
- ✅ Proper purpose separation
- ✅ Complete access through daily full sync

## 🔧 Configuration

### **Cron Schedule Adjustment**
To change the frequency, modify `server/helper/receiverEvent.js`:

```javascript
// Change incoming email check frequency
cron.schedule('*/1 * * * *', async () => {  // Every 1 minute
  // Incoming email check
});

// Change full sync frequency
cron.schedule('0 3 * * *', async () => {    // Daily at 3 AM
  // Full email sync
});
```

### **Provider Support**
Add new email providers in `server/helper/receiverEmail.js`:

```javascript
const PROVIDER_FOLDERS = {
  'your-provider.com': ['INBOX', 'Sent', 'Drafts', 'Trash'],
  // Add more providers here
};
```

## 🚨 Troubleshooting

### **Common Issues**

1. **No emails being fetched**
   - Check receiver is active
   - Verify IMAP credentials
   - Check firewall/network connectivity

2. **Duplicate emails**
   - Verify duplicate prevention logic
   - Check messageId parsing
   - Review organization isolation

3. **High resource usage**
   - Check cron job frequency
   - Verify connection timeouts
   - Monitor database queries

### **Debug Logs**
The system provides detailed logging:
- 📧 Incoming email checks
- 🔄 Full sync operations
- ⏭️ Duplicate prevention
- ❌ Error handling

## 🔄 Migration from Old System

The new system is backward compatible:
- Legacy `receiverEmails()` function still works
- Old API endpoints still functional
- Gradual migration possible

## 📋 Summary

This two-tier system provides:
- **Real-time incoming email detection** (every 2 minutes)
- **Complete email access** (daily full sync)
- **Efficient resource usage** (minimal load)
- **Manual control** (API endpoints)
- **Enhanced reliability** (better error handling)
- **Proper purpose separation** (incoming vs. full sync) 