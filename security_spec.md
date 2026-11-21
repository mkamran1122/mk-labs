# MK Labs Digital Store — Security Specification

## 1. Data Invariants

1. **Single-Seller Store**: Only authorized MK Labs admins (`isAdmin()`) may create, update, or delete `categories`, `subcategories`, `products`, `privateFiles`, `coupons`, and `settings`.
2. **Public Visibility Gates**:
   - `categories`: Public visitors may read (`get` / `list`) **only** documents where `active == true`.
   - `subcategories`: Public visitors may read **only** documents where `active == true` and referencing an existing parent `categories/{categoryId}`.
   - `products`: Public visitors may read **only** documents where `status == 'published'`. Drafts and archived listings are strictly admin-only.
   - `settings/payment_instructions`: Publicly readable (`get` only) so customers receive Bank Transfer, Easypaisa, and JazzCash payment instructions after placing an order; writable strictly by `isAdmin()`.
3. **Zero Firebase Storage Dependency (Email PDF Delivery)**:
   - Product documents store metadata only (no PDF upload to Firebase Storage required). Deliverable PDFs remain offline on the MK Labs administrator's computer and are emailed manually after payment verification.
4. **Pricing & Category Integrity**:
   - `currency` is restricted to `'PKR'` or `'USD'`.
   - When `salePrice` is provided, it must satisfy `0 <= salePrice < regularPrice`.
   - Every `products/{productId}` must reference an existing `categories/{categoryId}` and `subcategories/{subcategoryId}` whose `categoryId` matches `products.categoryId`.
5. **PII & Customer Isolation**:
   - `customers/{customerId}` documents are readable and writable only by the authenticated owner (`request.auth.uid == customerId`) or `isAdmin()`. No blanket `isSignedIn()` reads or customer `list` scraping.
   - Customers cannot self-escalate `role` (must stay `'customer'`) or `accountStatus` (must stay `'active'` on registration).
6. **Manual Order Integrity & Anti-Forgery**:
   - `orders/{orderId}` can only be read (`get`) or queried (`list`) by the owning signed-in customer (`resource.data.customerId == request.auth.uid`) or an authorized admin. Customers can NEVER read other customers' orders, and unauthenticated guests cannot read any order from Firestore.
   - Order creation strictly validates customer name, email format, phone number, quantity (`1..99`), published product existence, exact unit price, currency, paymentMethod (`bank_transfer`, `easypaisa`, `jazzcash`, `payoneer`), and `totalAmount == unitPrice * quantity`.
   - New orders MUST start with `paymentStatus: 'Pending'`, `deliveryStatus: 'Pending'`, and `status: 'pending'`, and cannot include `paymentRequestLink`, `paymentLinkSentAt`, `verifiedAt`, or `deliveredAt`. Clients cannot create `Paid`, `Verified`, `Delivered`, or `paid` orders.
   - Customers/creators can only transition `paymentStatus` from `'Pending'` or `'Payment Link Sent'` to `'Submitted'` (with optional payment reference); only `isAdmin()` can add `paymentRequestLink` (`https://...`), set `Payment Link Sent`, `Paid`, `Verified`, `Rejected`, or `Delivered`.
   - No Payoneer bank receiving account details or credentials are stored in `settings/payment_instructions` or frontend code.
7. **Strict Timestamp & Path Hardening**:
   - All document IDs validated against `^[a-zA-Z0-9_\-]+$` (`<= 128` chars) on single-doc operations.
   - `createdAt == request.time` on creation and immutable on updates; `createdBy == request.auth.uid` on product and blog creation and immutable on updates.
8. **Blog Publishing & Draft Isolation**:
   - `blogs/{blogId}`: Public visitors may read (`get` / `list`) **only** documents where `status == 'published'`.
   - Draft blog posts (`status == 'draft'`) are readable and listable strictly by authorized administrators.
   - Only `isAdmin()` with verified email may create, edit, publish, unpublish, or delete blog posts. Ordinary customers and unauthenticated guests cannot write to `/blogs`.
   - `publishedAt` is strictly validated against `request.time` when publishing and cannot be forged by non-admin clients.
