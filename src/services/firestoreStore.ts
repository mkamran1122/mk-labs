import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  StoreCategory,
  StoreSubcategory,
  StoreProductRecord,
  StoreOrderRecord,
  StoreSettings,
  StoreCurrency,
  PaymentInstructionsConfig,
  ManualPaymentMethod,
  UserProfile,
  getEffectiveProductPrice,
} from '../types/store';
import {
  resolveUniqueSlug,
  getMaxPdfSizeBytes,
  sanitizeSlug,
} from './productValidation';
import {
  generateUniqueOrderId,
  generateSubmitSecret,
  validateOrderFormInput,
  validatePayoneerRequestLink,
} from './orderValidation';
import {
  resolveCanonicalCategoryDisplay,
  resolveCanonicalSubcategoryDisplay,
} from '../config/storeCatalog';
import {
  computeProductSalesFromOrders,
  computeShowcaseRanksFromSales,
  rankShowcaseProducts,
  ProductSalesAggregate,
  ShowcaseRankSignal,
  ShowcaseSlideItem,
} from './productRanking';

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date(0).toISOString();
}

function mapCategoryDoc(id: string, data: Record<string, unknown>): StoreCategory {
  const resolved = resolveCanonicalCategoryDisplay(
    id,
    String(data.name || ''),
    String(data.description || '')
  );
  return {
    id,
    name: resolved.name,
    slug: String(data.slug || id),
    description: resolved.description,
    displayOrder: Number(data.displayOrder || 0),
    active: Boolean(data.active),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: data.updatedAt ? timestampToIso(data.updatedAt) : undefined,
  };
}

function mapSubcategoryDoc(
  id: string,
  data: Record<string, unknown>
): StoreSubcategory {
  return {
    id,
    categoryId: String(data.categoryId || ''),
    name: resolveCanonicalSubcategoryDisplay(id, String(data.name || '')),
    slug: String(data.slug || id),
    displayOrder: Number(data.displayOrder || 0),
    active: Boolean(data.active),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: data.updatedAt ? timestampToIso(data.updatedAt) : undefined,
  };
}

function mapProductDoc(
  id: string,
  data: Record<string, unknown>
): StoreProductRecord {
  const currency: StoreCurrency =
    String(data.currency || 'USD').toUpperCase() === 'PKR' ? 'PKR' : 'USD';

  const regularPrice =
    typeof data.regularPrice === 'number'
      ? data.regularPrice
      : Number(data.price || 0);

  return {
    id,
    name: String(data.name || data.title || ''),
    slug: String(data.slug || id),
    shortDescription: String(data.shortDescription || ''),
    description:
      typeof data.description === 'string' ? data.description : undefined,
    categoryId: String(data.categoryId || ''),
    subcategoryId: String(data.subcategoryId || ''),
    coverImagePath:
      typeof data.coverImagePath === 'string' ? data.coverImagePath : undefined,
    coverImageUrl:
      typeof data.coverImageUrl === 'string' ? data.coverImageUrl : undefined,
    pdfStoragePath:
      typeof data.pdfStoragePath === 'string' ? data.pdfStoragePath : undefined,
    originalFileName:
      typeof data.originalFileName === 'string' && data.originalFileName.trim()
        ? data.originalFileName
        : undefined,
    fileSize:
      typeof data.fileSize === 'number' && data.fileSize > 0
        ? data.fileSize
        : undefined,
    mimeType: data.mimeType === 'application/pdf' ? 'application/pdf' : undefined,
    currency,
    regularPrice,
    salePrice:
      typeof data.salePrice === 'number' ? data.salePrice : undefined,
    features: Array.isArray(data.features)
      ? data.features.map(String)
      : undefined,
    license:
      typeof data.license === 'string'
        ? data.license
        : typeof data.licenseInformation === 'string'
        ? data.licenseInformation
        : undefined,
    version: typeof data.version === 'string' ? data.version : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    featured: Boolean(data.featured ?? data.isFeatured),
    status:
      data.status === 'published' || data.status === 'archived'
        ? data.status
        : 'draft',
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    createdBy: String(data.createdBy || ''),
  };
}

