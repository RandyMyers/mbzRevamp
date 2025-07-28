# Store-Wide Delete Functionality

## Overview
Complete implementation for deleting all customers, orders, and products for a specific store with optional WooCommerce synchronization.

## New API Endpoints

### Delete All Customers by Store
```http
DELETE /api/customers/store/:storeId
Body: { "syncToWooCommerce": false }
```

### Delete All Orders by Store  
```http
DELETE /api/orders/store/:storeId
Body: { "syncToWooCommerce": false }
```

### Delete All Products by Store (Enhanced)
```http
DELETE /api/inventory/store/:storeId
```

## Frontend Features

### Store Table UI
- Delete buttons for Customers, Orders, and Products
- Confirmation dialogs with clear warnings
- WooCommerce sync options
- Success/error notifications

### Redux Integration
- Complete Redux flow (actions, reducers, types)
- Loading states and error handling
- State updates after successful deletions

## Safety Features

1. **Multiple Confirmations**: Primary + WooCommerce sync confirmation
2. **WooCommerce Integration**: Optional sync (defaults to false)
3. **Comprehensive Logging**: All operations logged with details
4. **Error Handling**: Graceful handling of API failures

## Testing

Use the test script: `server/test-delete-endpoints.js`

```javascript
// Configure and run tests
const TEST_STORE_ID = 'your-test-store-id';
const AUTH_TOKEN = 'your-auth-token';
runTests();
```

## Usage

1. Navigate to Stores page
2. Click delete button for desired data type
3. Confirm deletion in dialog
4. Choose WooCommerce sync if needed
5. Monitor success/error notifications

## Security

- Authentication required for all endpoints
- User context logged for audit trails
- Organization context maintained
- Multiple confirmations prevent accidents

---

**Version**: 1.0 | **Last Updated**: 2024 