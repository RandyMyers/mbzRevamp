# Websites Feature - Frontend vs Backend Comparison

## Executive Summary

The websites feature has **significant gaps** between what the frontend expects and what the backend provides. The frontend is more comprehensive, but several critical endpoints are missing or incomplete on the backend.

---

## Feature Comparison Matrix

| Feature | Frontend | Backend | Status | Notes |
|---------|----------|---------|--------|-------|
| **Domain Check** | ✅ Implemented | ✅ Implemented | ✅ **MATCH** | `GET /api/websites/check-domain` |
| **Create Website** | ✅ Full wizard | ✅ Partial | ⚠️ **PARTIAL** | Backend has basic creation, missing template selection integration |
| **List Websites** | ✅ Card view + Table | ✅ Organization query | ✅ **MATCH** | `GET /api/websites/organization/:orgId` |
| **Website Stats** | ✅ 4 metrics | ❌ Missing | ❌ **MISSING** | Frontend shows Total/Live/Dev/SSL - no backend endpoint |
| **Edit Website** | ✅ Edit button | ✅ Multiple PATCH endpoints | ✅ **MATCH** | Step-by-step update endpoints exist |
| **Delete Website** | ✅ Delete button | ✅ Implemented | ✅ **MATCH** | `DELETE /api/websites/delete/:id` |
| **Visit Website** | ✅ External link | ❌ Not applicable | N/A | Frontend feature only |
| **Template Selection** | ✅ 3 templates | ⚠️ Template model exists | ⚠️ **PARTIAL** | Templates exist but no GET endpoint to list them |
| **Color Customization** | ✅ 3 colors | ✅ Implemented | ✅ **MATCH** | `PATCH /api/websites/colors/:id` |
| **Business Info** | ✅ Comprehensive form | ✅ Implemented | ✅ **MATCH** | `PATCH /api/websites/business-info/:id` |
| **Email Setup** | ✅ Custom emails | ✅ Implemented | ✅ **MATCH** | `PATCH /api/websites/emails/:id` |
| **Logo Upload** | ✅ Upload + Design request | ✅ Cloudinary integration | ✅ **MATCH** | Works with logo upload |
| **SEO Configuration** | ✅ Title + Description | ⚠️ Partial | ⚠️ **PARTIAL** | Schema has `seo` object but no dedicated update endpoint |
| **Social Media** | ✅ Integration button | ⚠️ Partial | ⚠️ **PARTIAL** | Schema has `socialMedia` but no update endpoint |
| **Payment Gateways** | ✅ Configuration UI | ⚠️ Schema only | ⚠️ **PARTIAL** | Schema has field but no update endpoint |
| **Shipping & Tax** | ✅ Configuration UI | ⚠️ Schema only | ⚠️ **PARTIAL** | Schema has fields but no update endpoints |
| **Super Admin View** | ✅ All websites + Templates | ✅ All websites | ⚠️ **PARTIAL** | `/all/:userId` exists but no template management API |
| **Website Analytics** | ❌ Not shown in UI | ✅ Implemented | ⚠️ **EXTRA** | Backend has analytics but frontend doesn't display |
| **Progress Tracking** | ❌ Not shown in UI | ✅ Comprehensive | ⚠️ **EXTRA** | Backend has full progress system, frontend missing |

---

## Critical Missing Backend Endpoints

### 1. **Website Statistics for Dashboard** ❌ CRITICAL
**Frontend Expects:**
```typescript
GET /api/websites/stats/:userId or /api/websites/stats/organization/:orgId
Response: {
  totalWebsites: number,
  liveWebsites: number,
  developmentWebsites: number,
  securedWebsites: number
}
```

**Current Status:** NOT IMPLEMENTED
**Impact:** HIGH - Stats cards on frontend show hardcoded/dummy data

---

### 2. **List All Templates** ❌ CRITICAL
**Frontend Expects:**
```typescript
GET /api/website/templates or GET /api/websites/templates
Response: [{
  id: string,
  name: string,
  description: string,
  preview: string,
  type: string
}]
```

**Current Status:** NOT IMPLEMENTED
**Impact:** HIGH - Users cannot see available templates during website creation

---

### 3. **SEO Settings Update** ⚠️ MISSING
**Frontend Expects:**
```typescript
PATCH /api/websites/seo/:id
Body: {
  seoTitle: string,
  seoDescription: string
}
```

**Current Status:** Schema has `seo` object but no dedicated endpoint
**Impact:** MEDIUM - SEO data can't be saved

---