9. **Split Sales Aggregates & Minimal Public Ranking Projection**:
   - `productSales/{productId}` stores exact verified paid sales metrics (`unitsSold`, `paidOrdersCount`, `lastPaidAt`, `updatedAt`) and is **strictly admin-only** (`isAdmin()` / `isBootstrappedAdminToken()`) for BOTH reads (`get`, `list`) and writes. Public visitors and ordinary customers can NEVER read `unitsSold` or `paidOrdersCount`.
   - `showcaseRanks/{productId}` exposes **only** `{ id, productId, rank, bestSeller, updatedAt }` where `bestSeller == true` — zero `unitsSold`, `paidOrdersCount`, revenue, order IDs, or customer PII.
   - Only `isAdmin()` with verified email may create, update, or delete `productSales` or `showcaseRanks`.

## 2. Adversarial Security Test Cases (Expected Result: `PERMISSION_DENIED`)

1. **Unauthenticated Category Creation**: Anonymous client attempts `setDoc('/categories/fake-cat', { ... })`.
2. **Non-Admin Category Deletion**: Authenticated regular customer attempts `deleteDoc('/categories/educational-knowledge-products')`.
3. **Spoofed Admin Email (Unverified)**: Authenticated user with `email: 'muhammadkamran4122@gmail.com'` and `email_verified: false` attempts category or product write.
4. **Ghost Field / Shadow Update on Product**: Write includes unexpected field (e.g. `downloadUrl`, `isVerified`) rejected by `hasOnly(...)`.
5. **Unpublished Product Enumeration**: Public visitor queries `/products` without `.where('status', '==', 'published')`.
6. **Inactive Category Enumeration**: Public visitor queries `/categories` without `.where('active', '==', true)`.
7. **Orphan Subcategory / Cross-Category Product Mismatch**: Write to `/subcategories/orphan-1` or `/products/prod-1` where `subcategory.categoryId != product.categoryId`.
8. **Cross-Customer Order Read / List Scraping**: Signed-in customer `uid-A` attempts `getDoc('/orders/order-of-B')` or `getDocs('/orders')` without `where('customerId', '==', 'uid-A')`.
9. **Customer PII Cross-Read**: Signed-in user `uid-A` attempts `getDoc('/customers/uid-B')` or `getDocs('/customers')`.
10. **Self-Assigned Admin Escalation**: User `uid-A` attempts `setDoc('/customers/uid-A', { role: 'admin', ... })` or writes `/admins/uid-A`.
11. **Paid / Verified / Zero-Price / Payoneer Link Forgery**: Customer attempts to create `/orders/order-1` with `paymentStatus: 'Paid'` / `'Verified'`, `status: 'paid'`, or `totalAmount: 0`, OR attempts to update their own order to `paymentStatus: 'Paid'`, `'Payment Link Sent'`, or inject `paymentRequestLink`.
12. **Sale Price Abuse / Invalid Order Input**: `salePrice >= regularPrice`, invalid email format, quantity `<= 0`, or ordering an unpublished draft product.
13. **Unpublished Draft Blog Read / Query Without Status Filter**: Public visitor or ordinary customer attempts `getDoc('/blogs/draft-1')` or `getDocs('/blogs')` without `where('status', '==', 'published')`.
14. **Ordinary Customer Blog Mutation**: Signed-in customer attempts `setDoc('/blogs/cust-post', ...)` or `updateDoc` / `deleteDoc` on `/blogs/{blogId}`.
15. **Non-Admin Product Sales & Rank Forgery**: Signed-in customer or anonymous user attempts `setDoc('/productSales/prod-1', { unitsSold: 9999, ... })` or `setDoc('/showcaseRanks/prod-1', { rank: 1, bestSeller: true, ... })` to artificially promote a product.
16. **Public / Customer Exact Sales Aggregate Read**: Unauthenticated visitor or signed-in customer attempts `getDoc('/productSales/prod-1')` or `getDocs('/productSales')` to inspect `unitsSold` or `paidOrdersCount`.

