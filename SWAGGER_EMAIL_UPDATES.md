# 📧 Swagger Documentation Updates for Multi-Receiver Email System

## 🎯 Overview

This document outlines the required Swagger documentation updates to reflect the new multi-receiver email system with the `receiver` field tracking.

## 📊 Schema Updates Required

### **1. Inbox Schema Updates**
```yaml
Inbox:
  type: object
  required: ['sender', 'subject', 'body', 'recipient']
  properties:
    _id:
      type: string
      format: ObjectId
      description: 'Inbox email ID'
    sender:
      type: string
      description: 'Email sender address'
      example: 'sender@example.com'
    subject:
      type: string
      description: 'Email subject line'
      example: 'Important meeting reminder'
    body:
      type: string
      description: 'Email body content'
    replyTo:
      type: string
      format: ObjectId
      description: 'Reference to the original email this is a reply to'
    status:
      type: string
      enum: ['unread', 'read', 'archived', 'spam']
      default: 'unread'
      description: 'Email read status'
    receivedAt:
      type: string
      format: date-time
      description: 'When the email was received'
    emailLogs:
      type: array
      items:
        type: string
        format: ObjectId
      description: 'Array of references to EmailLogs'
    organization:
      type: string
      format: ObjectId
      description: 'Reference to the Organization receiving the email'
    user:
      type: string
      format: ObjectId
      description: 'Reference to the User associated with the inbox'
    receiver:
      type: string
      format: ObjectId
      description: 'Reference to the Receiver email account this email came from'
    recipient:
      type: string
      description: 'Email address that received this email'
      example: 'info@mycompany.com'
    createdAt:
      type: string
      format: date-time
      description: 'Inbox entry creation timestamp'
    updatedAt:
      type: string
      format: date-time
      description: 'Inbox entry last update timestamp'
```

### **2. Email Schema Updates**
```yaml
Email:
  type: object
  required: ['recipient', 'subject', 'body', 'createdBy']
  properties:
    _id:
      type: string
      format: ObjectId
      description: 'Email ID'
    recipient:
      type: string
      description: 'Email recipient address'
      example: 'recipient@example.com'
    subject:
      type: string
      description: 'Email subject line'
    body:
      type: string
      description: 'Email body content'
    variables:
      type: object
      description: 'Key-value pairs for dynamic variables'
    messageId:
      type: string
      description: 'Email message ID'
    emailTemplate:
      type: string
      format: ObjectId
      description: 'Reference to the EmailTemplate model'
    campaign:
      type: string
      format: ObjectId
      description: 'Reference to the Campaign model'
    workflow:
      type: string
      format: ObjectId
      description: 'Reference to the Workflow model'
    emailLogs:
      type: array
      items:
        type: string
        format: ObjectId
      description: 'Array of references to EmailLogs'
    createdBy:
      type: string
      format: ObjectId
      description: 'Reference to the User who initiated the email'
      required: true
    organization:
      type: string
      format: ObjectId
      description: 'Reference to the Organization associated with the email'
    receiver:
      type: string
      format: ObjectId
      description: 'Reference to the Receiver email account this email came from'
    status:
      type: string
      enum: ['trash', 'drafts', 'scheduled', 'sent', 'failed', 'pending']
      default: 'drafts'
      description: 'Email status'
    errorMessage:
      type: string
      description: 'Error message if email failed'
    sentAt:
      type: string
      format: date-time
      description: 'When the email was sent'
    createdAt:
      type: string
      format: date-time
      description: 'Email creation timestamp'
    updatedAt:
      type: string
      format: date-time
      description: 'Email last update timestamp'
```

