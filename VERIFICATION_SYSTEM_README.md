# Seller Verification System Implementation

## Overview
Implemented a two-tier seller verification system that separates store creation from verification. Sellers can now create stores quickly with basic information, and complete verification separately with detailed documentation.

## Key Changes Made

### 1. **Prisma Schema Updates**
- Added `verificationStatus` field (unverified | pending | verified | rejected)
- Added `verificationRejectedReason` field for rejection feedback
- Created migration: `20260517_add_store_verification`

**File Modified:** `prisma/schema.prisma`

### 2. **Simplified Store Creation**
- Removed verification and CAC fields from the creation form
- Store creation now only requires: name, username, description, email, contact, address, logo
- New stores default to `verificationStatus: "unverified"`

**File Modified:** `app/api/store/create/route.js`

### 3. **Seller Dashboard Updates**

#### Added "Verify Store" Navigation
- Added `ShieldCheckIcon` import and "Verify Store" menu item
- Navigation item points to `/store/verify`

**File Modified:** `components/store/StoreLayout.jsx`

#### Created Verify Store Page
- New page at `app/store/verify/page.jsx`
- Shows current verification status with visual indicators
- Form to submit CAC number, document type, document number
- File upload for ID/Passport copy
- File upload for facial verification (selfie)
- Displays status: Unverified | Pending | Verified | Rejected
- Prevents re-submission while pending

**File Created:** `app/store/verify/page.jsx`

### 4. **Store Info API**
- New endpoint at `app/api/store/info/route.js`
- Returns comprehensive store information including verification status
- Used by the verify page to fetch current store data

**File Created:** `app/api/store/info/route.js`

### 5. **Verification Submission API**
- New endpoint at `app/api/store/verify/route.js`
- Handles document uploads to ImageKit
- Updates store with verification details
- Sets status to "pending" awaiting admin review

**File Created:** `app/api/store/verify/route.js`

### 6. **Store Info Page Updates**
- Added verification badge to store public page
- Shows "VERIFIED" with green checkmark for verified stores
- Shows "UNVERIFIED" badge with warning for unverified stores
- Users can see verification status when viewing stores

**File Modified:** `app/(public)/shop/[username]/page.jsx`

### 7. **Admin Dashboard Enhancements**

#### Added Store Verification Management Section
- New navigation item in admin dashboard: "Store Verification"
- Points to `/admin/verify-stores`

**File Modified:** `components/admin/AdminLayout.jsx`

#### Created Admin Verification Page
- Lists all pending, verified, and rejected store verification requests
- Shows store details: CAC number, document type, document number
- Preview functionality for verification documents and selfies
- Admin actions:
  - **Approve**: Set store to verified status
  - **Reject**: Set status to rejected with reason
- Filters: All | Pending | Verified | Rejected
- Status counts for each filter

**File Created:** `app/admin/verify-stores/page.jsx`

### 8. **Admin Verification APIs**

#### Get Verification Requests
- Endpoint: `GET /api/admin/verify-stores`
- Returns all stores with verification details and status counts

**File Created:** `app/api/admin/verify-stores/route.js`

#### Approve Store Verification
- Endpoint: `POST /api/admin/approve-store-verification`
- Sets store to `verificationStatus: "verified"`
- Clears any rejection reasons

**File Created:** `app/api/admin/approve-store-verification/route.js`

#### Reject Store Verification
- Endpoint: `POST /api/admin/reject-store-verification`
- Sets store to `verificationStatus: "rejected"`
- Records rejection reason for seller feedback

**File Created:** `app/api/admin/reject-store-verification/route.js`

## Workflow

### For Sellers:
1. **Create Store** (`/store/add-product`): Submit basic info only
   - Store name, username, description
   - Email, contact, address
   - Store logo
   - Status: PENDING (for store listing approval)
   - Verification Status: UNVERIFIED

2. **Navigate to Verify Store**: Go to `/store/verify`
   - View current verification status
   - If UNVERIFIED or REJECTED, submit verification documents:
     - CAC Registration Number
     - Document Type (NIN or Passport)
     - Document Number
     - Upload ID/Passport copy
     - Upload facial verification (selfie)
   - Status changes to PENDING while awaiting admin review

3. **Wait for Admin Review**: Check status periodically
   - PENDING: Documents under review
   - VERIFIED: Store can now have a verified badge
   - REJECTED: View rejection reason and resubmit

### For Admins:
1. **Review Verifications** (`/admin/verify-stores`):
   - See all pending verification requests
   - View store information and uploaded documents
   - Click "View Document" or "View Selfie" to preview

2. **Approve or Reject**:
   - **Approve**: Confirm documents are valid → Status: VERIFIED
   - **Reject**: Provide reason for rejection → Status: REJECTED + Reason

## Database Schema Changes

```sql
ALTER TABLE "Store" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE "Store" ADD COLUMN "verificationRejectedReason" TEXT;
CREATE INDEX "Store_verificationStatus_idx" ON "Store"("verificationStatus");
```

## Environment Setup

Ensure the following in your `.env.local` or `.env`:
```
DATABASE_URL=your_database_connection_string
DIRECT_URL=your_direct_database_connection_string (for migrations)
```

## Status Flow Diagram

```
[Store Created]
      ↓
[UNVERIFIED] → [Seller submits docs] → [PENDING (awaiting admin)]
      ↓                                     ↓
      └─────────────────────────────→ [REJECTED + reason] → [Seller resubmits]
                                         ↓
                                   [VERIFIED ✓]
```

## Files Modified
- `prisma/schema.prisma`
- `app/api/store/create/route.js`
- `components/store/StoreLayout.jsx`
- `app/(public)/shop/[username]/page.jsx`
- `components/admin/AdminLayout.jsx`
- `prisma.config.ts` (datasource configuration)

## Files Created
- `app/store/verify/page.jsx`
- `app/api/store/info/route.js`
- `app/api/store/verify/route.js`
- `app/admin/verify-stores/page.jsx`
- `app/api/admin/verify-stores/route.js`
- `app/api/admin/approve-store-verification/route.js`
- `app/api/admin/reject-store-verification/route.js`
- `prisma/migrations/20260517_add_store_verification/migration.sql`

## Testing Checklist

- [ ] Seller can create store with simplified form
- [ ] New stores appear as UNVERIFIED
- [ ] "Verify Store" page loads correctly
- [ ] Documents can be uploaded and previewed
- [ ] Verification submission updates store status to PENDING
- [ ] Admin can view pending verifications
- [ ] Admin can approve/reject with visual feedback
- [ ] Store badge updates when verified
- [ ] Rejected sellers see rejection reason
- [ ] All API endpoints return correct data

## Notes
- All uploaded verification documents are stored in ImageKit folders:
  - `/verification/documents/` for ID/Passport copies
  - `/verification/selfies/` for facial verification images
- Database connection via Prisma pooler for runtime, direct connection for migrations
- All verification forms include sanitization and validation
