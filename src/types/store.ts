export type ProductStatus = 'draft' | 'published' | 'archived';

export type StoreCurrency = 'PKR' | 'USD';

export type ProductType =
  | 'Template'
  | 'PDF'
  | 'eBook'
  | 'Excel / Spreadsheet'
  | 'Word Document'
  | 'Canva Template'
  | 'Notion Template'
  | 'Business Bundle'
  | 'Social Media Kit'
  | 'CV / Resume Template'
  | 'Educational Resource'
  | 'UI Kit'
  | 'Software / Script'
  | 'Other';

export type AccessType =
  | 'public_free'
  | 'account_free'
  | 'admin_granted'
  | 'paid_catalogue'
  | 'external_resource'
  | 'coming_soon';

export type FileType =
  | 'zip_bundle'
  | 'individual_file'
  | 'bonus_file'
  | 'instruction_file';

export type DeliveryKind = 'downloadable' | 'online_tool';

// =============================================================================
// Phase 1 & Phase 2 Firestore Data Models
// =============================================================================

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StoreSubcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type ManualPaymentMethod =
  | 'bank_transfer'
  | 'easypaisa'
  | 'jazzcash'
  | 'payoneer';

export type PaymentStatus =
  | 'Pending'
  | 'Payment Link Sent'
  | 'Submitted'
  | 'Paid'
  | 'Verified'
  | 'Rejected';

export type DeliveryStatus = 'Pending' | 'Delivered';

export interface BankTransferInstructions {
  enabled: boolean;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  branchCode?: string;
  instructions?: string;
}

export interface MobileWalletInstructions {
  enabled: boolean;
  accountTitle: string;
  accountNumber: string;
  instructions?: string;
}

export interface PaymentInstructionsConfig {
  id: string;
  bankTransfer: BankTransferInstructions;
  easypaisa: MobileWalletInstructions;
  jazzcash: MobileWalletInstructions;
  generalInstructions?: string;
  supportEmail?: string;
  updatedAt: string;
}

export interface StoreProductRecord {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  categoryId: string;
  subcategoryId: string;
  coverImagePath?: string;
  coverImageUrl?: string;
  pdfStoragePath?: string;
  originalFileName?: string;
  fileSize?: number;
  mimeType?: 'application/pdf';
  currency: StoreCurrency;
  regularPrice: number;
  salePrice?: number;
  features?: string[];
  license?: string;
  version?: string;
  tags?: string[];
  featured: boolean;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface StoreOrderRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  productId: string;
  productIds: string[];
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: StoreCurrency;
  paymentMethod: ManualPaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paymentRequestLink?: string;
  paymentLinkSentAt?: string;
  deliveryStatus: DeliveryStatus;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  adminNotes?: string;
  verifiedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreCouponRecord {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Shared Pricing & File Formatting Helpers
// =============================================================================

export function getEffectiveProductPrice(product: {
  regularPrice: number;
  salePrice?: number;
}): number {
  return typeof product.salePrice === 'number' &&
    product.salePrice >= 0 &&
    product.salePrice < product.regularPrice
    ? product.salePrice
    : product.regularPrice;
}

export function formatProductPrice(
  amount: number,
  currency: StoreCurrency | string = 'USD'
): string {
  if (!Number.isFinite(amount) || amount < 0) return '—';
  if (amount === 0) return 'Free';
  const cur = currency.toUpperCase() === 'PKR' ? 'PKR' : 'USD';
  if (cur === 'PKR') {
    const formatted = Number.isInteger(amount)
      ? amount.toLocaleString('en-US')
      : amount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
    return `PKR ${formatted}`;
  }
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// =============================================================================
// Shared Store & Admin UI Models
// =============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageType: 'cover' | 'gallery' | 'preview';
  storageKey?: string;
  publicUrl: string;
  altText?: string;
  displayOrder: number;
  createdAt: string;
}

export interface ProductFileGroup {
  id: string;
  productId: string;
  name: string;
  description?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFile {
  id: string;
  productId: string;
  groupId?: string;
  displayName: string;
  originalFileName: string;
  objectKey: string;
  fileExtension: string;
  mimeType: string;
  fileSize: number; // bytes
  fileType: FileType;
  isRequired: boolean;
  isBonus: boolean;
  displayOrder: number;
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
  downloadUrl?: string; // only available when authorized
  createdAt: string;
  updatedAt: string;
}

export interface ProductExternalLink {
  id: string;
  productId: string;
  displayName: string;
  url: string;
  instructions?: string;
  displayOrder: number;
  createdAt: string;
}

export interface DigitalProduct {
  id: string;
  title: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryIds: string[];
  subcategoryId?: string;
  subcategoryName?: string;
  categories?: Category[];
  tags: string[];
  productType: ProductType;
  deliveryKind?: DeliveryKind;
  status: ProductStatus;
  accessType: AccessType;
  displayPrice: number;
  salePrice?: number;
  currency: StoreCurrency;
  version?: string;
  licenseInformation?: string;
  usageInstructions?: string;
  whatsIncluded?: string;
  requirements?: string;
  features?: string[];
  coverImagePath?: string;
  coverImageUrl?: string;
  pdfStoragePath?: string;
  originalFileName?: string;
  fileSize?: number;
  mimeType?: 'application/pdf';
  toolUrl?: string;
  toolAccessInstructions?: string;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;

  // Populated relations
  coverImage?: ProductImage;
  images?: ProductImage[];
  files?: ProductFile[];
  fileGroups?: ProductFileGroup[];
  externalLinks?: ProductExternalLink[];
  downloadCount?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'customer';
  accountStatus: 'active' | 'suspended';
  status?: 'active' | 'suspended';
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DownloadEvent {
  id: string;
  productId: string;
  productTitle?: string;
  productFileId: string;
  fileName?: string;
  fileSize?: number;
  userId?: string;
  userEmail?: string;
  eventStatus: 'initiated' | 'authorized' | 'completed' | 'failed';
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  createdAt: string;
}

export interface AdminActivityLog {
  id: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  createdAt: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  storeDescription: string;
  storeContactEmail: string;
  defaultCurrency: string;
  defaultAccessType: AccessType;
  maxUploadSizeBytes: number;
  allowedFileFormats: string[];
  defaultDownloadLimit: number;
  signedUrlExpirySeconds: number;
  isStoreVisible: boolean;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
}

export interface StoreDashboardStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  archivedProducts: number;
  totalCategories: number;
  totalCustomers: number;
  totalDownloads: number;
  recentDownloads: DownloadEvent[];
  recentActivity: AdminActivityLog[];
  recentProducts: DigitalProduct[];
}