### **3. Draft Schema Updates**
```yaml
Draft:
  type: object
  required: ['sender', 'subject', 'body']
  properties:
    _id:
      type: string
      format: ObjectId
      description: 'Draft email ID'
    sender:
      type: string
      description: 'Email sender address'
    subject:
      type: string
      description: 'Email subject line'
    body:
      type: string
      description: 'Email body content'
    replyTo:
      type: string
      format: ObjectId
      description: 'Reference to the original email'
    status:
      type: string
      enum: ['draft']
      default: 'draft'
      description: 'Draft status'
    lastSavedAt:
      type: string
      format: date-time
      description: 'When the draft was last saved'
    emailLogs:
      type: array
      items:
        type: string
        format: ObjectId
      description: 'Array of references to EmailLogs'
    organization:
      type: string
      format: ObjectId
      description: 'Reference to the Organization'
    user:
      type: string
      format: ObjectId
      description: 'Reference to the User'
    receiver:
      type: string
      format: ObjectId
      description: 'Reference to the Receiver email account this draft belongs to'
    attachments:
      type: array
      items:
        type: object
        properties:
          filename: { type: string }
          path: { type: string }
          mimetype: { type: string }
          size: { type: number }
      description: 'Email attachments'
    recipients:
      type: array
      items:
        type: string
      description: 'Email recipients'
    cc:
      type: array
      items:
        type: string
      description: 'CC recipients'
    bcc:
      type: array
      items:
        type: string
      description: 'BCC recipients'
    createdAt:
      type: string
      format: date-time
      description: 'Draft creation timestamp'
    updatedAt:
      type: string
      format: date-time
      description: 'Draft last update timestamp'
```

### **4. Archived Schema Updates**
```yaml
Archived:
  type: object
  required: ['sender', 'subject', 'body', 'originalFolder']
  properties:
    _id:
      type: string
      format: ObjectId
      description: 'Archived email ID'
    sender:
      type: string
      description: 'Email sender address'
    subject:
      type: string
      description: 'Email subject line'
    body:
      type: string
      description: 'Email body content'
    replyTo:
      type: string
      format: ObjectId
      description: 'Reference to the original email'
    status:
      type: string
      enum: ['archived']
      default: 'archived'
      description: 'Archived status'
    archivedAt:
      type: string
      format: date-time
      description: 'When the email was archived'
    emailLogs:
      type: array
      items:
        type: string
        format: ObjectId
      description: 'Array of references to EmailLogs'
    organization:
      type: string
      format: ObjectId
      description: 'Reference to the Organization'
    user:
      type: string
      format: ObjectId
      description: 'Reference to the User'
    receiver:
      type: string
      format: ObjectId
      description: 'Reference to the Receiver email account this email came from'
    originalFolder:
      type: string
      enum: ['inbox', 'sent', 'drafts', 'outbox']
      description: 'Original folder before archiving'
    attachments:
      type: array
      items:
        type: object
        properties:
          filename: { type: string }
          path: { type: string }
          mimetype: { type: string }
          size: { type: number }
      description: 'Email attachments'
    recipients:
      type: array
      items:
        type: string
      description: 'Email recipients'
    cc:
      type: array
      items:
        type: string
      description: 'CC recipients'
    bcc:
      type: array
      items:
        type: string
      description: 'BCC recipients'
    createdAt:
      type: string
      format: date-time
      description: 'Archived entry creation timestamp'
    updatedAt:
      type: string
      format: date-time
      description: 'Archived entry last update timestamp'
```

