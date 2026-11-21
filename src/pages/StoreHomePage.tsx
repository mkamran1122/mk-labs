import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  ShoppingCart,
  User,
  ShoppingBag,
  Eye,
  CheckCircle2,
  X,
  Folder,
  CreditCard,
  Mail,
  FileCheck2,
  AlertCircle,
  ArrowRight,
  PackageOpen,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import {
  StoreCategory,
  StoreSubcategory,
  StoreProductRecord,
} from '../types/store';
import {
  toCategoryPlaceholderList,
  toSubcategoryPlaceholderList,
  getCategoryGroupBadge,
} from '../config/storeCatalog';
import { isFirebaseConfigured } from '../lib/firebase';
import { fetchPublicStoreSnapshot } from '../services/firestoreStore';
import { useRouter } from '../hooks/useRouter';
import { useAuth } from '../context/AuthContext';
import {
  StoreProductPreview,
  getEffectiveProductPrice,
  formatProductPrice,
} from '../components/store/StoreVisuals';
import { ProductDetailModal } from '../components/store/ProductDetailModal';
import { CartDrawer, CartEntry } from '../components/store/CartDrawer';
import {
  PlaceOrderModal,
  OrderDraftItem,
} from '../components/store/PlaceOrderModal';

type SortOption = 'newest' | 'price_asc' | 'price_desc';

const CART_STORAGE_KEY = 'mk_labs_store_cart_v1';

