import {
  DigitalProduct,
  Category,
  Tag,
  UserProfile,
  DownloadEvent,
  AdminActivityLog,
  StoreSettings,
  StoreDashboardStats,
  StoreProductRecord,
  StoreCategory,
  StoreSubcategory,
  StoreOrderRecord,
  PaymentInstructionsConfig,
  ManualPaymentMethod,
} from '../types/store';
import {
  fetchActiveCategories,
  fetchActiveSubcategories,
  fetchPublishedProducts,
  fetchPublishedProductBySlug,
  fetchAllCategoriesAdmin,
  fetchAllSubcategoriesAdmin,
  saveCategoryAdmin,
  deleteCategoryDoc,
  saveSubcategoryAdmin,
  deleteSubcategoryDoc,
  fetchAllProductsAdmin,
  fetchProductByIdAdmin,
  saveProductAdmin,
  deleteProductWithAssetsAdmin,
  updateProductTagsAdmin,
  fetchStoreSettingsAdmin,
  saveStoreSettingsDoc,
  fetchPaymentInstructions,
  savePaymentInstructionsAdmin,
  createManualOrder,
  CreateManualOrderInput,
  fetchOrderForViewer,
  submitOrderPaymentProof,
  fetchCustomerOrders,
  fetchAllOrdersAdmin,
  savePayoneerPaymentLinkAdmin,
  updateOrderPaymentStatusAdmin,
  markOrderDeliveredAdmin,
  fetchAllCustomersAdmin,
  updateCustomerAccountStatusAdmin,
} from './firestoreStore';
import { getMaxPdfSizeBytes, sanitizeSlug } from './productValidation';
import { formatPaymentMethodLabel } from './orderValidation';

export interface TagSummary extends Tag {
  productCount: number;
  products: { id: string; name: string; status: string }[];
}

function mapStoreCategoryToUiCategory(
  c: StoreCategory,
  productCount = 0
): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    displayOrder: c.displayOrder,
    isActive: c.active,
    productCount,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt || c.createdAt,
  };
}

function mapProductRecordToUiProduct(
  p: StoreProductRecord,
  categoriesById: Map<string, Category>,
  subcategoriesById: Map<string, StoreSubcategory>
): DigitalProduct {
  const matchedCat = categoriesById.get(p.categoryId);
  const matchedSub = p.subcategoryId
    ? subcategoriesById.get(p.subcategoryId)
    : undefined;

  return {
    id: p.id,
    title: p.name,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    description: p.description || '',
    categoryIds: [p.categoryId],
    subcategoryId: p.subcategoryId,
    subcategoryName: matchedSub?.name,
    categories: matchedCat ? [matchedCat] : [],
    tags: p.tags || [],
    productType: 'PDF',
    deliveryKind: 'downloadable',
    status: p.status,
    accessType: 'paid_catalogue',
    displayPrice: p.regularPrice,
    salePrice: p.salePrice,
    currency: p.currency,
    version: p.version,
    licenseInformation: p.license,
    features: p.features,
    coverImagePath: p.coverImagePath,
    coverImageUrl: p.coverImageUrl,
    pdfStoragePath: p.pdfStoragePath,
    originalFileName: p.originalFileName,
    fileSize: p.fileSize,
    mimeType: p.mimeType,
    isFeatured: p.featured,
    createdBy: p.createdBy,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    coverImage: p.coverImageUrl
      ? {
          id: `${p.id}-cover`,
          productId: p.id,
          imageType: 'cover',
          storageKey: p.coverImagePath,
          publicUrl: p.coverImageUrl,
          displayOrder: 0,
          createdAt: p.createdAt,
        }
      : undefined,
  };
}

