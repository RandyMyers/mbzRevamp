# Webhook Auto-Creation Feature

## Overview

The webhook auto-creation feature automatically sets up WooCommerce webhooks when a new store is added to the platform. This enables real-time synchronization of orders, customers, and products between WooCommerce stores and the platform.

## Features

### Automatic Webhook Creation
- Creates webhooks automatically when a new WooCommerce store is added
- Supports 6 default webhook topics:
  - `order.created` - New orders
  - `order.updated` - Order modifications
  - `customer.created` - New customers
  - `customer.updated` - Customer modifications
  - `product.created` - New products
  - `product.updated` - Product modifications

### Manual Webhook Management
- Create webhooks for existing stores
- View webhook status and statistics
- Bulk update webhook status
- Test webhook functionality

### Frontend Integration
- Checkbox option during store creation
- Webhook creation status display
- Webhook management interface for existing stores

## API Endpoints

### Store Creation with Webhooks
```
POST /api/stores/create
```

**Request Body:**
```json
{
  "name": "My Store",
  "organizationId": "org123",
  "userId": "user123",
  "platformType": "woocommerce",
  "url": "https://mystore.com",
  "apiKey": "ck_xxx",
  "secretKey": "cs_xxx",
  "createWebhooks": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Store created successfully",
  "store": { /* store data */ },
  "webhookCreation": {
    "total": 6,
    "successful": 6,
    "failed": 0,
    "webhooks": [
      {
        "topic": "order.created",
        "webhookId": "webhook123",
        "wooCommerceId": 123,
        "deliveryUrl": "https://api.example.com/webhooks/..."
      }
    ],
    "errors": []
  }
}
```

### Create Webhooks for Existing Store
```
POST /api/stores/:storeId/webhooks
```

**Request Body:**
```json
{
  "topics": ["order.created", "customer.created"],
  "userId": "user123"
}
```

### Get Webhook Status
```
GET /api/stores/:storeId/webhooks/status
```

**Response:**
```json
{
  "success": true,
  "store": "My Store",
  "webhookStatus": {
    "total": 6,
    "active": 5,
    "paused": 1,
    "disabled": 0,
    "topics": [
      {
        "topic": "order.created",
        "status": "active",
        "lastDelivery": "2024-01-15T10:30:00Z",
        "failureCount": 0
      }
    ]
  }
}
```

### Bulk Update Webhooks
```
PUT /api/webhooks/bulk/update
```

**Request Body:**
```json
{
  "webhookIds": ["webhook1", "webhook2"],
  "status": "active"
}
```

### Get Webhook Statistics
```
GET /api/webhooks/stats?storeId=store123&days=30
```

## Implementation Details

### Backend Services

#### webhookAutoCreationService.js
- `createDefaultWebhooks()` - Creates default webhooks for a store
- `createSingleWebhook()` - Creates a single webhook
- `validateStoreForWebhooks()` - Validates store configuration
- `getWebhookStatus()` - Gets webhook status for a store

#### Store Controller Updates
- Enhanced `createStore()` to include webhook creation
- Added `createStoreWebhooks()` for manual webhook creation
- Added `getStoreWebhookStatus()` for status checking

#### Webhook Controller Enhancements
- Enhanced `listWebhooks()` with summary statistics
- Added `bulkUpdateWebhooks()` for bulk operations
- Added `getWebhookStats()` for analytics

### Frontend Components

#### StoreForm.js
- Added webhook creation checkbox
- Displays webhook creation results
- Conditional form submission based on webhook status

#### WebhookCreationStatus.js
- Displays webhook creation results
- Shows success/failure counts
- Lists created webhooks and errors

#### StoreWebhookManager.js
- Manages webhooks for existing stores
- Topic selection interface
- Webhook status display
- Bulk operations

### Database Schema

#### Webhook Model
```javascript
{
  storeId: ObjectId,
  organizationId: ObjectId,
  wooCommerceId: Number,
  webhookIdentifier: String,
  name: String,
  topic: String,
  status: String,
  deliveryUrl: String,
  secret: String,
  resource: String,
  event: String,
  hooks: [String],
  failureCount: Number,
  lastDelivery: Date,
  lastFailure: Date,
  lastFailureReason: String
}
```

## Configuration

### Environment Variables
```bash
API_BASE_URL=http://localhost:8800
PORT=8800
```

### Default Webhook Topics
```javascript
const DEFAULT_WEBHOOK_TOPICS = [
  'order.created',
  'order.updated',
  'customer.created',
  'customer.updated',
  'product.created',
  'product.updated'
];
```

## Error Handling

### Validation Errors
- Store URL validation
- API credentials validation
- Store status validation

### WooCommerce API Errors
- Connection failures
- Authentication errors
- Rate limiting
- Invalid webhook configuration

### Database Errors
- Duplicate webhook identifiers
- Store not found
- Organization validation

## Security Considerations

### Webhook Security
- Unique webhook identifiers per store
- Secure secret generation
- URL-based store identification
- Signature verification

### API Security
- User authentication required
- Organization-based access control
- Rate limiting on webhook creation
- Input validation and sanitization

## Monitoring and Logging

### Event Logging
- Webhook creation events
- Webhook delivery attempts
- Failure tracking
- Performance metrics

### Error Tracking
- Failed webhook creations
- WooCommerce API errors
- Database operation failures
- User action logging

## Testing

### Unit Tests
- Service function testing
- Validation logic testing
- Error handling testing

### Integration Tests
- Store creation flow
- Webhook creation flow
- API endpoint testing
- Frontend component testing

## Future Enhancements

### Planned Features
- Webhook delivery retry logic
- Advanced webhook filtering
- Webhook performance analytics
- Custom webhook topics
- Webhook templates

### Scalability Improvements
- Batch webhook processing
- Async webhook creation
- Webhook queue management
- Performance optimization 