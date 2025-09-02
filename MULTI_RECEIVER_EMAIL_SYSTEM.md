# 📧 Multi-Receiver Email System Documentation

## 🎯 Overview

The email system now properly supports **multiple receivers per organization** and can track which receiver each email came from. This allows users to add multiple email accounts (e.g., `info@gmail.com`, `orders@gmail.com`) and clearly identify which account received each email.

## 🏗️ System Architecture

### **Multiple Receivers Per Organization**
- ✅ **Organization** can have multiple **Receivers**
- ✅ Each **Receiver** has its own IMAP settings
- ✅ Each **Receiver** syncs independently
- ✅ All emails are tracked by receiver

### **Email Tracking by Receiver**
- ✅ **Inbox** emails show which receiver they came from
- ✅ **Sent** emails show which receiver they were sent from
- ✅ **Drafts** are associated with specific receivers
- ✅ **Archived** and **Trash** emails maintain receiver tracking

## 📊 Database Schema Updates

### **All Email Models Now Include:**

```javascript
receiver: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Receiver", // Reference to the Receiver email account this email came from
}
```

### **Updated Models:**
- ✅ `Inbox` - Added `receiver` and `recipient` fields
- ✅ `Email` - Added `receiver` field
- ✅ `Draft` - Added `receiver` field
- ✅ `Archived` - Added `receiver` field
- ✅ `Trash` - Added `receiver` field

## 🔄 Email Sync Process

### **How Multiple Receivers Work:**

1. **Organization Setup:**
   ```
   Organization: "My Company"
   ├── Receiver 1: info@mycompany.com (Gmail)
   ├── Receiver 2: orders@mycompany.com (Outlook)
   └── Receiver 3: support@mycompany.com (Yahoo)
   ```

2. **Independent Sync:**
   - Each receiver syncs on its own schedule
   - Each receiver maintains its own `lastFetchedAt` timestamp
   - Each receiver processes only NEW emails since last sync

3. **Email Processing:**
   ```javascript
   // Each email is tagged with its receiver
   const emailData = {
     sender: "customer@example.com",
     subject: "Order Inquiry",
     body: "I need help with my order...",
     receiver: receiver._id, // CRITICAL: Track which receiver
     organization: receiver.organization,
     user: receiver.userId,
     // ... other fields
   };
   ```

## 🎯 User Experience

### **Inbox View:**
Users can now see:
- ✅ **Which email account** received each email
- ✅ **Sender information**
- ✅ **Subject and content**
- ✅ **Received timestamp**
- ✅ **Email status** (read/unread)

### **Example Inbox Display:**
```
📧 Inbox (15 emails)

📬 info@mycompany.com (8 emails)
├── From: john@customer.com - "Product Question" [Unread]
├── From: sarah@client.com - "Meeting Request" [Read]
└── ...

📬 orders@mycompany.com (5 emails)
├── From: customer1@shop.com - "Order #12345" [Unread]
├── From: customer2@store.com - "Shipping Inquiry" [Read]
└── ...

📬 support@mycompany.com (2 emails)
├── From: user@help.com - "Technical Issue" [Unread]
└── ...
```

## 🔍 API Endpoints

### **Get Inbox Emails by Receiver:**
```http
GET /api/inbox/organization/:organizationId?receiver=:receiverId
```

### **Get All Receivers for Organization:**
```http
GET /api/receivers/organization/:organizationId
```

### **Get Emails by Specific Receiver:**
```http
GET /api/inbox/receiver/:receiverId
```

## 🛡️ Enhanced Duplicate Prevention

### **Multi-Receiver Duplicate Prevention:**
```javascript
// Method 1: Check by messageId + receiver
existingEmail = await EmailModel.findOne({ 
  messageId: parsedEmail.messageId,
  organization: receiver.organization,
  receiver: receiver._id // Prevents cross-receiver duplicates
});

// Method 2: Check by subject + sender + receiver + date
existingEmail = await EmailModel.findOne({
  subject: parsedEmail.subject,
  sender: parsedEmail.from.text,
  organization: receiver.organization,
  receiver: receiver._id, // Receiver-specific duplicate check
  receivedAt: { $gte: startOfDay, $lte: endOfDay }
});
```

## 📈 Benefits

### **For Users:**
- ✅ **Clear Email Organization** - Know which account received each email
- ✅ **Multiple Email Accounts** - Manage business and personal emails separately
- ✅ **Better Email Management** - Filter and organize by receiver
- ✅ **No Confusion** - Clear identification of email sources

### **For Organizations:**
- ✅ **Departmental Emails** - Different departments can have their own email accounts
- ✅ **Customer Service** - Separate support, sales, and general inquiry emails
- ✅ **Business Operations** - Orders, billing, and general business emails
- ✅ **Scalability** - Add as many email accounts as needed

## 🔧 Configuration

### **Adding Multiple Receivers:**

1. **Create Receiver 1:**
   ```javascript
   {
     name: "Info Email",
     email: "info@mycompany.com",
     imapHost: "imap.gmail.com",
     imapPort: 993,
     username: "info@mycompany.com",
     password: "app_password",
     organization: "org_id",
     userId: "user_id"
   }
   ```

2. **Create Receiver 2:**
   ```javascript
   {
     name: "Orders Email",
     email: "orders@mycompany.com",
     imapHost: "outlook.office365.com",
     imapPort: 993,
     username: "orders@mycompany.com",
     password: "app_password",
     organization: "org_id", // Same organization
     userId: "user_id"       // Same user
   }
   ```

## 🚀 Usage Examples

### **Frontend Implementation:**
```javascript
// Get all receivers for organization
const receivers = await api.get(`/api/receivers/organization/${orgId}`);

// Get inbox emails grouped by receiver
const inboxEmails = await api.get(`/api/inbox/organization/${orgId}`);

// Group emails by receiver
const emailsByReceiver = inboxEmails.reduce((acc, email) => {
  const receiverId = email.receiver._id;
  if (!acc[receiverId]) {
    acc[receiverId] = {
      receiver: email.receiver,
      emails: []
    };
  }
  acc[receiverId].emails.push(email);
  return acc;
}, {});
```

### **Display in UI:**
```jsx
{Object.values(emailsByReceiver).map(({ receiver, emails }) => (
  <div key={receiver._id} className="receiver-section">
    <h3>📬 {receiver.email} ({emails.length} emails)</h3>
    {emails.map(email => (
      <EmailItem key={email._id} email={email} />
    ))}
  </div>
))}
```

## 🔄 Migration Notes

### **Existing Data:**
- ✅ **New emails** will automatically include receiver tracking
- ✅ **Old emails** will have `receiver: null` (can be filtered out or migrated)
- ✅ **No breaking changes** to existing functionality

### **Backward Compatibility:**
- ✅ **API endpoints** remain the same
- ✅ **Existing queries** still work
- ✅ **New receiver field** is optional in queries

## 📋 Summary

The multi-receiver email system now provides:

1. **✅ Multiple Email Accounts** - Organizations can add multiple receivers
2. **✅ Receiver Tracking** - Every email is tagged with its receiver
3. **✅ Independent Sync** - Each receiver syncs independently
4. **✅ Enhanced Duplicate Prevention** - Receiver-specific duplicate checking
5. **✅ Clear User Experience** - Users can see which account received each email
6. **✅ Scalable Architecture** - Support for unlimited receivers per organization

This system ensures that when a user adds `info@gmail.com` and `orders@gmail.com`, they can clearly distinguish which emails came from which account in their inbox.