### 4. **Social Media Integration Update** ⚠️ MISSING
**Frontend Expects:**
```typescript
PATCH /api/websites/social-media/:id
Body: {
  facebook?: string,
  instagram?: string,
  twitter?: string,
  linkedin?: string
}
```

**Current Status:** Schema has `socialMedia` but no endpoint
**Impact:** MEDIUM - Social links can't be configured

---

### 5. **Payment Gateway Configuration** ⚠️ MISSING
**Frontend Expects:**
```typescript
PATCH /api/websites/payment-gateways/:id
Body: {
  paymentGateways: [{
    name: string,
    isEnabled: boolean,
    credentials: object
  }]
}
```

**Current Status:** Schema exists but no endpoint
**Impact:** MEDIUM - Payment setup incomplete

---

### 6. **Shipping Configuration** ⚠️ MISSING
**Frontend Expects:**
```typescript
PATCH /api/websites/shipping/:id
Body: {
  shippingOptions: [{
    name: string,
    description: string,
    price: number,
    deliveryTime: string,
    isEnabled: boolean
  }]
}
```

**Current Status:** Schema exists but no endpoint
**Impact:** MEDIUM - Shipping setup incomplete

---

### 7. **Tax Settings Update** ⚠️ MISSING
**Frontend Expects:**
```typescript
PATCH /api/websites/tax/:id
Body: {
  taxSettings: {
    rate: number,
    isIncludedInPrice: boolean,
    taxId: string
  }
}
```

**Current Status:** Schema exists but no endpoint
**Impact:** MEDIUM - Tax configuration incomplete

---

### 8. **Super Admin Template Management** ⚠️ MISSING
**Frontend Expects:**
```typescript
GET /api/website/templates/admin/all
POST /api/website/templates/admin/create
PATCH /api/website/templates/admin/:id
DELETE /api/website/templates/admin/:id
```

**Current Status:** Template model exists, route registered, but controllers likely incomplete
**Impact:** HIGH - Super admin can't manage templates

---

## Backend Features Not Used by Frontend

### 1. **Website Analytics** ✅ IMPLEMENTED BUT UNUSED
**Endpoints:**
- `GET /api/websites/analytics/:userId` (Super admin)
- `GET /api/websites/analytics/organization/:organizationId`

**Returns:** Total websites, breakdown by status, websites over time (30 days)

**Frontend Status:** Not displayed anywhere in UI
**Recommendation:** Add analytics dashboard to super admin or organization admin view

---

### 2. **Website Progress Tracking** ✅ IMPLEMENTED BUT UNUSED
**Full Progress System:**
- Step completion tracking
- Designer assignments
- Notes and comments
- Asset uploads
- Milestones
- Approvals workflow
- Version history
- Client feedback
- QA checks

**10 Progress Endpoints:** All implemented and working

**Frontend Status:** No UI for progress tracking
**Recommendation:** Build comprehensive project management UI for website development tracking

---

## Schema Mismatches

### 1. **Domain Format**
- **Frontend:** Expects `.elapix.store` suffix
- **Backend:** Uses `.storepilot.com` suffix (virtual property `fullDomain`)
- **Impact:** Domain display mismatch
- **Fix Needed:** Update backend virtual property or frontend display

### 2. **Business Type Values**
- **Frontend:** 10 types including "Fashion & Apparel", "Electronics & Gadgets", etc.
- **Backend:** Same enum values ✅
- **Status:** MATCH

### 3. **Website Status**
- **Frontend:** "live" | "development" | "inactive"
- **Backend:** "draft" | "development" | "live" | "inactive"
- **Impact:** Frontend doesn't handle "draft" status
- **Fix Needed:** Update frontend to include draft state

### 4. **Template Types**
- **Frontend:** "Modern Boutique", "Tech Store", "Food Market"
- **Backend:** Generic template reference (ObjectId)
- **Impact:** Need to verify template names match in database
- **Fix Needed:** Seed templates with correct names

---

## API Service Issues in Frontend

**File:** `/Users/maleo/Documents/Work/elapix-customer-dashboard/src/lib/api.ts`

Currently only implements:
```typescript
async checkDomainAvailability(domain: string)
```

### Missing API Methods:
1. `getWebsiteStats(organizationId: string)` ❌
2. `getTemplates()` ❌
3. `createWebsite(data: WebsiteFormValues)` ❌
4. `updateWebsiteSEO(id: string, data)` ❌
5. `updateWebsiteSocialMedia(id: string, data)` ❌
6. `updateWebsitePaymentGateways(id: string, data)` ❌
7. `updateWebsiteShipping(id: string, data)` ❌
8. `updateWebsiteTax(id: string, data)` ❌
9. `getOrganizationWebsites(organizationId: string)` ❌
10. `deleteWebsite(id: string)` ❌