function buildTagSummariesFromProducts(prods: StoreProductRecord[]): TagSummary[] {
  const map = new Map<string, TagSummary>();
  for (const prod of prods) {
    const prodTags = prod.tags || [];
    for (const rawTag of prodTags) {
      const cleanName = rawTag.trim();
      if (!cleanName) continue;
      const slug = sanitizeSlug(cleanName);
      const key = slug || cleanName.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.productCount += 1;
        existing.products.push({
          id: prod.id,
          name: prod.name,
          status: prod.status,
        });
        if (
          new Date(prod.createdAt).getTime() >
          new Date(existing.createdAt).getTime()
        ) {
          existing.createdAt = prod.createdAt;
        }
      } else {
        map.set(key, {
          id: key,
          name: cleanName,
          slug: key,
          createdAt: prod.createdAt || new Date(0).toISOString(),
          productCount: 1,
          products: [{ id: prod.id, name: prod.name, status: prod.status }],
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function mapDeliveredOrdersToEvents(
  orders: StoreOrderRecord[],
  productsById: Map<string, StoreProductRecord>
): DownloadEvent[] {
  return orders
    .filter((o) => o.deliveryStatus === 'Delivered')
    .sort(
      (a, b) =>
        new Date(b.deliveredAt || b.updatedAt || b.createdAt).getTime() -
        new Date(a.deliveredAt || a.updatedAt || a.createdAt).getTime()
    )
    .map((ord) => {
      const prod = productsById.get(ord.productId);
      const timestamp = ord.deliveredAt || ord.updatedAt || ord.createdAt;
      return {
        id: `del_${ord.id}`,
        productId: ord.productId,
        productTitle: ord.productName,
        productFileId: ord.id,
        fileName:
          prod?.originalFileName || `${sanitizeSlug(ord.productName)}.pdf`,
        fileSize: prod?.fileSize,
        userId: ord.customerId !== 'guest' ? ord.customerId : undefined,
        userEmail: ord.customerEmail,
        eventStatus: 'completed' as const,
        ipAddress: formatPaymentMethodLabel(ord.paymentMethod),
        userAgent: ord.id,
        timestamp,
        createdAt: timestamp,
      };
    });
}

function buildAdminAuditLogs(
  orders: StoreOrderRecord[],
  prods: StoreProductRecord[],
  cats: StoreCategory[]
): AdminActivityLog[] {
  const events: AdminActivityLog[] = [];

  for (const ord of orders) {
    events.push({
      id: `ord-create-${ord.id}`,
      actorId: ord.customerId || 'guest',
      actorEmail: ord.customerEmail,
      action: 'order_created',
      targetType: 'order',
      targetId: ord.id,
      summary: `Order ${ord.id} placed for "${ord.productName}" (${formatPaymentMethodLabel(ord.paymentMethod)})`,
      createdAt: ord.createdAt,
    });
    if (ord.paymentLinkSentAt) {
      events.push({
        id: `ord-link-${ord.id}`,
        actorId: 'admin',
        actorEmail: 'MK Labs Admin',
        action: 'update_payment_link',
        targetType: 'order',
        targetId: ord.id,
        summary: `Payoneer payment link sent for Order ${ord.id} (${ord.customerEmail})`,
        createdAt: ord.paymentLinkSentAt,
      });
    }
    if (ord.verifiedAt) {
      events.push({
        id: `ord-paid-${ord.id}`,
        actorId: 'admin',
        actorEmail: 'MK Labs Admin',
        action: 'update_payment_verified',
        targetType: 'order',
        targetId: ord.id,
        summary: `Order ${ord.id} payment marked ${ord.paymentStatus} (${ord.productName})`,
        createdAt: ord.verifiedAt,
      });
    }
    if (ord.deliveredAt) {
      events.push({
        id: `ord-del-${ord.id}`,
        actorId: 'admin',
        actorEmail: 'MK Labs Admin',
        action: 'update_order_delivered',
        targetType: 'order',
        targetId: ord.id,
        summary: `Email PDF marked Delivered for Order ${ord.id} → ${ord.customerEmail}`,
        createdAt: ord.deliveredAt,
      });
    }
  }

  for (const prod of prods) {
    const actionName =
      prod.status === 'published'
        ? 'publish_product'
        : prod.status === 'archived'
        ? 'archive_product'
        : 'create_product';
    events.push({
      id: `prod-${prod.id}`,
      actorId: prod.createdBy || 'admin',
      actorEmail: 'MK Labs Admin',
      action: actionName,
      targetType: 'product',
      targetId: prod.id,
      summary: `Product "${prod.name}" (${prod.status})`,
      createdAt: prod.updatedAt || prod.createdAt,
    });
  }

  for (const cat of cats) {
    events.push({
      id: `cat-${cat.id}`,
      actorId: 'admin',
      actorEmail: 'MK Labs Admin',
      action: 'create_category',
      targetType: 'category',
      targetId: cat.id,
      summary: `Category "${cat.name}" (${cat.active ? 'active' : 'inactive'})`,
      createdAt: cat.updatedAt || cat.createdAt,
    });
  }

  return events.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const StoreApi = {
  // ---------------------------------------------------------------------------
  // Public Store APIs (Connected to Cloud Firestore)
  // ---------------------------------------------------------------------------
  async getCategories(): Promise<Category[]> {
    const [cats, prods] = await Promise.all([
      fetchActiveCategories(),
      fetchPublishedProducts().catch(() => [] as StoreProductRecord[]),
    ]);
    const publishedProds = prods.filter((p) => p.status === 'published');
    return cats.map((c) =>
      mapStoreCategoryToUiCategory(
        c,
        publishedProds.filter((p) => p.categoryId === c.id).length
      )
    );
  },

  async getSubcategories(): Promise<StoreSubcategory[]> {
    return fetchActiveSubcategories();
  },

  async getProducts(params?: {
    category?: string;
    subcategory?: string;
    search?: string;
    sort?: string;
    limit?: number;
    featured?: boolean;
  }): Promise<{ products: DigitalProduct[]; total: number }> {
    const [cats, subs, rawProducts] = await Promise.all([
      fetchActiveCategories(),
      fetchActiveSubcategories(),
      fetchPublishedProducts(),
    ]);
    const categories = cats.map((c) => mapStoreCategoryToUiCategory(c));
    const catById = new Map(categories.map((c) => [c.id, c]));
    const catBySlug = new Map(categories.map((c) => [c.slug, c]));
    const subById = new Map(subs.map((s) => [s.id, s]));
    const subBySlug = new Map(subs.map((s) => [s.slug, s]));

    let filtered = rawProducts.filter((p) => p.status === 'published');

    if (params?.category) {
      const cat = catBySlug.get(params.category) || catById.get(params.category);
      filtered = cat
        ? filtered.filter((p) => p.categoryId === cat.id)
        : [];
    }

    if (params?.subcategory) {
      const sub =
        subBySlug.get(params.subcategory) || subById.get(params.subcategory);
      filtered = sub
        ? filtered.filter((p) => p.subcategoryId === sub.id)
        : [];
    }

    if (params?.featured) {
      filtered = filtered.filter((p) => p.featured);
    }

    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const cat = catById.get(p.categoryId);
        const sub = subById.get(p.subcategoryId);
        const tagsText = (p.tags || []).join(' ').toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (cat?.name || '').toLowerCase().includes(q) ||
          (sub?.name || '').toLowerCase().includes(q) ||
          tagsText.includes(q)
        );
      });
    }

    if (params?.sort === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else if (params?.sort === 'oldest') {
      filtered = [...filtered].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    const total = filtered.length;
    const sliced = params?.limit ? filtered.slice(0, params.limit) : filtered;
    return {
      products: sliced.map((p) =>
        mapProductRecordToUiProduct(p, catById, subById)
      ),
      total,
    };
  },

  async getProductBySlug(slug: string): Promise<DigitalProduct> {
    const [cats, subs, product] = await Promise.all([
      fetchActiveCategories(),
      fetchActiveSubcategories(),
      fetchPublishedProductBySlug(slug),
    ]);
    if (!product) {
      throw new Error('Requested product was not found or is not published.');
    }
    const catById = new Map(
      cats.map((c) => [c.id, mapStoreCategoryToUiCategory(c)])
    );
    const subById = new Map(subs.map((s) => [s.id, s]));
    return mapProductRecordToUiProduct(product, catById, subById);
  },

  async searchProducts(
    q: string
  ): Promise<{ products: DigitalProduct[]; total: number }> {
    return this.getProducts({ search: q });
  },

  // ---------------------------------------------------------------------------
  // Payment Instructions & Manual Orders
  // ---------------------------------------------------------------------------
  async getPaymentInstructions(): Promise<PaymentInstructionsConfig> {
    return fetchPaymentInstructions();
  },

  async updatePaymentInstructions(
    config: Omit<PaymentInstructionsConfig, 'id' | 'updatedAt'>
  ): Promise<PaymentInstructionsConfig> {
    return savePaymentInstructionsAdmin(config);
  },

  async createOrder(input: CreateManualOrderInput): Promise<StoreOrderRecord> {
    return createManualOrder(input);
  },

  async getOrderById(orderId: string): Promise<{
    order: StoreOrderRecord | null;
    canSubmitPayment: boolean;
  }> {
    return fetchOrderForViewer(orderId);
  },

  async submitPaymentProof(
    orderId: string,
    input: { paymentMethod: ManualPaymentMethod; paymentReference?: string }
  ): Promise<StoreOrderRecord | null> {
    return submitOrderPaymentProof(orderId, input);
  },

  async getMyOrders(customerUid: string): Promise<StoreOrderRecord[]> {
    return fetchCustomerOrders(customerUid);
  },

  async getAdminOrders(): Promise<StoreOrderRecord[]> {
    return fetchAllOrdersAdmin();
  },

  async savePayoneerPaymentLink(
    orderId: string,
    input: {
      paymentRequestLink: string;
      markAsSent: boolean;
      adminNotes?: string;
    }
  ): Promise<void> {
    return savePayoneerPaymentLinkAdmin(orderId, input);
  },

  async markOrderPaid(orderId: string, adminNotes?: string): Promise<void> {
    return updateOrderPaymentStatusAdmin(orderId, 'Paid', adminNotes);
  },

  async verifyOrderPayment(orderId: string, adminNotes?: string): Promise<void> {
    return updateOrderPaymentStatusAdmin(orderId, 'Verified', adminNotes);
  },

  async rejectOrderPayment(orderId: string, adminNotes?: string): Promise<void> {
    return updateOrderPaymentStatusAdmin(orderId, 'Rejected', adminNotes);
  },

  async markOrderDelivered(orderId: string, adminNotes?: string): Promise<void> {
    return markOrderDeliveredAdmin(orderId, adminNotes);
  },

  // ---------------------------------------------------------------------------
  // Admin Management APIs (Connected to Cloud Firestore)
  // ---------------------------------------------------------------------------
  async getDashboardStats(): Promise<StoreDashboardStats> {
    const [cats, subs, prods, orders, customers] = await Promise.all([
      fetchAllCategoriesAdmin(),
      fetchAllSubcategoriesAdmin(),
      fetchAllProductsAdmin(),
      fetchAllOrdersAdmin().catch(() => [] as StoreOrderRecord[]),
      fetchAllCustomersAdmin().catch(() => [] as UserProfile[]),
    ]);
    const catById = new Map(
      cats.map((c) => [c.id, mapStoreCategoryToUiCategory(c)])
    );
    const subById = new Map(subs.map((s) => [s.id, s]));
    const prodById = new Map(prods.map((p) => [p.id, p]));
    const uniqueCustomers = new Set(
      orders.map((o) => o.customerEmail.toLowerCase()).filter(Boolean)
    );
    const deliveryEvents = mapDeliveredOrdersToEvents(orders, prodById);
    const auditLogs = buildAdminAuditLogs(orders, prods, cats);

    return {
      totalProducts: prods.length,
      publishedProducts: prods.filter((p) => p.status === 'published').length,
      draftProducts: prods.filter((p) => p.status === 'draft').length,
      archivedProducts: prods.filter((p) => p.status === 'archived').length,
      totalCategories: cats.length,
      totalCustomers: Math.max(customers.length, uniqueCustomers.size),
      totalDownloads: deliveryEvents.length,
      recentDownloads: deliveryEvents.slice(0, 5),
      recentActivity: auditLogs.slice(0, 5),
      recentProducts: prods
        .slice(0, 5)
        .map((p) => mapProductRecordToUiProduct(p, catById, subById)),
    };
  },

  async getAdminProducts(params?: {
    search?: string;
    status?: string;
    category?: string;
  }): Promise<{ products: DigitalProduct[]; total: number }> {
    const [cats, subs, prods] = await Promise.all([
      fetchAllCategoriesAdmin(),
      fetchAllSubcategoriesAdmin(),
      fetchAllProductsAdmin(),
    ]);
    const catById = new Map(
      cats.map((c) => [c.id, mapStoreCategoryToUiCategory(c)])
    );
    const catBySlug = new Map(
      cats.map((c) => [c.slug, mapStoreCategoryToUiCategory(c)])
    );
    const subById = new Map(subs.map((s) => [s.id, s]));

    let list = prods;
    if (params?.status && params.status !== 'all') {
      list = list.filter((p) => p.status === params.status);
    }
    if (params?.category && params.category !== 'all') {
      const cat = catBySlug.get(params.category) || catById.get(params.category);
      list = cat ? list.filter((p) => p.categoryId === cat.id) : [];
    }
    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter((p) => {
        const sub = subById.get(p.subcategoryId);
        const tags = (p.tags || []).join(' ').toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          (p.originalFileName || '').toLowerCase().includes(q) ||
          (sub?.name || '').toLowerCase().includes(q) ||
          tags.includes(q)
        );
      });
    }

    return {
      products: list.map((p) => mapProductRecordToUiProduct(p, catById, subById)),
      total: list.length,
    };
  },

  async getAdminProductById(id: string): Promise<StoreProductRecord> {
    const prod = await fetchProductByIdAdmin(id);
    if (!prod) throw new Error('Product not found in Firestore.');
    return prod;
  },

  async updateProductStatus(
    id: string,
    status: 'draft' | 'published' | 'archived'
  ): Promise<StoreProductRecord> {
    const existing = await fetchProductByIdAdmin(id);
    if (!existing) throw new Error('Product not found in Firestore.');
    return saveProductAdmin(
      {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        shortDescription: existing.shortDescription,
        description: existing.description,
        categoryId: existing.categoryId,
        subcategoryId: existing.subcategoryId,
        coverImagePath: existing.coverImagePath,
        coverImageUrl: existing.coverImageUrl,
        pdfStoragePath: existing.pdfStoragePath,
        originalFileName: existing.originalFileName,
        fileSize: existing.fileSize,
        mimeType: existing.mimeType,
        currency: existing.currency,
        regularPrice: existing.regularPrice,
        salePrice: existing.salePrice,
        features: existing.features,
        license: existing.license,
        version: existing.version,
        tags: existing.tags,
        featured: existing.featured,
        status,
      },
      true
    );
  },

  async publishProduct(id: string): Promise<StoreProductRecord> {
    return this.updateProductStatus(id, 'published');
  },

  async unpublishProduct(id: string): Promise<StoreProductRecord> {
    return this.updateProductStatus(id, 'draft');
  },

  async archiveProduct(id: string): Promise<StoreProductRecord> {
    return this.updateProductStatus(id, 'archived');
  },

  async deleteProduct(product: {
    id: string;
    pdfStoragePath?: string;
    coverImagePath?: string;
  }): Promise<void> {
    await deleteProductWithAssetsAdmin(product);
  },

  // ---------------------------------------------------------------------------
  // Categories (Connected to Cloud Firestore)
  // ---------------------------------------------------------------------------
  async getAdminCategories(): Promise<Category[]> {
    const [cats, prods] = await Promise.all([
      fetchAllCategoriesAdmin(),
      fetchAllProductsAdmin().catch(() => [] as StoreProductRecord[]),
    ]);
    return cats.map((c) =>
      mapStoreCategoryToUiCategory(
        c,
        prods.filter((p) => p.categoryId === c.id).length
      )
    );
  },

  async getAdminSubcategories(): Promise<StoreSubcategory[]> {
    return fetchAllSubcategoriesAdmin();
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const name = (data.name || '').trim();
    const slug = (
      data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    ).replace(/(^-|-$)/g, '');
    await saveCategoryAdmin(
      {
        name,
        slug,
        description: data.description || name,
        displayOrder: Number(data.displayOrder) || 1,
        active: data.isActive ?? true,
      },
      false
    );
    return {
      id: slug,
      name,
      slug,
      description: data.description || name,
      displayOrder: Number(data.displayOrder) || 1,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const name = (data.name || '').trim();
    const slug = (
      data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    ).replace(/(^-|-$)/g, '');
    await saveCategoryAdmin(
      {
        id,
        name,
        slug,
        description: data.description || name,
        displayOrder: Number(data.displayOrder) || 1,
        active: data.isActive ?? true,
      },
      true
    );
    return {
      id,
      name,
      slug,
      description: data.description || name,
      displayOrder: Number(data.displayOrder) || 1,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async deleteCategory(id: string): Promise<void> {
    await deleteCategoryDoc(id);
  },

  async createSubcategory(data: {
    categoryId: string;
    name: string;
    slug?: string;
    displayOrder?: number;
    active?: boolean;
  }): Promise<StoreSubcategory> {
    const cleanName = data.name.trim();
    const cleanSlug = sanitizeSlug(data.slug?.trim() || cleanName).slice(0, 128);
    await saveSubcategoryAdmin(
      {
        id: cleanSlug,
        categoryId: data.categoryId,
        name: cleanName,
        slug: cleanSlug,
        displayOrder: Number(data.displayOrder) || 1,
        active: data.active ?? true,
      },
      false
    );
    const nowIso = new Date().toISOString();
    return {
      id: cleanSlug,
      categoryId: data.categoryId,
      name: cleanName,
      slug: cleanSlug,
      displayOrder: Number(data.displayOrder) || 1,
      active: data.active ?? true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  },

  async updateSubcategory(
    id: string,
    data: {
      categoryId: string;
      name: string;
      slug?: string;
      displayOrder?: number;
      active?: boolean;
    }
  ): Promise<StoreSubcategory> {
    const cleanName = data.name.trim();
    const cleanSlug = sanitizeSlug(data.slug?.trim() || cleanName).slice(0, 128);
    await saveSubcategoryAdmin(
      {
        id,
        categoryId: data.categoryId,
        name: cleanName,
        slug: cleanSlug,
        displayOrder: Number(data.displayOrder) || 1,
        active: data.active ?? true,
      },
      true
    );
    const nowIso = new Date().toISOString();
    return {
      id,
      categoryId: data.categoryId,
      name: cleanName,
      slug: cleanSlug,
      displayOrder: Number(data.displayOrder) || 1,
      active: data.active ?? true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  },

  async deleteSubcategory(id: string): Promise<void> {
    await deleteSubcategoryDoc(id);
  },

  async getAdminTagSummaries(): Promise<TagSummary[]> {
    const prods = await fetchAllProductsAdmin();
    return buildTagSummariesFromProducts(prods);
  },

  async getAdminTags(): Promise<Tag[]> {
    const summaries = await this.getAdminTagSummaries();
    return summaries.map(({ id, name, slug, createdAt }) => ({
      id,
      name,
      slug,
      createdAt,
    }));
  },

  async createTag(name: string, productId?: string): Promise<Tag> {
    const cleanName = name.trim();
    if (!cleanName) {
      throw new Error('Tag name cannot be empty.');
    }
    const prods = await fetchAllProductsAdmin();
    if (prods.length === 0) {
      throw new Error(
        'Create at least one product first before adding tags.'
      );
    }
    const targetProduct = productId
      ? prods.find((p) => p.id === productId)
      : prods[0];
    if (!targetProduct) {
      throw new Error('Selected product was not found.');
    }
    const existingTags = targetProduct.tags || [];
    if (
      !existingTags.some((t) => t.toLowerCase() === cleanName.toLowerCase())
    ) {
      await updateProductTagsAdmin(targetProduct.id, [
        ...existingTags,
        cleanName,
      ]);
    }
    const slug = sanitizeSlug(cleanName);
    return {
      id: slug,
      name: cleanName,
      slug,
      createdAt: new Date().toISOString(),
    };
  },

  async deleteTag(tagIdOrName: string): Promise<void> {
    const targetKey = sanitizeSlug(tagIdOrName);
    const targetLower = tagIdOrName.trim().toLowerCase();
    const prods = await fetchAllProductsAdmin();
    const matching = prods.filter((p) =>
      (p.tags || []).some(
        (t) =>
          sanitizeSlug(t) === targetKey || t.trim().toLowerCase() === targetLower
      )
    );
    for (const prod of matching) {
      const nextTags = (prod.tags || []).filter(
        (t) =>
          sanitizeSlug(t) !== targetKey && t.trim().toLowerCase() !== targetLower
      );
      await updateProductTagsAdmin(prod.id, nextTags);
    }
  },

  async getAdminDownloads(params?: {
    productId?: string;
    limit?: number;
  }): Promise<DownloadEvent[]> {
    const [orders, prods] = await Promise.all([
      fetchAllOrdersAdmin().catch(() => [] as StoreOrderRecord[]),
      fetchAllProductsAdmin().catch(() => [] as StoreProductRecord[]),
    ]);
    const prodById = new Map(prods.map((p) => [p.id, p]));
    let events = mapDeliveredOrdersToEvents(orders, prodById);
    if (params?.productId && params.productId !== 'all') {
      events = events.filter((e) => e.productId === params.productId);
    }
    if (params?.limit && params.limit > 0) {
      events = events.slice(0, params.limit);
    }
    return events;
  },

  async getAdminCustomers(): Promise<UserProfile[]> {
    return fetchAllCustomersAdmin();
  },

  async updateCustomerStatus(
    id: string,
    status: 'active' | 'suspended'
  ): Promise<void> {
    await updateCustomerAccountStatusAdmin(id, status);
  },

  async getAdminActivity(): Promise<AdminActivityLog[]> {
    const [orders, prods, cats] = await Promise.all([
      fetchAllOrdersAdmin().catch(() => [] as StoreOrderRecord[]),
      fetchAllProductsAdmin().catch(() => [] as StoreProductRecord[]),
      fetchAllCategoriesAdmin().catch(() => [] as StoreCategory[]),
    ]);
    return buildAdminAuditLogs(orders, prods, cats);
  },

  async getStoreSettings(): Promise<StoreSettings> {
    const s = await fetchStoreSettingsAdmin();
    return (
      s || {
        id: 'public_store',
        storeName: 'MK Labs Digital Store',
        storeDescription:
          'Digital products, templates, creative assets, software, and memberships by MK Labs.',
        storeContactEmail: '',
        defaultCurrency: 'USD',
        defaultAccessType: 'paid_catalogue',
        maxUploadSizeBytes: getMaxPdfSizeBytes(),
        allowedFileFormats: ['pdf'],
        defaultDownloadLimit: 5,
        signedUrlExpirySeconds: 300,
        isStoreVisible: true,
        seoTitle: 'MK Labs Digital Store',
        seoDescription: '',
        updatedAt: new Date().toISOString(),
      }
    );
  },

  async updateStoreSettings(
    data: Partial<StoreSettings>
  ): Promise<StoreSettings> {
    return saveStoreSettingsDoc(data);
  },
};
