# Store-Wide Delete Functionality

## Overview

This implementation adds comprehensive store-wide deletion capabilities for customers, orders, and products. Users can now delete all data for a specific store with optional WooCommerce synchronization.

## Features

### ✅ Backend API Endpoints

1. **Delete All Customers by Store**
   - `DELETE /api/customers/store/:storeId`
   - Optional WooCommerce sync
   - Comprehensive logging and error handling

2. **Delete All Orders by Store**
   - `DELETE /api/orders/store/:storeId`
   - Optional WooCommerce sync
   - Comprehensive logging and error handling

3. **Delete All Products by Store**
   - `DELETE /api/inventory/store/:storeId` (existing endpoint)
   - Enhanced with better error handling

### ✅ Frontend Integration

1. **Store Table UI Enhancement**
   - Delete buttons for each data type (Customers, Orders, Products)
   - Confirmation dialogs with clear warnings
   - WooCommerce sync options
   - Success/error notifications

2. **Redux State Management**
   - Complete Redux flow (actions, reducers, types)
   - Loading states and error handling
   - State updates after successful deletions

### ✅ Safety Features

1. **Multiple Confirmation Dialogs**
   - Primary confirmation for data deletion
   - Secondary confirmation for WooCommerce sync
   - Clear warnings about irreversible actions

2. **WooCommerce Integration**
   - Optional WooCommerce deletion (defaults to false)
   - Detailed sync results and error reporting
   - Graceful handling of WooCommerce API failures

3. **Comprehensive Logging**
   - All deletion operations are logged
   - WooCommerce sync results are tracked
   - Error details are preserved for debugging

## API Reference

### Delete All Customers by Store

```http
DELETE /api/customers/store/:storeId
```

**Request Body:**
```json
{
  "syncToWooCommerce": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully deleted 150 customers from store",
  "data": {
    "deletedCount": 150,
    "totalCustomers": 150,
    "storeId": "store_id"
  },
  "wooCommerceSync": {
    "total": 150,
    "synced": 145,
    "failed": 5,
    "errors": [
      {
        "customerId": "customer_id",
        "email": "customer@example.com",
        "wooCommerceId": 123,
        "error": "WooCommerce API error"
      }
    ]
  }
}
```

### Delete All Orders by Store

```http
DELETE /api/orders/store/:storeId
```

**Request Body:**
```json
{
  "syncToWooCommerce": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully deleted 75 orders from store",
  "data": {
    "deletedCount": 75,
    "totalOrders": 75,
    "storeId": "store_id"
  },
  "wooCommerceSync": {
    "total": 75,
    "synced": 70,
    "failed": 5,
    "errors": [
      {
        "orderId": "order_id",
        "orderKey": "wc_order_key",
        "wooCommerceId": 456,
        "error": "WooCommerce API error"
      }
    ]
  }
}
```

## Frontend Usage

### Store Table Component

The store table now includes delete buttons for each data type:

```jsx
// Delete buttons are automatically added to the store table
<DeleteButton 
  onClick={() => handleDeleteCustomers(store._id)}
  title="Delete All Customers"
>
  <Trash2 size={16} />
  <span>Customers</span>
</DeleteButton>
```

### Confirmation Flow

1. User clicks delete button
2. First confirmation: "Are you sure you want to delete ALL [data type] for this store?"
3. Second confirmation (if WooCommerce sync is available): "Do you also want to delete from WooCommerce?"
4. API call is made with user's choices
5. Success/error notification is shown

## Error Handling

### Backend Error Handling

- **Store not found**: Returns 404 with clear message
- **No data found**: Returns 404 with appropriate message
- **WooCommerce API errors**: Logged and included in response
- **Database errors**: Proper error responses with details

### Frontend Error Handling

- **Network errors**: User-friendly error messages
- **API errors**: Detailed error information in alerts
- **Loading states**: Buttons disabled during operations
- **Success feedback**: Confirmation of deletion counts

## Testing

### Test Script

A test script is provided at `server/test-delete-endpoints.js`:

```javascript
// Configure test parameters
const TEST_STORE_ID = 'your-test-store-id';
const AUTH_TOKEN = 'your-auth-token';

// Run tests
const { runTests } = require('./test-delete-endpoints');
runTests();
```

### Manual Testing

1. **Navigate to Stores page**
2. **Click delete button for any data type**
3. **Confirm deletion in dialog**
4. **Verify data is removed from database**
5. **Check WooCommerce if sync was enabled**

## Security Considerations

### Authentication
- All endpoints require valid authentication
- User context is logged for audit trails

### Authorization
- Users can only delete data for stores they have access to
- Organization context is maintained

### Data Protection
- Multiple confirmation dialogs prevent accidental deletions
- WooCommerce sync defaults to false for safety
- Comprehensive logging for audit purposes

## Performance Considerations

### Database Operations
- Uses `deleteMany()` for efficient bulk deletion
- Proper indexing on `storeId` fields

### WooCommerce Sync
- Sequential processing to avoid rate limiting
- Error handling prevents partial failures from stopping the process
- Detailed error reporting for failed operations

## Monitoring and Logging

### Audit Logs
All deletion operations are logged with:
- User ID
- Store ID
- Deletion counts
- WooCommerce sync results
- Timestamps

### Error Monitoring
- WooCommerce API errors are logged
- Database errors are captured
- Network errors are tracked

## Future Enhancements

### Potential Improvements
1. **Batch Processing**: Process deletions in smaller batches
2. **Progress Indicators**: Real-time progress updates
3. **Undo Functionality**: Temporary deletion with recovery option
4. **Scheduled Deletions**: Defer deletions to off-peak hours
5. **Advanced Filters**: Delete based on date ranges or other criteria

### API Extensions
1. **Partial Deletions**: Delete based on filters
2. **Soft Deletes**: Mark as deleted instead of removing
3. **Bulk Operations**: Delete across multiple stores
4. **Export Before Delete**: Backup data before deletion

## Troubleshooting

### Common Issues

1. **WooCommerce API Errors**
   - Check store credentials
   - Verify WooCommerce API permissions
   - Check rate limiting

2. **Database Errors**
   - Verify store ID exists
   - Check database connectivity
   - Review error logs

3. **Frontend Issues**
   - Check authentication token
   - Verify Redux state
   - Review browser console errors

### Debug Information

Enable debug logging by setting environment variables:
```bash
DEBUG=mbztech:delete
NODE_ENV=development
```

## Support

For issues or questions:
1. Check the error logs
2. Review the API documentation
3. Test with the provided test script
4. Contact the development team

---

**Version**: 1.0  
**Last Updated**: 2024  
**Compatibility**: Node.js 14+, MongoDB 4.4+ 