function mapOrderDoc(
  id: string,
  data: Record<string, unknown>
): StoreOrderRecord {
  const currency: StoreCurrency =
    String(data.currency || 'USD').toUpperCase() === 'PKR' ? 'PKR' : 'USD';
  const paymentMethod: ManualPaymentMethod =
    data.paymentMethod === 'easypaisa' ||
    data.paymentMethod === 'jazzcash' ||
    data.paymentMethod === 'payoneer'
      ? data.paymentMethod
      : 'bank_transfer';
  const paymentStatus =
    data.paymentStatus === 'Payment Link Sent' ||
    data.paymentStatus === 'Submitted' ||
    data.paymentStatus === 'Paid' ||
    data.paymentStatus === 'Verified' ||
    data.paymentStatus === 'Rejected'
      ? data.paymentStatus
      : 'Pending';
  const deliveryStatus =
    data.deliveryStatus === 'Delivered' ? 'Delivered' : 'Pending';
  const status =
    data.status === 'paid' ||
    data.status === 'failed' ||
    data.status === 'refunded'
      ? data.status
      : 'pending';

  return {
    id,
    customerId: String(data.customerId || 'guest'),
    customerName: String(data.customerName || ''),
    customerEmail: String(data.customerEmail || ''),
    customerPhone: String(data.customerPhone || ''),
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    productId: String(data.productId || ''),
    productIds: Array.isArray(data.productIds)
      ? data.productIds.map(String)
      : [String(data.productId || '')],
    productName: String(data.productName || ''),
    quantity: Number(data.quantity || 1),
    unitPrice: Number(data.unitPrice || 0),
    totalAmount: Number(data.totalAmount || 0),
    currency,
    paymentMethod,
    paymentStatus,
    paymentReference:
      typeof data.paymentReference === 'string'
        ? data.paymentReference
        : undefined,
    paymentRequestLink:
      typeof data.paymentRequestLink === 'string'
        ? data.paymentRequestLink
        : undefined,
    paymentLinkSentAt: data.paymentLinkSentAt
      ? timestampToIso(data.paymentLinkSentAt)
      : undefined,
    deliveryStatus,
    status,
    adminNotes:
      typeof data.adminNotes === 'string' ? data.adminNotes : undefined,
    verifiedAt: data.verifiedAt ? timestampToIso(data.verifiedAt) : undefined,
    deliveredAt: data.deliveredAt
      ? timestampToIso(data.deliveredAt)
      : undefined,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

// =============================================================================
// Public Store Firestore Queries (Rule-enforced: active==true, status==published)
// =============================================================================

export async function fetchActiveCategories(): Promise<StoreCategory[]> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing.');
  }
  const path = 'categories';
  try {
    const q = query(collection(db, path), where('active', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => mapCategoryDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchActiveSubcategories(): Promise<StoreSubcategory[]> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing.');
  }
  const path = 'subcategories';
  try {
    const q = query(collection(db, path), where('active', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => mapSubcategoryDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPublishedProducts(): Promise<StoreProductRecord[]> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing.');
  }
  const path = 'products';
  try {
    const q = query(collection(db, path), where('status', '==', 'published'));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => mapProductDoc(d.id, d.data() as Record<string, unknown>))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPublishedProductBySlug(
  slug: string
): Promise<StoreProductRecord | null> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing.');
  }
  const path = 'products';
  try {
    const q = query(
      collection(db, path),
      where('status', '==', 'published'),
      where('slug', '==', slug)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const first = snap.docs[0];
    return mapProductDoc(first.id, first.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchPublicStoreSnapshot(): Promise<{
  categories: StoreCategory[];
  subcategories: StoreSubcategory[];
  products: StoreProductRecord[];
}> {
  const [categories, subcategories, products] = await Promise.all([
    fetchActiveCategories(),
    fetchActiveSubcategories(),
    fetchPublishedProducts(),
  ]);
  return { categories, subcategories, products };
}

export async function fetchPublicShowcaseRanks(): Promise<
  Record<string, ShowcaseRankSignal>
> {
  if (!isFirebaseConfigured) {
    return {};
  }
  try {
    const q = query(
      collection(db, 'showcaseRanks'),
      where('bestSeller', '==', true)
    );
    const snap = await getDocs(q);
    const ranks: Record<string, ShowcaseRankSignal> = {};
    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>;
      const productId = String(data.productId || d.id || '').trim();
      const rank = Math.floor(Number(data.rank || 0));
      const bestSeller = data.bestSeller === true;
      if (!productId || !bestSeller || rank < 1) continue;
      ranks[productId] = {
        rank,
        bestSeller: true,
      };
    }
    return ranks;
  } catch (error) {
    console.warn('Unable to load public showcase ranks:', error);
    return {};
  }
}

export async function fetchProductSalesAdmin(): Promise<
  Record<string, ProductSalesAggregate>
> {
  if (!isFirebaseConfigured) {
    return {};
  }
  const path = 'productSales';
  try {
    const snap = await getDocs(collection(db, path));
    const stats: Record<string, ProductSalesAggregate> = {};
    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>;
      const productId = String(data.productId || d.id || '').trim();
      const unitsSold = Math.max(0, Math.floor(Number(data.unitsSold || 0)));
      const paidOrdersCount = Math.max(
        0,
        Math.floor(Number(data.paidOrdersCount || 0))
      );
      if (!productId) continue;
      const lastPaidIso = data.lastPaidAt ? timestampToIso(data.lastPaidAt) : '';
      const lastPaidMs = lastPaidIso ? new Date(lastPaidIso).getTime() : 0;
      stats[productId] = {
        unitsSold,
        paidOrdersCount,
        lastPaidAtMs: Number.isFinite(lastPaidMs) ? lastPaidMs : 0,
      };
    }
    return stats;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchHomepageShowcaseProducts(limit = 5): Promise<{
  slides: ShowcaseSlideItem[];
  hasBestSellers: boolean;
}> {
  const [products, categories, showcaseRanks] = await Promise.all([
    fetchPublishedProducts(),
    fetchActiveCategories(),
    fetchPublicShowcaseRanks(),
  ]);
  const slides = rankShowcaseProducts(products, categories, showcaseRanks, limit);
  return {
    slides,
    hasBestSellers: slides.some((s) => s.isBestSeller),
  };
}

// =============================================================================
// Admin Authorization Verification
// =============================================================================

const BOOTSTRAPPED_ADMIN_EMAIL = 'muhammadkamran4122@gmail.com';

export async function verifyAdminAccess(
  uid: string,
  email?: string | null,
  emailVerified?: boolean
): Promise<boolean> {
  if (!uid || !emailVerified) return false;
  if (email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
    return true;
  }
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

// =============================================================================
// Admin Categories & Subcategories Operations
// =============================================================================

export async function fetchAllCategoriesAdmin(): Promise<StoreCategory[]> {
  const path = 'categories';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => mapCategoryDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllSubcategoriesAdmin(): Promise<StoreSubcategory[]> {
  const path = 'subcategories';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => mapSubcategoryDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveCategoryAdmin(
  input: {
    id?: string;
    name: string;
    slug: string;
    description: string;
    displayOrder: number;
    active: boolean;
  },
  isUpdate: boolean
): Promise<void> {
  const docId = (input.id || input.slug)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const path = `categories/${docId}`;
  const refDoc = doc(db, 'categories', docId);

  if (isUpdate) {
    try {
      await updateDoc(refDoc, {
        name: input.name.trim(),
        slug: input.slug.trim(),
        description: input.description.trim() || input.name.trim(),
        displayOrder: Number(input.displayOrder) || 0,
        active: Boolean(input.active),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    try {
      await setDoc(refDoc, {
        id: docId,
        name: input.name.trim(),
        slug: input.slug.trim() || docId,
        description: input.description.trim() || input.name.trim(),
        displayOrder: Number(input.displayOrder) || 0,
        active: Boolean(input.active),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export async function deleteCategoryDoc(categoryId: string): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSubcategoryAdmin(
  input: {
    id?: string;
    categoryId: string;
    name: string;
    slug: string;
    displayOrder: number;
    active: boolean;
  },
  isUpdate: boolean
): Promise<void> {
  const cleanName = input.name.trim().slice(0, 120);
  if (cleanName.length < 2) {
    throw new Error('Subcategory name must be at least 2 characters.');
  }
  const cleanSlug = sanitizeSlug(input.slug.trim() || cleanName).slice(0, 128);
  const docId = (input.id || cleanSlug)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 128);

  if (!docId || !input.categoryId.trim()) {
    throw new Error('Parent category and subcategory ID are required.');
  }

  const path = `subcategories/${docId}`;
  const refDoc = doc(db, 'subcategories', docId);

  if (isUpdate) {
    try {
      await updateDoc(refDoc, {
        categoryId: input.categoryId.trim(),
        name: cleanName,
        slug: cleanSlug,
        displayOrder: Number(input.displayOrder) || 0,
        active: Boolean(input.active),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    try {
      await setDoc(refDoc, {
        id: docId,
        categoryId: input.categoryId.trim(),
        name: cleanName,
        slug: cleanSlug,
        displayOrder: Number(input.displayOrder) || 0,
        active: Boolean(input.active),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export async function deleteSubcategoryDoc(subcategoryId: string): Promise<void> {
  const path = `subcategories/${subcategoryId}`;
  try {
    await deleteDoc(doc(db, 'subcategories', subcategoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =============================================================================
// Admin Products CRUD (Metadata-only: Zero Firebase Storage dependencies)
// =============================================================================

export function generateNewProductId(): string {
  return doc(collection(db, 'products')).id;
}

export async function fetchAllProductsAdmin(): Promise<StoreProductRecord[]> {
  const path = 'products';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => mapProductDoc(d.id, d.data() as Record<string, unknown>))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchProductByIdAdmin(
  productId: string
): Promise<StoreProductRecord | null> {
  const path = `products/${productId}`;
  try {
    const snap = await getDoc(doc(db, 'products', productId));
    if (!snap.exists()) return null;
    return mapProductDoc(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export interface SaveProductInput {
  id: string;
  name: string;
  slug?: string;
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
  status: 'draft' | 'published' | 'archived';
}

export async function saveProductAdmin(
  input: SaveProductInput,
  isUpdate: boolean
): Promise<StoreProductRecord> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    throw new Error(
      'Authenticated, email-verified admin session is required to save products.'
    );
  }

  if (
    typeof input.salePrice === 'number' &&
    input.salePrice >= input.regularPrice
  ) {
    throw new Error('Sale price must be strictly lower than regular price.');
  }

  const allProducts = await fetchAllProductsAdmin();
  const uniqueSlug = resolveUniqueSlug(
    input.slug?.trim() || input.name,
    allProducts,
    isUpdate ? input.id : undefined
  );

  const path = `products/${input.id}`;
  const docRef = doc(db, 'products', input.id);

  const cleanFeatures = (input.features || [])
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 30);
  const cleanTags = (input.tags || [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 25);

  const basePayload: Record<string, unknown> = {
    name: input.name.trim().slice(0, 160),
    slug: uniqueSlug,
    shortDescription: input.shortDescription.trim().slice(0, 400),
    categoryId: input.categoryId,
    subcategoryId: input.subcategoryId,
    currency: input.currency === 'PKR' ? 'PKR' : 'USD',
    regularPrice: Number(input.regularPrice),
    featured: Boolean(input.featured),
    status: input.status,
    updatedAt: serverTimestamp(),
  };

  if (input.originalFileName?.trim()) {
    basePayload.originalFileName = input.originalFileName.trim().slice(0, 255);
  } else if (isUpdate) {
    basePayload.originalFileName = deleteField();
  }

  if (input.pdfStoragePath?.trim()) {
    basePayload.pdfStoragePath = input.pdfStoragePath.trim().slice(0, 500);
  } else if (isUpdate) {
    basePayload.pdfStoragePath = deleteField();
  }

  if (typeof input.fileSize === 'number' && input.fileSize > 0) {
    basePayload.fileSize = Number(input.fileSize);
    basePayload.mimeType = 'application/pdf';
  } else if (isUpdate) {
    basePayload.fileSize = deleteField();
    basePayload.mimeType = deleteField();
  }

  if (input.description?.trim()) {
    basePayload.description = input.description.trim().slice(0, 10000);
  } else if (isUpdate) {
    basePayload.description = deleteField();
  }

  if (input.coverImageUrl?.trim()) {
    basePayload.coverImageUrl = input.coverImageUrl.trim().slice(0, 1000);
    if (input.coverImagePath?.trim()) {
      basePayload.coverImagePath = input.coverImagePath.trim().slice(0, 500);
    } else if (isUpdate) {
      basePayload.coverImagePath = deleteField();
    }
  } else if (isUpdate) {
    basePayload.coverImagePath = deleteField();
    basePayload.coverImageUrl = deleteField();
  }

  if (typeof input.salePrice === 'number' && !Number.isNaN(input.salePrice)) {
    basePayload.salePrice = input.salePrice;
  } else if (isUpdate) {
    basePayload.salePrice = deleteField();
  }

  if (cleanFeatures.length > 0) {
    basePayload.features = cleanFeatures;
  } else if (isUpdate) {
    basePayload.features = deleteField();
  }

  if (input.license?.trim()) {
    basePayload.license = input.license.trim().slice(0, 1000);
  } else if (isUpdate) {
    basePayload.license = deleteField();
  }

  if (input.version?.trim()) {
    basePayload.version = input.version.trim().slice(0, 64);
  } else if (isUpdate) {
    basePayload.version = deleteField();
  }

  if (cleanTags.length > 0) {
    basePayload.tags = cleanTags;
  } else if (isUpdate) {
    basePayload.tags = deleteField();
  }

  try {
    if (isUpdate) {
      await updateDoc(docRef, basePayload);
    } else {
      await setDoc(docRef, {
        ...basePayload,
        id: input.id,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
      });
    }

    const saved = await fetchProductByIdAdmin(input.id);
    if (!saved) {
      throw new Error('Saved product could not be read back from Firestore.');
    }
    return saved;
  } catch (error) {
    handleFirestoreError(
      error,
      isUpdate ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteProductWithAssetsAdmin(product: {
  id: string;
  pdfStoragePath?: string;
  coverImagePath?: string;
}): Promise<void> {
  // Starter Tier uses Firestore metadata only; no Firebase Storage deletion calls.
  const path = `products/${product.id}`;
  try {
    await deleteDoc(doc(db, 'products', product.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateProductTagsAdmin(
  productId: string,
  tags: string[]
): Promise<void> {
  const seen = new Set<string>();
  const cleanTags: string[] = [];
  for (const raw of tags) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleanTags.push(trimmed);
    if (cleanTags.length >= 25) break;
  }

  const path = `products/${productId}`;
  try {
    await updateDoc(doc(db, 'products', productId), {
      tags: cleanTags.length > 0 ? cleanTags : deleteField(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// =============================================================================
// Payment Instructions Config (settings/payment_instructions)
// =============================================================================

export function getDefaultPaymentInstructions(): PaymentInstructionsConfig {
  return {
    id: 'payment_instructions',
    bankTransfer: {
      enabled: false,
      bankName: '',
      accountTitle: '',
      accountNumber: '',
      iban: '',
      branchCode: '',
      instructions: '',
    },
    easypaisa: {
      enabled: false,
      accountTitle: '',
      accountNumber: '',
      instructions: '',
    },
    jazzcash: {
      enabled: false,
      accountTitle: '',
      accountNumber: '',
      instructions: '',
    },
    generalInstructions:
      'After completing your payment transfer, return to this page and click "I Have Sent Payment" with your transaction reference ID. Once our team manually verifies your payment, your digital PDF will be sent to your email address.',
    supportEmail: '',
    updatedAt: new Date(0).toISOString(),
  };
}

export async function fetchPaymentInstructions(): Promise<PaymentInstructionsConfig> {
  if (!isFirebaseConfigured) {
    return getDefaultPaymentInstructions();
  }
  const path = 'settings/payment_instructions';
  try {
    const snap = await getDoc(doc(db, 'settings', 'payment_instructions'));
    if (!snap.exists()) {
      return getDefaultPaymentInstructions();
    }
    const data = snap.data() as Record<string, unknown>;
    const bank = (data.bankTransfer || {}) as Record<string, unknown>;
    const easypaisa = (data.easypaisa || {}) as Record<string, unknown>;
    const jazzcash = (data.jazzcash || {}) as Record<string, unknown>;

    return {
      id: 'payment_instructions',
      bankTransfer: {
        enabled: Boolean(bank.enabled),
        bankName: String(bank.bankName || ''),
        accountTitle: String(bank.accountTitle || ''),
        accountNumber: String(bank.accountNumber || ''),
        iban: typeof bank.iban === 'string' ? bank.iban : '',
        branchCode: typeof bank.branchCode === 'string' ? bank.branchCode : '',
        instructions:
          typeof bank.instructions === 'string' ? bank.instructions : '',
      },
      easypaisa: {
        enabled: Boolean(easypaisa.enabled),
        accountTitle: String(easypaisa.accountTitle || ''),
        accountNumber: String(easypaisa.accountNumber || ''),
        instructions:
          typeof easypaisa.instructions === 'string'
            ? easypaisa.instructions
            : '',
      },
      jazzcash: {
        enabled: Boolean(jazzcash.enabled),
        accountTitle: String(jazzcash.accountTitle || ''),
        accountNumber: String(jazzcash.accountNumber || ''),
        instructions:
          typeof jazzcash.instructions === 'string' ? jazzcash.instructions : '',
      },
      generalInstructions:
        typeof data.generalInstructions === 'string'
          ? data.generalInstructions
          : getDefaultPaymentInstructions().generalInstructions,
      supportEmail:
        typeof data.supportEmail === 'string' ? data.supportEmail : '',
      updatedAt: timestampToIso(data.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function savePaymentInstructionsAdmin(
  config: Omit<PaymentInstructionsConfig, 'id' | 'updatedAt'>
): Promise<PaymentInstructionsConfig> {
  const path = 'settings/payment_instructions';
  const payload: Record<string, unknown> = {
    id: 'payment_instructions',
    bankTransfer: {
      enabled: Boolean(config.bankTransfer.enabled),
      bankName: config.bankTransfer.bankName.trim().slice(0, 120),
      accountTitle: config.bankTransfer.accountTitle.trim().slice(0, 120),
      accountNumber: config.bankTransfer.accountNumber.trim().slice(0, 80),
      ...(config.bankTransfer.iban?.trim()
        ? { iban: config.bankTransfer.iban.trim().slice(0, 80) }
        : {}),
      ...(config.bankTransfer.branchCode?.trim()
        ? { branchCode: config.bankTransfer.branchCode.trim().slice(0, 40) }
        : {}),
      ...(config.bankTransfer.instructions?.trim()
        ? { instructions: config.bankTransfer.instructions.trim().slice(0, 600) }
        : {}),
    },
    easypaisa: {
      enabled: Boolean(config.easypaisa.enabled),
      accountTitle: config.easypaisa.accountTitle.trim().slice(0, 120),
      accountNumber: config.easypaisa.accountNumber.trim().slice(0, 80),
      ...(config.easypaisa.instructions?.trim()
        ? { instructions: config.easypaisa.instructions.trim().slice(0, 600) }
        : {}),
    },
    jazzcash: {
      enabled: Boolean(config.jazzcash.enabled),
      accountTitle: config.jazzcash.accountTitle.trim().slice(0, 120),
      accountNumber: config.jazzcash.accountNumber.trim().slice(0, 80),
      ...(config.jazzcash.instructions?.trim()
        ? { instructions: config.jazzcash.instructions.trim().slice(0, 600) }
        : {}),
    },
    updatedAt: serverTimestamp(),
  };

  if (config.generalInstructions?.trim()) {
    payload.generalInstructions = config.generalInstructions
      .trim()
      .slice(0, 1000);
  }
  if (config.supportEmail?.trim()) {
    payload.supportEmail = config.supportEmail.trim().slice(0, 254);
  }

  try {
    await setDoc(doc(db, 'settings', 'payment_instructions'), payload);
    return fetchPaymentInstructions();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// =============================================================================
// Manual Orders (Customer Placement & Admin Verification / Delivery)
// =============================================================================

const RECENT_ORDER_STORAGE_PREFIX = 'mkl_recent_order_';

interface CachedOrderSession {
  order: StoreOrderRecord;
  submitSecret?: string;
}

function saveOrderSessionCache(
  order: StoreOrderRecord,
  submitSecret?: string
): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    const payload: CachedOrderSession = { order, submitSecret };
    window.sessionStorage.setItem(
      `${RECENT_ORDER_STORAGE_PREFIX}${order.id}`,
      JSON.stringify(payload)
    );
  } catch {
    // Ignore storage quota issues
  }
}

function readOrderSessionCache(orderId: string): CachedOrderSession | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(
      `${RECENT_ORDER_STORAGE_PREFIX}${orderId}`
    );
    if (!raw) return null;
    return JSON.parse(raw) as CachedOrderSession;
  } catch {
    return null;
  }
}

export interface CreateManualOrderInput {
  productId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  paymentMethod: ManualPaymentMethod;
  notes?: string;
}

export async function createManualOrder(
  input: CreateManualOrderInput
): Promise<StoreOrderRecord> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing.');
  }

  const validation = validateOrderFormInput({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    quantity: input.quantity,
    paymentMethod: input.paymentMethod,
    notes: input.notes,
  });

  if (!validation.valid || !validation.cleaned) {
    throw new Error(validation.error || 'Please check your order details.');
  }

  const cleaned = validation.cleaned;

  // Read live published product from Firestore to lock unitPrice, currency, and exact name.
  const prodSnap = await getDoc(doc(db, 'products', input.productId));
  if (!prodSnap.exists()) {
    throw new Error('Selected product was not found.');
  }
  const prodData = prodSnap.data() as Record<string, unknown>;
  const product = mapProductDoc(prodSnap.id, prodData);
  if (product.status !== 'published') {
    throw new Error('This product is no longer available for purchase.');
  }

  const unitPrice = getEffectiveProductPrice(product);
  const totalAmount = Number((unitPrice * cleaned.quantity).toFixed(2));
  const orderId = generateUniqueOrderId();
  const currentUser = auth.currentUser;
  const customerId = currentUser ? currentUser.uid : 'guest';
  const submitSecret = currentUser ? undefined : generateSubmitSecret();

  const payload: Record<string, unknown> = {
    id: orderId,
    customerId,
    customerName: cleaned.customerName,
    customerEmail: cleaned.customerEmail,
    customerPhone: cleaned.customerPhone,
    productId: product.id,
    productIds: [product.id],
    productName: product.name,
    quantity: cleaned.quantity,
    unitPrice,
    totalAmount,
    currency: product.currency,
    paymentMethod: cleaned.paymentMethod,
    paymentStatus: 'Pending',
    deliveryStatus: 'Pending',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (cleaned.notes) {
    payload.notes = cleaned.notes;
  }
  if (submitSecret) {
    payload.submitSecret = submitSecret;
  }

  const path = `orders/${orderId}`;
  try {
    await setDoc(doc(db, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  const nowIso = new Date().toISOString();
  const createdRecord: StoreOrderRecord = {
    id: orderId,
    customerId,
    customerName: cleaned.customerName,
    customerEmail: cleaned.customerEmail,
    customerPhone: cleaned.customerPhone,
    notes: cleaned.notes,
    productId: product.id,
    productIds: [product.id],
    productName: product.name,
    quantity: cleaned.quantity,
    unitPrice,
    totalAmount,
    currency: product.currency,
    paymentMethod: cleaned.paymentMethod,
    paymentStatus: 'Pending',
    deliveryStatus: 'Pending',
    status: 'pending',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  saveOrderSessionCache(createdRecord, submitSecret);
  return createdRecord;
}

export async function fetchOrderForViewer(
  orderId: string
): Promise<{
  order: StoreOrderRecord | null;
  canSubmitPayment: boolean;
}> {
  const cached = readOrderSessionCache(orderId);

  if (auth.currentUser) {
    try {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (snap.exists()) {
        const order = mapOrderDoc(
          snap.id,
          snap.data() as Record<string, unknown>
        );
        const canSubmit =
          (order.paymentStatus === 'Pending' ||
            order.paymentStatus === 'Payment Link Sent') &&
          (order.customerId === auth.currentUser.uid ||
            Boolean(cached?.submitSecret));
        saveOrderSessionCache(order, cached?.submitSecret);
        return { order, canSubmitPayment: canSubmit };
      }
    } catch {
      // Signed-in user may be viewing a guest order placed in the same browser session
    }
  }

  if (cached?.order) {
    return {
      order: cached.order,
      canSubmitPayment:
        (cached.order.paymentStatus === 'Pending' ||
          cached.order.paymentStatus === 'Payment Link Sent') &&
        Boolean(cached.submitSecret),
    };
  }

  return { order: null, canSubmitPayment: false };
}

export async function submitOrderPaymentProof(
  orderId: string,
  input: {
    paymentMethod: ManualPaymentMethod;
    paymentReference?: string;
  }
): Promise<StoreOrderRecord | null> {
  const cached = readOrderSessionCache(orderId);
  const reference = (input.paymentReference || '').trim().slice(0, 160);
  const path = `orders/${orderId}`;

  const updatePayload: Record<string, unknown> = {
    paymentStatus: 'Submitted',
    paymentMethod: input.paymentMethod,
    updatedAt: serverTimestamp(),
  };

  if (reference) {
    updatePayload.paymentReference = reference;
  }
  if (cached?.submitSecret) {
    updatePayload.submitSecretAttempt = cached.submitSecret;
  }

  try {
    await updateDoc(doc(db, 'orders', orderId), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  if (cached?.order) {
    const updatedCached: StoreOrderRecord = {
      ...cached.order,
      paymentStatus: 'Submitted',
      paymentMethod: input.paymentMethod,
      paymentReference: reference || cached.order.paymentReference,
      updatedAt: new Date().toISOString(),
    };
    saveOrderSessionCache(updatedCached, cached.submitSecret);
    return updatedCached;
  }

  if (auth.currentUser) {
    const res = await fetchOrderForViewer(orderId);
    return res.order;
  }

  return null;
}

export async function fetchCustomerOrders(
  customerUid: string
): Promise<StoreOrderRecord[]> {
  if (!customerUid) return [];
  const path = 'orders';
  try {
    const q = query(
      collection(db, path),
      where('customerId', '==', customerUid)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => mapOrderDoc(d.id, d.data() as Record<string, unknown>))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllOrdersAdmin(): Promise<StoreOrderRecord[]> {
  const path = 'orders';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => mapOrderDoc(d.id, d.data() as Record<string, unknown>))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function savePayoneerPaymentLinkAdmin(
  orderId: string,
  input: {
    paymentRequestLink: string;
    markAsSent: boolean;
    adminNotes?: string;
  }
): Promise<void> {
  const linkCheck = validatePayoneerRequestLink(input.paymentRequestLink);
  if (!linkCheck.valid || !linkCheck.cleaned) {
    throw new Error(linkCheck.error || 'Invalid Payoneer Payment Request Link.');
  }

  const path = `orders/${orderId}`;
  const payload: Record<string, unknown> = {
    paymentRequestLink: linkCheck.cleaned,
    updatedAt: serverTimestamp(),
  };

  if (input.markAsSent) {
    payload.paymentStatus = 'Payment Link Sent';
    payload.paymentLinkSentAt = serverTimestamp();
    payload.status = 'pending';
  }

  if (typeof input.adminNotes === 'string') {
    const trimmed = input.adminNotes.trim().slice(0, 1000);
    payload.adminNotes = trimmed ? trimmed : deleteField();
  }

  try {
    await updateDoc(doc(db, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderPaymentStatusAdmin(
  orderId: string,
  paymentStatus: 'Paid' | 'Verified' | 'Rejected',
  adminNotes?: string
): Promise<void> {
  const path = `orders/${orderId}`;
  const isConfirmedPaid =
    paymentStatus === 'Paid' || paymentStatus === 'Verified';
  const payload: Record<string, unknown> = {
    paymentStatus,
    status: isConfirmedPaid ? 'paid' : 'failed',
    updatedAt: serverTimestamp(),
  };

  if (isConfirmedPaid) {
    payload.verifiedAt = serverTimestamp();
  }
  if (typeof adminNotes === 'string') {
    const trimmed = adminNotes.trim().slice(0, 1000);
    payload.adminNotes = trimmed ? trimmed : deleteField();
  }

  try {
    await updateDoc(doc(db, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  // Sync PII-free public best-seller counters automatically after Paid/Verified/Rejected update
  try {
    await reconcilePublicProductSalesAdmin();
  } catch (syncError) {
    console.warn('Public product sales reconciliation warning:', syncError);
  }
}

const PRODUCT_SALES_RECONCILED_SESSION_KEY = 'mk_labs_product_sales_reconciled_v2';

export async function reconcilePublicProductSalesAdmin(): Promise<void> {
  if (!isFirebaseConfigured) return;

  const [orders, existingSalesSnap, existingRanksSnap] = await Promise.all([
    fetchAllOrdersAdmin(),
    getDocs(collection(db, 'productSales')),
    getDocs(collection(db, 'showcaseRanks')),
  ]);

  const salesMap = computeProductSalesFromOrders(orders);
  const rankedList = computeShowcaseRanksFromSales(salesMap);
  const existingSalesIds = new Set(existingSalesSnap.docs.map((d) => d.id));
  const existingRankIds = new Set(existingRanksSnap.docs.map((d) => d.id));

  const targetEntries = Object.entries(salesMap).filter(
    ([productId, agg]) => Boolean(productId) && agg.unitsSold > 0
  );
  const targetIdSet = new Set(targetEntries.map(([productId]) => productId));
  const targetRankSet = new Set(rankedList.map((r) => r.productId));

  let batch = writeBatch(db);
  let opCount = 0;

  const flushIfNeeded = async () => {
    if (opCount >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  };

  // 1. Write admin-only exact sales aggregates
  for (const [productId, agg] of targetEntries) {
    const ref = doc(db, 'productSales', productId);
    const docPayload: Record<string, unknown> = {
      id: productId,
      productId,
      unitsSold: Math.min(1000000, Math.floor(agg.unitsSold)),
      paidOrdersCount: Math.min(1000000, Math.floor(agg.paidOrdersCount)),
      updatedAt: serverTimestamp(),
    };
    if (agg.lastPaidAtMs && agg.lastPaidAtMs > 0) {
      docPayload.lastPaidAt = Timestamp.fromMillis(agg.lastPaidAtMs);
    }
    batch.set(ref, docPayload);
    opCount += 1;
    await flushIfNeeded();
  }

  for (const existingId of existingSalesIds) {
    if (!targetIdSet.has(existingId)) {
      batch.delete(doc(db, 'productSales', existingId));
      opCount += 1;
      await flushIfNeeded();
    }
  }

  // 2. Write minimal public showcase ranking projection (rank + bestSeller only; no counts/PII)
  for (const item of rankedList) {
    const ref = doc(db, 'showcaseRanks', item.productId);
    batch.set(ref, {
      id: item.productId,
      productId: item.productId,
      rank: Math.min(1000, Math.max(1, Math.floor(item.rank))),
      bestSeller: true,
      updatedAt: serverTimestamp(),
    });
    opCount += 1;
    await flushIfNeeded();
  }

  for (const existingId of existingRankIds) {
    if (!targetRankSet.has(existingId)) {
      batch.delete(doc(db, 'showcaseRanks', existingId));
      opCount += 1;
      await flushIfNeeded();
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }
}

export async function reconcileProductSalesOncePerSession(): Promise<void> {
  try {
    if (
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(PRODUCT_SALES_RECONCILED_SESSION_KEY) === 'true'
    ) {
      return;
    }
    await reconcilePublicProductSalesAdmin();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(PRODUCT_SALES_RECONCILED_SESSION_KEY, 'true');
    }
  } catch (err) {
    console.warn('Admin product sales session reconciliation warning:', err);
  }
}

export async function markOrderDeliveredAdmin(
  orderId: string,
  adminNotes?: string
): Promise<void> {
  const path = `orders/${orderId}`;
  const payload: Record<string, unknown> = {
    deliveryStatus: 'Delivered',
    deliveredAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (typeof adminNotes === 'string') {
    const trimmed = adminNotes.trim().slice(0, 1000);
    payload.adminNotes = trimmed ? trimmed : deleteField();
  }

  try {
    await updateDoc(doc(db, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// =============================================================================
// Customer Accounts (Admin View & Account Status Moderation)
// =============================================================================

export async function fetchAllCustomersAdmin(): Promise<UserProfile[]> {
  const path = 'customers';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        const accountStatus: 'active' | 'suspended' =
          data.accountStatus === 'suspended' ? 'suspended' : 'active';
        return {
          id: d.id,
          email: String(data.email || ''),
          fullName: String(data.fullName || 'Customer'),
          role: 'customer' as const,
          accountStatus,
          status: accountStatus,
          createdAt: timestampToIso(data.createdAt),
          updatedAt: timestampToIso(data.updatedAt),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateCustomerAccountStatusAdmin(
  customerId: string,
  accountStatus: 'active' | 'suspended'
): Promise<void> {
  const path = `customers/${customerId}`;
  try {
    await updateDoc(doc(db, 'customers', customerId), {
      accountStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// =============================================================================
// Store Settings Operations
// =============================================================================

export async function fetchStoreSettingsAdmin(): Promise<StoreSettings | null> {
  const path = 'settings/public_store';
  try {
    const snap = await getDoc(doc(db, 'settings', 'public_store'));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return {
      id: snap.id,
      storeName: String(data.storeName || 'MK Labs Digital Store'),
      storeDescription: String(data.storeDescription || ''),
      storeContactEmail: '',
      defaultCurrency: String(data.defaultCurrency || 'USD'),
      defaultAccessType: 'paid_catalogue',
      maxUploadSizeBytes: getMaxPdfSizeBytes(),
      allowedFileFormats: ['pdf'],
      defaultDownloadLimit: 5,
      signedUrlExpirySeconds: 300,
      isStoreVisible: Boolean(data.isStoreVisible ?? true),
      seoTitle: 'MK Labs Digital Store',
      seoDescription: '',
      updatedAt: timestampToIso(data.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveStoreSettingsDoc(
  data: Partial<StoreSettings>
): Promise<StoreSettings> {
  const path = 'settings/public_store';
  try {
    await setDoc(doc(db, 'settings', 'public_store'), {
      id: 'public_store',
      storeName: (data.storeName || 'MK Labs Digital Store').slice(0, 120),
      storeDescription: (data.storeDescription || '').slice(0, 500),
      defaultCurrency: (data.defaultCurrency || 'USD').slice(0, 3).toUpperCase(),
      isStoreVisible: data.isStoreVisible ?? true,
      updatedAt: serverTimestamp(),
    });
    const updated = await fetchStoreSettingsAdmin();
    if (!updated) {
      throw new Error('Failed to load updated store settings.');
    }
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