export const StoreHomePage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, isAdmin } = useAuth();

  // Firestore Store State
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [subcategories, setSubcategories] = useState<StoreSubcategory[]>([]);
  const [products, setProducts] = useState<StoreProductRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [awaitingCategorySeed, setAwaitingCategorySeed] = useState(false);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Product Detail Modal, Order Modal & Cart Drawer State
  const [activeProduct, setActiveProduct] =
    useState<StoreProductRecord | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderModalItems, setOrderModalItems] = useState<OrderDraftItem[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderingFromCart, setOrderingFromCart] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [cartItemIds, setCartItemIds] = useState<
    { id: string; quantity: number }[]
  >(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const loadStoreData = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setCategories([]);
      setSubcategories([]);
      setProducts([]);
      setLoadError(
        'Firebase configuration is missing. Provide Firebase environment variables or firebase-applet-config.json to connect the store.'
      );
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const snapshot = await fetchPublicStoreSnapshot();

      if (snapshot.categories.length === 0) {
        setAwaitingCategorySeed(true);
        setCategories(toCategoryPlaceholderList());
        setSubcategories(toSubcategoryPlaceholderList());
      } else {
        setAwaitingCategorySeed(false);
        setCategories(snapshot.categories);
        setSubcategories(snapshot.subcategories);
      }

      setProducts(
        snapshot.products.filter((p) => p.status === 'published')
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to load store data from Cloud Firestore.';
      setLoadError(msg);
      setCategories([]);
      setSubcategories([]);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStoreData();
  }, [loadStoreData]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItemIds));
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }, [cartItemIds]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const subcategoryMap = useMemo(
    () => new Map(subcategories.map((s) => [s.id, s])),
    [subcategories]
  );

  const cartItems: CartEntry[] = useMemo(
    () =>
      cartItemIds
        .map((entry) => {
          const found = products.find((p) => p.id === entry.id);
          if (!found) return null;
          return { product: found, quantity: 1 };
        })
        .filter((item): item is CartEntry => item !== null),
    [cartItemIds, products]
  );

  const categoryProductCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.categoryId, (counts.get(p.categoryId) || 0) + 1);
    }
    return counts;
  }, [products]);

  const featuredProducts = useMemo(
    () => products.filter((p) => p.featured),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = products.filter((product) => {
      const cat = categoryMap.get(product.categoryId);
      const sub = subcategoryMap.get(product.subcategoryId);
      const tagsText = (product.tags || []).join(' ').toLowerCase();

      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.shortDescription.toLowerCase().includes(q) ||
        (product.description || '').toLowerCase().includes(q) ||
        (cat?.name || '').toLowerCase().includes(q) ||
        (sub?.name || '').toLowerCase().includes(q) ||
        tagsText.includes(q);

      const matchesCategory =
        selectedCategoryId === 'all' ||
        product.categoryId === selectedCategoryId;

      return matchesSearch && matchesCategory;
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'price_asc') {
        return getEffectiveProductPrice(a) - getEffectiveProductPrice(b);
      }
      if (sortBy === 'price_desc') {
        return getEffectiveProductPrice(b) - getEffectiveProductPrice(a);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    products,
    categoryMap,
    subcategoryMap,
    searchQuery,
    selectedCategoryId,
    sortBy,
  ]);

  const isProductInCart = (productId: string) =>
    cartItemIds.some((item) => item.id === productId);

  const handleAddToCart = (product: StoreProductRecord) => {
    if (isProductInCart(product.id)) {
      setCartNotice(
        `${product.name} is already in your cart (single-purchase license).`
      );
      setTimeout(() => setCartNotice(null), 3000);
      setIsCartOpen(true);
      return;
    }
    setCartItemIds((prev) => [...prev, { id: product.id, quantity: 1 }]);
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItemIds((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCartItemIds([]);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategoryId('all');
    setSortBy('newest');
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const el = document.getElementById('store-all-products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const el = document.getElementById('store-all-products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cartCount = cartItems.length;
  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedCategoryId !== 'all';

  const renderProductCard = (product: StoreProductRecord) => {
    const effectivePrice = getEffectiveProductPrice(product);
    const hasSale =
      typeof product.salePrice === 'number' &&
      product.salePrice < product.regularPrice;
    const inCart = isProductInCart(product.id);
    const category = categoryMap.get(product.categoryId);
    const subcategory = subcategoryMap.get(product.subcategoryId);

    return (
      <div
        key={product.id}
        className="group bg-white rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden"
      >
        <div>
          <div
            onClick={() => setActiveProduct(product)}
            className="relative cursor-pointer"
          >
            <StoreProductPreview product={product} compact />
            <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-wrap items-center gap-1 sm:gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded border border-blue-200">
                PDF Product
              </span>
              {product.featured && (
                <span className="text-[9px] sm:text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded border border-amber-200">
                  Featured
                </span>
              )}
            </div>
          </div>

          <div
            onClick={() => setActiveProduct(product)}
            className="p-3 sm:p-5 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-500 mb-1 sm:mb-1.5">
              <span className="font-medium uppercase tracking-wider truncate">
                {category?.name || 'Digital Product'}
              </span>
            </div>

            <h3 className="text-sm sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
            {subcategory && (
              <p className="text-[11px] sm:text-xs font-medium text-slate-500 mt-0.5 line-clamp-1">
                {subcategory.name}
              </p>
            )}
            <p className="mt-1.5 sm:mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
              {product.shortDescription}
            </p>
          </div>
        </div>

        <div className="px-3 pb-3 pt-2.5 sm:px-5 sm:pb-5 sm:pt-3 border-t border-slate-100 space-y-2.5 sm:space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-slate-900">
                {formatProductPrice(effectivePrice, product.currency)}
              </span>
              {hasSale && (
                <span className="text-[11px] sm:text-xs text-slate-400 line-through">
                  {formatProductPrice(product.regularPrice, product.currency)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveProduct(product)}
                className="min-h-[40px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>View Details</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOrderingFromCart(false);
                  setOrderModalItems([{ product, quantity: 1 }]);
                  setIsOrderModalOpen(true);
                }}
                className="min-h-[40px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>Place Order</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleAddToCart(product)}
              className={`w-full min-h-[38px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                inCart
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {inCart ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">In Cart — Open Cart</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* A. Store Header */}
      <section className="pt-20 pb-10 sm:pt-28 sm:pb-14 md:pt-36 md:pb-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] sm:text-xs font-semibold text-blue-700 max-w-full">
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Official Studio Store · MK Labs Products Only</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{user ? user.fullName : 'Customer Account'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer shrink-0"
                aria-label={`Open shopping cart with ${cartCount} items`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart ({cartCount})</span>
              </button>
            </div>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-2xl min-[375px]:text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              MK Labs Digital Store
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-slate-600 leading-relaxed">
              Discover official digital products, handbooks, templates, creative assets, and software tools built by MK Labs.
            </p>

            {/* Header Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-5 sm:mt-7 flex flex-col sm:flex-row gap-2.5 max-w-xl"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories, handbooks, templates..."
                  className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-md border border-slate-300 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="w-9 h-9 flex items-center justify-center rounded-md absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label="Clear search query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                Search Store
              </button>
            </form>

            {cartNotice && (
              <div className="mt-4 p-3 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium">
                {cartNotice}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Loading / Error State Gate */}
      {isLoading ? (
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <span className="text-sm font-medium text-slate-700">
              Loading MK Labs Digital Store from Cloud Firestore...
            </span>
          </div>
        </section>
      ) : loadError ? (
        <section className="py-20 bg-white">
          <div className="max-w-xl mx-auto px-4">
            <div className="p-8 rounded-lg bg-red-50 border border-red-200 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
              <h2 className="text-lg font-bold text-red-900">
                Unable to Connect to Store Database
              </h2>
              <p className="text-xs text-red-800 leading-relaxed break-words">
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => void loadStoreData()}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          {awaitingCategorySeed && (
            <section className="bg-white pt-8">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="font-semibold">
                        Firestore Connected — Category Initialization Pending:
                      </strong>{' '}
                      The Firestore `categories` collection is currently empty. Authorized administrators can initialize these records into Firestore from the admin panel.
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => navigate('/admin/categories')}
                      className="px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-800 text-white font-semibold shrink-0 cursor-pointer"
                    >
                      Initialize in Admin
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* B. Featured Products (only shown if published featured products exist) */}
          {featuredProducts.length > 0 && (
            <section className="py-10 sm:py-16 md:py-20 bg-white border-b border-slate-100">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                      Studio Highlights
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                      Featured Products
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('store-all-products');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer self-start sm:self-auto"
                  >
                    <span>Browse All Products</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {featuredProducts.map((product) => renderProductCard(product))}
                </div>
              </div>
            </section>
          )}

          {/* C. Six Main Categories Directory */}
          <section
            id="categories"
            className="py-10 sm:py-16 md:py-20 bg-white border-b border-slate-100"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-10">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                    Store Categories
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Browse by Category
                  </h2>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">
                    Choose any category to filter the MK Labs digital product catalogue.
                  </p>
                </div>
                {selectedCategoryId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('all')}
                    className="min-h-[36px] text-xs font-semibold text-blue-600 hover:underline cursor-pointer self-start sm:self-auto"
                  >
                    Show All Categories
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                {categories.map((category) => {
                  const categoryProductsCount =
                    categoryProductCounts.get(category.id) || 0;
                  const isSelected = selectedCategoryId === category.id;
                  const badge = getCategoryGroupBadge(category);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleSelectCategory(category.id)}
                      className={`group text-left p-4 sm:p-6 rounded-lg border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/60 border-blue-600 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-blue-400 hover:shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
                          <span
                            className={`w-10 h-10 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : badge.iconAccentClass
                            }`}
                          >
                            <Folder className="w-4 h-4" />
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${badge.badgeClass}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}
                                aria-hidden="true"
                              />
                              <span>{badge.label}</span>
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                              {categoryProductsCount}{' '}
                              {categoryProductsCount === 1
                                ? 'product'
                                : 'products'}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {category.name}
                        </h3>
                        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                          {category.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-blue-600">
                        <span>
                          {isSelected
                            ? 'Active Category Filter'
                            : 'Browse Category'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* D. Published Products Catalogue */}
          <section
            id="store-all-products"
            className="py-10 sm:py-16 md:py-20 bg-slate-50 border-b border-slate-100"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5 sm:gap-4 mb-6 sm:mb-8">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                    Catalogue
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    {selectedCategoryId !== 'all'
                      ? categoryMap.get(selectedCategoryId)?.name
                      : 'All Published Products'}
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Showing {filteredProducts.length} of {products.length}{' '}
                  published {products.length === 1 ? 'product' : 'products'}
                </span>
              </div>

              {/* Filter Toolbar (Category-Only + Search & Sort) */}
              <div className="bg-white p-3.5 sm:p-5 rounded-lg border border-slate-200 mb-6 sm:mb-8 space-y-3.5 sm:space-y-4 shadow-2xs">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center">
                  <div className="sm:col-span-8 lg:col-span-9 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search published products by title, keyword, or tag..."
                      className="w-full min-h-[44px] pl-9 pr-9 py-2 rounded-md border border-slate-300 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="w-9 h-9 flex items-center justify-center rounded-md absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        aria-label="Clear filter search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sort Select */}
                  <div className="sm:col-span-4 lg:col-span-3">
                    <select
                      aria-label="Sort products"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-md border border-slate-300 bg-white text-base sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="newest">Sort: Newest</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                {/* Collapsible Mobile Category Filter Drawer Toggle */}
                <div className="md:hidden pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen((prev) => !prev)}
                    aria-expanded={mobileFiltersOpen}
                    className="min-h-[44px] flex-1 inline-flex items-center justify-between gap-2 px-3.5 py-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <SlidersHorizontal className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate">
                        Category:{' '}
                        {selectedCategoryId === 'all'
                          ? `All (${products.length})`
                          : categoryMap.get(selectedCategoryId)?.name || 'Selected'}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                        mobileFiltersOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="min-h-[44px] px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 cursor-pointer shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* 1-Click Category Filter Bar (Collapsible on Mobile, Always Open on md+) */}
                <div
                  className={`${
                    mobileFiltersOpen ? 'flex' : 'hidden md:flex'
                  } pt-2.5 md:pt-3 md:border-t border-slate-100 flex-wrap items-center justify-between gap-3`}
                >
                  <div
                    className="flex flex-wrap items-center gap-2"
                    role="group"
                    aria-label="Filter products by category"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId('all');
                        setMobileFiltersOpen(false);
                      }}
                      aria-pressed={selectedCategoryId === 'all'}
                      className={`min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                        selectedCategoryId === 'all'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-blue-400 hover:text-blue-700'
                      }`}
                    >
                      All Categories ({products.length})
                    </button>

                    {categories.map((cat) => {
                      const isActive = selectedCategoryId === cat.id;
                      const count = categoryProductCounts.get(cat.id) || 0;
                      const badge = getCategoryGroupBadge(cat);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategoryId(cat.id);
                            setMobileFiltersOpen(false);
                          }}
                          aria-pressed={isActive}
                          className={`min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-blue-400 hover:text-blue-700'
                          }`}
                        >
                          <span>{cat.name}</span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold leading-none ${
                              isActive ? badge.activeBadgeClass : badge.badgeClass
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}
                              aria-hidden="true"
                            />
                            <span>{badge.label}</span>
                          </span>
                          <span
                            className={
                              isActive ? 'text-blue-100' : 'text-slate-400'
                            }
                          >
                            ({count})
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="hidden md:inline-block text-xs font-semibold text-blue-600 hover:underline cursor-pointer shrink-0"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Products Grid or Clean Empty State */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs">
                  <PackageOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">
                    No products available in this selection
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    {hasActiveFilters
                      ? 'There are currently no published products matching your selected category or search query.'
                      : 'MK Labs has not published digital store products yet. Categories are ready and awaiting official product releases.'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-5 min-h-[44px] px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {filteredProducts.map((product) =>
                    renderProductCard(product)
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* How Manual Orders & Email PDF Delivery Work */}
      <section className="py-10 sm:py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <div>
            <div className="max-w-2xl mb-6 sm:mb-8">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                How Orders Work
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Simple Ordering &amp; Direct Email PDF Delivery
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600">
                Every MK Labs digital PDF product is fulfilled personally after manual payment verification via Payoneer (Preferred), Bank Transfer, Easypaisa, or JazzCash.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-slate-50 p-5 sm:p-6 rounded-lg border border-slate-200 space-y-2.5 sm:space-y-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  1. Place Your Order
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Click Place Order on any product, enter your contact details and email address, and receive your unique Order ID immediately.
                </p>
              </div>

              <div className="bg-slate-50 p-5 sm:p-6 rounded-lg border border-slate-200 space-y-2.5 sm:space-y-3">
                <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  2. Send Manual Payment
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Complete your order using Payoneer (Preferred — request link sent by email), Bank Transfer, Easypaisa, or JazzCash as shown on your confirmation page.
                </p>
              </div>

              <div className="bg-slate-50 p-5 sm:p-6 rounded-lg border border-slate-200 space-y-2.5 sm:space-y-3">
                <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  3. Receive PDF by Email
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Once our team verifies your payment transfer, MK Labs personally delivers your digital PDF product directly to your email inbox.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-5 sm:p-8 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 mb-2">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Order Tracking &amp; Support</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Track Your Orders in Customer Account
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Sign in with your MK Labs account to view order status, payment verification updates, and email delivery records.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="min-h-[44px] px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer text-center"
              >
                Open Customer Account
              </button>
              <a
                href="/#contact"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                  setTimeout(() => {
                    const el = document.getElementById('contact');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors text-center"
              >
                Contact MK Labs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Modal */}
      <ProductDetailModal
        product={activeProduct}
        categoryName={
          activeProduct
            ? categoryMap.get(activeProduct.categoryId)?.name
            : undefined
        }
        subcategoryName={
          activeProduct?.subcategoryId
            ? subcategoryMap.get(activeProduct.subcategoryId)?.name
            : undefined
        }
        isInCart={activeProduct ? isProductInCart(activeProduct.id) : false}
        onClose={() => setActiveProduct(null)}
        onAddToCart={handleAddToCart}
        onPlaceOrder={(prod) => {
          setOrderingFromCart(false);
          setOrderModalItems([{ product: prod, quantity: 1 }]);
          setIsOrderModalOpen(true);
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenFullPage={(slug) => navigate(`/store/product/${slug}`)}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        onClose={() => setIsCartOpen(false)}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onProceedToOrder={() => {
          setIsCartOpen(false);
          setOrderingFromCart(true);
          setOrderModalItems(cartItems);
          setIsOrderModalOpen(true);
        }}
      />

      {/* Place Order Modal */}
      <PlaceOrderModal
        isOpen={isOrderModalOpen}
        items={orderModalItems}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderCreated={(orderIds) => {
          setIsOrderModalOpen(false);
          if (orderingFromCart) {
            handleClearCart();
          }
          if (orderIds.length === 1) {
            navigate(`/store/order/${orderIds[0]}`);
          } else if (orderIds.length > 1) {
            navigate(
              `/store/order/${orderIds[0]}?batch=${encodeURIComponent(
                orderIds.join(',')
              )}`
            );
          }
        }}
      />
    </div>
  );
};