### **5. Trash Schema Updates**
```yaml
Trash:
  type: object
  required: ['sender', 'subject', 'body', 'originalFolder']
  properties:
    _id:
      type: string
      format: ObjectId
      description: 'Trash email ID'
    sender:
      type: string
      description: 'Email sender address'
    subject:
      type: string
      description: 'Email subject line'
    body:
      type: string
      description: 'Email body content'
    replyTo:
      type: string
      format: ObjectId
      description: 'Reference to the original email'
    status:
      type: string
      enum: ['unread', 'read']
      default: 'unread'
      description: 'Email read status'
    receivedAt:
      type: string
      format: date-time
      description: 'When the email was originally received'
    deletedAt:
      type: string
      format: date-time
      description: 'When the email was deleted'
    emailLogs:
      type: array
      items:
        type: string
        format: ObjectId
      description: 'Array of references to EmailLogs'
    organization:
      type: string
      format: ObjectId
      description: 'Reference to the Organization'
    user:
      type: string
      format: ObjectId
      description: 'Reference to the User'
    receiver:
      type: string
      format: ObjectId
      description: 'Reference to the Receiver email account this email came from'
    originalFolder:
      type: string
      enum: ['inbox', 'sent', 'drafts', 'outbox', 'archived']
      description: 'Original folder before deletion'
    createdAt:
      type: string
      format: date-time
      description: 'Trash entry creation timestamp'
    updatedAt:
      type: string
      format: date-time
      description: 'Trash entry last update timestamp'
```

## 🔗 New API Endpoints

### **1. Get Inbox Emails by Receiver**
```yaml
/api/inbox/receiver/{receiverId}:
  get:
    tags: [Inbox]
    summary: Get inbox emails by specific receiver
    parameters:
      - in: path
        name: receiverId
        required: true
        schema: { type: string }
        description: Receiver email account ID
    responses:
      200: 
        description: Inbox emails for specific receiver
        content:
          application/json:
            schema:
              type: object
              properties:
                success: { type: boolean }
                inboxEmails:
                  type: array
                  items:
                    $ref: '#/components/schemas/Inbox'
      404: { description: Receiver not found }
      500: { description: Server error }
```

### **2. Get Inbox Emails by Organization with Receiver Filter**
```yaml
/api/inbox/organization/{organizationId}:
  get:
    tags: [Inbox]
    summary: Get inbox emails by organization
    parameters:
      - in: path
        name: organizationId
        required: true
        schema: { type: string }
      - in: query
        name: receiver
        required: false
        schema: { type: string }
        description: Filter by receiver email account ID
    responses:
      200: 
        description: Inbox emails list
        content:
          application/json:
            schema:
              type: object
              properties:
                success: { type: boolean }
                inboxEmails:
                  type: array
                  items:
                    $ref: '#/components/schemas/Inbox'
      400: { description: Missing organizationId }
      500: { description: Server error }
```

## 📋 Implementation Checklist

### **Controllers to Update:**
- [ ] `inboxControllers.js` - ✅ Updated
- [ ] `emailsControllers.js` - ⏳ Pending
- [ ] `draftControllers.js` - ⏳ Pending
- [ ] `archivedControllers.js` - ⏳ Pending
- [ ] `trashControllers.js` - ⏳ Pending
- [ ] `sentControllers.js` - ⏳ Pending

### **Routes to Update:**
- [ ] `inboxRoutes.js` - ✅ Updated
- [ ] `emailRoutes.js` - ⏳ Pending
- [ ] `draftRoutes.js` - ⏳ Pending
- [ ] `archivedRoutes.js` - ⏳ Pending
- [ ] `trashRoutes.js` - ⏳ Pending
- [ ] `sentRoutes.js` - ⏳ Pending

### **Main Swagger File:**
- [ ] `swagger.js` - Add new schemas to components section

## 🎯 Key Changes Summary

1. **✅ Added `receiver` field** to all email models
2. **✅ Added `recipient` field** to Inbox model
3. **✅ Updated status enums** to include 'spam' for Inbox
4. **✅ Added new API endpoints** for receiver-specific queries
5. **✅ Enhanced query parameters** for filtering by receiver
6. **✅ Updated response schemas** to include receiver information

## 🚀 Benefits

- **Clear API Documentation** - Developers know exactly what fields are available
- **Receiver Tracking** - API consumers can filter and group emails by receiver
- **Better Integration** - Frontend can easily implement multi-receiver email management
- **Consistent Schema** - All email models follow the same pattern
- **Enhanced Filtering** - Query parameters allow flexible email retrieval
