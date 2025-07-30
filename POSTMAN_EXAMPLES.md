# Postman Examples for Email & Email Template Creation

## 🔐 Authentication Setup

**First, you need to get a valid JWT token:**

1. **Login Request:**
   ```
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json
   
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
   ```

2. **Copy the token from the response:**
   ```json
   {
     "success": true,
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": { ... }
   }
   ```

3. **Add to all requests:**
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 📧 Email Creation Example

### **Request Details:**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/emails/create`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```

### **Request Body:**
```json
{
  "recipient": "customer@example.com",
  "subject": "Welcome to Our Platform",
  "body": "<h1>Welcome!</h1><p>Thank you for joining our platform.</p><p>We're excited to have you on board!</p>",
  "variables": {
    "userName": "John Doe",
    "companyName": "MBZ Tech",
    "orderNumber": "ORD-12345"
  },
  "emailTemplate": "507f1f77bcf86cd799439011",
  "organization": "507f1f77bcf86cd799439012",
  "user": "507f1f77bcf86cd799439013",
  "status": "drafts"
}
```

### **Field Explanations:**
- `recipient`: Email address of the recipient (required)
- `subject`: Email subject line (required)
- `body`: HTML content of the email (required)
- `variables`: Key-value pairs for dynamic content (optional)
- `emailTemplate`: ID of the email template (optional)
- `organization`: Organization ID (required)
- `user`: User ID who created the email (required)
- `status`: Email status - use "drafts", "sent", "scheduled", or "trash" (optional, defaults to "drafts")

### **Expected Success Response:**
```json
{
  "success": true,
  "email": {
    "_id": "507f1f77bcf86cd799439014",
    "recipient": "customer@example.com",
    "subject": "Welcome to Our Platform",
    "body": "<h1>Welcome!</h1><p>Thank you for joining our platform.</p>",
    "variables": {
      "userName": "John Doe",
      "companyName": "MBZ Tech",
      "orderNumber": "ORD-12345"
    },
    "emailTemplate": "507f1f77bcf86cd799439011",
    "createdBy": "507f1f77bcf86cd799439013",
    "organization": "507f1f77bcf86cd799439012",
    "status": "drafts",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 📝 Email Template Creation Example

### **Request Details:**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/emailTemplates/create`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```

### **Request Body:**
```json
{
  "name": "Welcome Email Template",
  "subject": "Welcome to {{companyName}}",
  "body": "<h1>Welcome {{userName}}!</h1><p>Thank you for joining {{companyName}}. We're excited to have you on board.</p><p>Your order number is: {{orderNumber}}</p><p>Best regards,<br>The {{companyName}} Team</p>",
  "variables": {
    "userName": "Customer Name",
    "companyName": "Company Name",
    "orderNumber": "Order Number"
  },
  "createdBy": "507f1f77bcf86cd799439013",
  "organization": "507f1f77bcf86cd799439012"
}
```

### **Field Explanations:**
- `name`: Template name (required, 3-100 characters)
- `subject`: Email subject with variables like `{{userName}}` (required)
- `body`: HTML content with variables like `{{companyName}}` (required)
- `variables`: Key-value pairs defining available variables (optional)
- `createdBy`: User ID who created the template (required)
- `organization`: Organization ID (required)

### **Expected Success Response:**
```json
{
  "success": true,
  "emailTemplate": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "Welcome Email Template",
    "subject": "Welcome to {{companyName}}",
    "body": "<h1>Welcome {{userName}}!</h1><p>Thank you for joining {{companyName}}. We're excited to have you on board.</p>",
    "variables": {
      "userName": "Customer Name",
      "companyName": "Company Name",
      "orderNumber": "Order Number"
    },
    "isActive": true,
    "createdBy": "507f1f77bcf86cd799439013",
    "organization": "507f1f77bcf86cd799439012",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🧪 Test Examples

### **Minimal Email Creation (Required Fields Only):**
```json
{
  "recipient": "test@example.com",
  "subject": "Test Email",
  "body": "<p>This is a test email.</p>",
  "organization": "507f1f77bcf86cd799439012",
  "user": "507f1f77bcf86cd799439013"
}
```

### **Minimal Template Creation (Required Fields Only):**
```json
{
  "name": "Simple Template",
  "subject": "Hello {{userName}}",
  "body": "<p>Welcome {{userName}}!</p>",
  "createdBy": "507f1f77bcf86cd799439013",
  "organization": "507f1f77bcf86cd799439012"
}
```

---

## ❌ Common Error Examples

### **Invalid Email Format:**
```json
{
  "recipient": "invalid-email",
  "subject": "Test",
  "body": "Test body",
  "organization": "507f1f77bcf86cd799439012",
  "user": "507f1f77bcf86cd799439013"
}
```
**Response:** `400 Bad Request - "Invalid email format for recipient"`

### **Missing Required Fields:**
```json
{
  "recipient": "test@example.com",
  "subject": "",
  "body": "",
  "organization": "507f1f77bcf86cd799439012",
  "user": "507f1f77bcf86cd799439013"
}
```
**Response:** `400 Bad Request - "Recipient, subject, and body are required fields"`

### **Template Name Too Short:**
```json
{
  "name": "ab",
  "subject": "Test",
  "body": "Test body",
  "createdBy": "507f1f77bcf86cd799439013",
  "organization": "507f1f77bcf86cd799439012"
}
```
**Response:** `400 Bad Request - "Template name must be between 3 and 100 characters"`

### **Missing Authentication:**
**Response:** `401 Unauthorized - "Not authorized to access this route"`

---

## 🔧 Postman Collection Setup

### **Environment Variables:**
Create these variables in your Postman environment:
- `base_url`: `http://localhost:5000/api`
- `auth_token`: Your JWT token
- `user_id`: Your user ID
- `org_id`: Your organization ID

### **Request URLs:**
- Email Creation: `{{base_url}}/emails/create`
- Template Creation: `{{base_url}}/emailTemplates/create`

### **Headers (for all requests):**
```
Content-Type: application/json
Authorization: Bearer {{auth_token}}
```

### **Pre-request Script (to auto-fill IDs):**
```javascript
// Auto-fill user and organization IDs if not provided
if (!pm.request.body.raw) return;

let body = JSON.parse(pm.request.body.raw);
if (!body.user && pm.environment.get("user_id")) {
    body.user = pm.environment.get("user_id");
}
if (!body.organization && pm.environment.get("org_id")) {
    body.organization = pm.environment.get("org_id");
}
if (!body.createdBy && pm.environment.get("user_id")) {
    body.createdBy = pm.environment.get("user_id");
}

pm.request.body.raw = JSON.stringify(body);
```

---

## 📋 Quick Reference

### **Required Fields for Email:**
- ✅ `recipient` (valid email)
- ✅ `subject` (non-empty)
- ✅ `body` (non-empty)
- ✅ `organization` (valid ObjectId)
- ✅ `user` or `createdBy` (valid ObjectId)

### **Required Fields for Template:**
- ✅ `name` (3-100 characters)
- ✅ `subject` (non-empty)
- ✅ `body` (non-empty)
- ✅ `createdBy` (valid ObjectId)
- ✅ `organization` (valid ObjectId)

### **Valid Status Values:**
- `"drafts"` (default)
- `"sent"`
- `"scheduled"`
- `"trash"`

### **Authentication:**
- Always include `Authorization: Bearer <token>` header
- Token must be valid and not expired 