**All methods need to be implemented in the apiService class.**

---

## Recommendations

### Priority 1: Critical Missing Endpoints (Must Implement)

1. ✅ **Website Stats Endpoint**
   ```javascript
   GET /api/websites/stats/organization/:organizationId?userId=:userId
   ```

2. ✅ **List Templates Endpoint**
   ```javascript
   GET /api/website/templates
   GET /api/website/templates/admin/all (super admin)
   ```

3. ✅ **Complete Website Creation Flow**
   - Integrate template selection into creation
   - Validate all required fields

### Priority 2: Configuration Endpoints (Should Implement)

4. ✅ **SEO Update Endpoint**
   ```javascript
   PATCH /api/websites/seo/:id
   ```

5. ✅ **Social Media Update Endpoint**
   ```javascript
   PATCH /api/websites/social-media/:id
   ```

6. ✅ **Payment Gateway Configuration**
   ```javascript
   PATCH /api/websites/payment-gateways/:id
   ```

7. ✅ **Shipping Configuration**
   ```javascript
   PATCH /api/websites/shipping/:id
   ```

8. ✅ **Tax Configuration**
   ```javascript
   PATCH /api/websites/tax/:id
   ```

### Priority 3: Super Admin Features (Nice to Have)

9. ✅ **Template Management**
   - Complete template CRUD endpoints
   - Template usage statistics

10. ✅ **Progress Tracking UI**
    - Build frontend for existing progress system
    - Project management dashboard

### Priority 4: Fixes & Improvements

11. ✅ **Fix Domain Suffix Mismatch**
    - Update backend to use `.elapix.store`

12. ✅ **Fix Status Enum**
    - Add "draft" status handling to frontend

13. ✅ **Implement Frontend API Service Methods**
    - Add all missing methods to `api.ts`

14. ✅ **Display Analytics**
    - Use existing analytics endpoints in UI

---

## Data Flow Issues

### Website Creation Flow

**Frontend Process:**
1. Step 1: Basic Info → calls `checkDomainAvailability`
2. Step 2: Template Selection → **NO API CALL** (hardcoded templates)
3. Step 3: Color Customization → **NO API CALL** (local state only)
4. Step 4: Business Info → **NO API CALL** (local state only)
5. Step 5: Email Setup → **NO API CALL** (local state only)
6. Step 6: Review → **SHOULD CALL** `createWebsite` but not implemented

**Backend Supports:**
- `POST /api/websites/create` - Create with all fields
- Or step-by-step PATCH endpoints after creation

**Issue:** Frontend collects all data but never submits it!

**Fix Needed:** Implement `createWebsite` API call in frontend after review step

---

## Summary of Required Work

### Backend Tasks:
1. ✅ Create website stats endpoint
2. ✅ Create list templates endpoint
3. ✅ Create SEO update endpoint
4. ✅ Create social media update endpoint
5. ✅ Create payment gateway update endpoint
6. ✅ Create shipping update endpoint
7. ✅ Create tax update endpoint
8. ✅ Complete template management endpoints
9. ✅ Fix domain suffix from `.storepilot.com` to `.elapix.store`

### Frontend Tasks:
1. ✅ Implement all missing API service methods
2. ✅ Wire up website creation submission
3. ✅ Connect stats cards to real API
4. ✅ Connect template selection to API
5. ✅ Handle "draft" status
6. ✅ Build progress tracking UI (optional)
7. ✅ Build analytics dashboard (optional)

### Database Tasks:
1. ✅ Seed templates with correct names
2. ✅ Verify indexes on domain field
3. ✅ Check organization-website relationships

---

## Conclusion

The websites feature has a **solid foundation** with good separation between frontend and backend, but there are **critical gaps** preventing it from working end-to-end:

- ✅ **What Works:** Domain checking, basic CRUD structure, authentication
- ❌ **What's Broken:** Website creation submission, stats display, template selection
- ⚠️ **What's Partial:** Store configuration (payment/shipping/tax), SEO, social media
- 💡 **What's Extra:** Progress tracking system (backend only), analytics (backend only)

**Estimated Work:**
- Backend: ~8-12 hours (9 new endpoints + testing)
- Frontend: ~6-8 hours (API integration + bug fixes)
- Testing: ~4-6 hours (end-to-end flows)

**Total:** ~20-25 hours to make feature fully functional
