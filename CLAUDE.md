# Claude Project Guidelines for MBZ Backend

## Critical Security: Multi-Tenant Data Isolation

This is a **multi-tenant SaaS application** where multiple organizations share the same database. **Data isolation is critical** - users must NEVER be able to access data from other organizations.

### MANDATORY Security Pattern for All Controller Functions

When writing or reviewing any controller function that reads, updates, or deletes data:

1. **ALWAYS get the organization from the authenticated user**, not from query params, body, or URL params:
   ```javascript
   const userOrgId = req.user?.organizationId || req.user?.organization;
   if (!userOrgId) {
     return res.status(400).json({
       success: false,
       message: 'User organization not found'
     });
   }
   ```

2. **ALWAYS filter database queries by the user's organization**:
   ```javascript
   // CORRECT - filter by authenticated user's org
   const data = await Model.find({ organizationId: userOrgId });

   // WRONG - returns all data from all organizations!
   const data = await Model.find({});

   // WRONG - trusts org ID from request (can be manipulated)
   const data = await Model.find({ organizationId: req.query.organizationId });
   ```

3. **If org ID is passed in params/query, VERIFY it matches the user's org**:
   ```javascript
   const { organizationId } = req.params;
   if (organizationId !== userOrgId.toString()) {
     return res.status(403).json({
       success: false,
       message: 'You do not have permission to access this organization'
     });
   }
   ```

4. **For store-based queries, verify the store belongs to the user's org**:
   ```javascript
   const store = await Store.findById(storeId);
   if (!store || store.organizationId?.toString() !== userOrgId.toString()) {
     return res.status(403).json({
       success: false,
       message: 'You do not have permission to access this store'
     });
   }
   ```

### Red Flags to Watch For

When reviewing code, these patterns indicate potential data leakage:

- `Model.find({})` without organization filter
- `Model.findById(id)` without verifying org ownership
- `Model.findByIdAndUpdate(id, ...)` without verifying org ownership
- `Model.findByIdAndDelete(id)` without verifying org ownership
- Using `req.query.organizationId` or `req.params.organizationId` without verification
- Any "getAll" function that doesn't filter by organization

### Example of Secure vs Insecure Code

```javascript
// INSECURE - returns all customers from all organizations!
exports.getAllCustomers = async (req, res) => {
  const customers = await Customer.find({});
  res.json({ customers });
};

// SECURE - only returns customers from user's organization
exports.getAllCustomers = async (req, res) => {
  const userOrgId = req.user?.organizationId || req.user?.organization;
  if (!userOrgId) {
    return res.status(400).json({ success: false, message: 'User organization not found' });
  }

  const customers = await Customer.find({ organizationId: userOrgId });
  res.json({ success: true, customers });
};
```

## Other Guidelines

- All API routes that access organization data must use the `protect` middleware
- Never trust client-provided IDs without verification
- Log security-relevant actions to audit trail
