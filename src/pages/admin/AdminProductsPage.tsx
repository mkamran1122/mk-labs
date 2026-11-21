import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  FileEdit,
  Archive,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  FileText,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DigitalProduct,
  Category,
  ProductStatus,
  formatProductPrice,
  formatFileSize,
  getEffectiveProductPrice,
} from '../../types/store';
import { StoreApi } from '../../services/api';
import { useRouter } from '../../hooks/useRouter';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

type ProductSortOption =
  | 'newest'
  | 'oldest'
  | 'name_asc'
  | 'price_asc'
  | 'price_desc';

const PAGE_SIZE = 10;

export const AdminProductsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filters, sorting & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<ProductSortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<DigitalProduct | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError(null);
      const [prodRes, catRes] = await Promise.all([
        StoreApi.getAdminProducts({
          search: searchQuery || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        }),
        StoreApi.getAdminCategories(),
      ]);
      setProducts(prodRes.products);
      setCategories(catRes);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load products.';
      setPageError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter]);

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    void fetchProducts();
  }, [isAdmin, fetchProducts]);

  // Reset pagination when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, sortBy]);

  const sortedProducts = useMemo(() => {
    const copy = [...products];
    switch (sortBy) {
      case 'oldest':
        return copy.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'name_asc':
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      case 'price_asc':
        return copy.sort(
          (a, b) =>
            getEffectiveProductPrice({
              regularPrice: a.displayPrice,
              salePrice: a.salePrice,
            }) -
            getEffectiveProductPrice({
              regularPrice: b.displayPrice,
              salePrice: b.salePrice,
            })
        );
      case 'price_desc':
        return copy.sort(
          (a, b) =>
            getEffectiveProductPrice({
              regularPrice: b.displayPrice,
              salePrice: b.salePrice,
            }) -
            getEffectiveProductPrice({
              regularPrice: a.displayPrice,
              salePrice: a.salePrice,
            })
        );
      case 'newest':
      default:
        return copy.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [products, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = sortedProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handlePublish = async (prod: DigitalProduct) => {
    try {
      setActionLoadingId(prod.id);
      setPageError(null);
      await StoreApi.publishProduct(prod.id);
      setPageNotice(`"${prod.name}" is now published on the Digital Store.`);
      await fetchProducts();
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : 'Failed to publish product.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnpublish = async (prod: DigitalProduct) => {
    try {
      setActionLoadingId(prod.id);
      setPageError(null);
      await StoreApi.unpublishProduct(prod.id);
      setPageNotice(`"${prod.name}" moved back to Draft.`);
      await fetchProducts();
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : 'Failed to unpublish product.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchive = async (prod: DigitalProduct) => {
    try {
      setActionLoadingId(prod.id);
      setPageError(null);
      await StoreApi.archiveProduct(prod.id);
      setPageNotice(`"${prod.name}" moved to Archived.`);
      await fetchProducts();
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : 'Failed to archive product.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoadingId(deleteTarget.id);
      setDeleteError(null);
      setPageError(null);
      await StoreApi.deleteProduct({
        id: deleteTarget.id,
        pdfStoragePath: deleteTarget.pdfStoragePath,
        coverImagePath: deleteTarget.coverImagePath,
      });
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      setPageNotice(`Deleted "${deletedName}" from Firestore.`);
      await fetchProducts();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to delete product.';
      setDeleteError(msg);
      setPageError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Published</span>
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <FileEdit className="w-3 h-3" />
            <span>Draft</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <Archive className="w-3 h-3" />
            <span>Archived</span>
          </span>
        );
    }
  };

  return (
    <AdminLayout currentTab="products">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Products Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create, price, publish, archive, and manage official MK Labs digital PDF products.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchProducts()}
              className="w-11 h-11 sm:w-auto sm:h-auto sm:p-2 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Refresh products"
              aria-label="Refresh products"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products/new')}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {pageError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 break-words">{pageError}</div>
          </div>
        )}

        {pageNotice && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pageNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setPageNotice(null)}
              className="text-emerald-700 hover:underline font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters, Search & Sort Toolbar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, subcategory, PDF file, or tags..."
              className="w-full min-h-[44px] sm:min-h-0 pl-9 pr-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
              className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name_asc">Sort: Name (A–Z)</option>
              <option value="price_asc">Sort: Price (Low to High)</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Products Table & Mobile Cards */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          {/* Mobile Product Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                Loading products...
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="px-4 py-12 text-center space-y-2 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">
                  {products.length === 0 &&
                  statusFilter === 'all' &&
                  categoryFilter === 'all' &&
                  !searchQuery
                    ? 'No products created yet'
                    : 'No products match your filters'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Create your first digital PDF product to populate the store catalogue.
                </p>
                {products.length === 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/products/new')}
                    className="mt-2 inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Product</span>
                  </button>
                )}
              </div>
            ) : (
              paginatedProducts.map((prod) => {
                const effectivePrice = getEffectiveProductPrice({
                  regularPrice: prod.displayPrice,
                  salePrice: prod.salePrice,
                });
                const hasSale =
                  typeof prod.salePrice === 'number' &&
                  prod.salePrice < prod.displayPrice;

                return (
                  <div key={prod.id} className="p-3.5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {prod.coverImage?.publicUrl &&
                        !failedImageIds[prod.id] ? (
                          <img
                            src={prod.coverImage.publicUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            onError={() =>
                              setFailedImageIds((prev) => ({
                                ...prev,
                                [prod.id]: true,
                              }))
                            }
                          />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-slate-900 text-sm break-words line-clamp-2">
                              {prod.name}
                            </span>
                            {prod.isFeatured && (
                              <Star
                                className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0"
                                aria-label="Featured"
                              />
                            )}
                          </div>
                          <div className="shrink-0">
                            {renderStatusBadge(prod.status)}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-0.5 break-all">
                          /{prod.slug}
                          {prod.version ? ` · v${prod.version}` : ''}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-slate-600 truncate max-w-[200px]">
                            {prod.categories?.[0]?.name || prod.categoryIds[0] || '—'}
                            {prod.subcategoryName ? ` · ${prod.subcategoryName}` : ''}
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-slate-900">
                              {formatProductPrice(effectivePrice, prod.currency)}
                            </span>
                            {hasSale && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatProductPrice(prod.displayPrice, prod.currency)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/products/${prod.id}/edit`)}
                        className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {prod.status === 'published' ? (
                        <button
                          type="button"
                          onClick={() => void handleUnpublish(prod)}
                          disabled={actionLoadingId === prod.id}
                          className="flex-1 min-h-[40px] inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 cursor-pointer disabled:opacity-40"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handlePublish(prod)}
                          disabled={actionLoadingId === prod.id}
                          className="flex-1 min-h-[40px] inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 cursor-pointer disabled:opacity-40"
                        >
                          Publish
                        </button>
                      )}

                      {prod.status === 'published' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/store/product/${prod.slug}`)}
                          className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-md cursor-pointer"
                          title="View Published Product"
                          aria-label="View Published Product"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {prod.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => void handleArchive(prod)}
                          disabled={actionLoadingId === prod.id}
                          className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-md cursor-pointer disabled:opacity-30"
                          title="Archive Product"
                          aria-label="Archive Product"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(prod);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-red-600 hover:text-red-700 bg-red-50 border border-red-200 rounded-md cursor-pointer"
                        title="Delete Product"
                        aria-label="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Cover & Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Subcategory</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading products...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center space-y-2 text-slate-500">
                      <p className="font-semibold text-slate-700">
                        {products.length === 0 &&
                        statusFilter === 'all' &&
                        categoryFilter === 'all' &&
                        !searchQuery
                          ? 'No products created yet'
                          : 'No products match your filters'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Create your first digital PDF product to populate the store catalogue.
                      </p>
                      {products.length === 0 && (
                        <button
                          type="button"
                          onClick={() => navigate('/admin/products/new')}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Product</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((prod) => {
                    const effectivePrice = getEffectiveProductPrice({
                      regularPrice: prod.displayPrice,
                      salePrice: prod.salePrice,
                    });
                    const hasSale =
                      typeof prod.salePrice === 'number' &&
                      prod.salePrice < prod.displayPrice;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Cover Image + Product Name */}
                        <td className="px-4 py-3.5 min-w-[230px] max-w-[280px]">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {prod.coverImage?.publicUrl &&
                              !failedImageIds[prod.id] ? (
                                <img
                                  src={prod.coverImage.publicUrl}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                  onError={() =>
                                    setFailedImageIds((prev) => ({
                                      ...prev,
                                      [prod.id]: true,
                                    }))
                                  }
                                />
                              ) : (
                                <FileText className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="font-bold text-slate-900 truncate"
                                  title={prod.name}
                                >
                                  {prod.name}
                                </span>
                                {prod.isFeatured && (
                                  <Star
                                    className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0"
                                    aria-label="Featured"
                                  />
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 block truncate">
                                /{prod.slug}
                                {prod.version ? ` · v${prod.version}` : ''} ·{' '}
                                {prod.fileSize
                                  ? `${formatFileSize(prod.fileSize)} PDF`
                                  : prod.originalFileName || 'Email PDF Delivery'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5 text-slate-700">
                          {prod.categories?.[0]?.name || prod.categoryIds[0] || '—'}
                        </td>

                        {/* Subcategory */}
                        <td className="px-4 py-3.5 text-slate-600">
                          {prod.subcategoryName || prod.subcategoryId || '—'}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">
                            {formatProductPrice(effectivePrice, prod.currency)}
                          </div>
                          {hasSale && (
                            <div className="text-[10px] text-slate-400 line-through">
                              {formatProductPrice(prod.displayPrice, prod.currency)}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {renderStatusBadge(prod.status)}
                        </td>

                        {/* Created Date */}
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(prod.createdAt).getTime() > 0
                            ? new Date(prod.createdAt).toLocaleDateString()
                            : '—'}
                        </td>

                        {/* Action Menu */}
                        <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                          {prod.status === 'published' && (
                            <button
                              type="button"
                              onClick={() => navigate(`/store/product/${prod.slug}`)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                              title="View Published Product"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate(`/admin/products/${prod.id}/edit`)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 rounded cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {prod.status === 'published' ? (
                            <button
                              type="button"
                              onClick={() => void handleUnpublish(prod)}
                              disabled={actionLoadingId === prod.id}
                              className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded hover:bg-amber-100 cursor-pointer disabled:opacity-40"
                              title="Unpublish to Draft"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handlePublish(prod)}
                              disabled={actionLoadingId === prod.id}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 cursor-pointer disabled:opacity-40"
                              title="Publish to Live Store"
                            >
                              Publish
                            </button>
                          )}

                          {prod.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => void handleArchive(prod)}
                              disabled={actionLoadingId === prod.id}
                              className="p-1.5 text-slate-500 hover:text-slate-800 rounded cursor-pointer disabled:opacity-30"
                              title="Archive Product"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(prod);
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 rounded cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {sortedProducts.length > PAGE_SIZE && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600">
              <span>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, sortedProducts.length)} of{' '}
                {sortedProducts.length} products
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 min-h-[40px] sm:min-h-0 px-3 sm:px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <span className="px-2 font-semibold text-slate-800">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="inline-flex items-center gap-1 min-h-[40px] sm:min-h-0 px-3 sm:px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Confirm Product Deletion</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed break-words">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">"{deleteTarget.name}"</strong>?
                This removes the product record from Cloud Firestore.
              </p>

              {deleteError && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-800 break-words">
                  {deleteError}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteTarget(null);
                  }}
                  disabled={actionLoadingId === deleteTarget.id}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={actionLoadingId === deleteTarget.id}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoadingId === deleteTarget.id
                    ? 'Deleting Product...'
                    : 'Delete Product'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
