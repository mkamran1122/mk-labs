import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  FileText,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import {
  DigitalProduct,
  Category,
  formatProductPrice,
  getEffectiveProductPrice,
} from '../types/store';
import { StoreApi } from '../services/api';
import { getCategoryGroupBadge } from '../config/storeCatalog';
import { useRouter } from '../hooks/useRouter';

export const StoreCataloguePage: React.FC<{ categorySlug?: string }> = ({
  categorySlug,
}) => {
  const { navigate, search } = useRouter();

  const queryParams = new URLSearchParams(search);
  const initialSearch = queryParams.get('q') || '';

  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categorySlug || ''
  );
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'alphabetical' | 'price_asc' | 'price_desc'
  >('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [unavailableMsg, setUnavailableMsg] = useState<string | null>(null);
  const [failedImgIds, setFailedImgIds] = useState<Record<string, boolean>>({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    StoreApi.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setSelectedCategory(categorySlug || '');
  }, [categorySlug]);

  useEffect(() => {
    const q = new URLSearchParams(search).get('q') || '';
    setSearchQuery(q);
  }, [search]);

  useEffect(() => {
    async function fetchCatalogue() {
      try {
        setIsLoading(true);
        setUnavailableMsg(null);
        const res = await StoreApi.getProducts({
          category: selectedCategory || undefined,
          search: searchQuery || undefined,
          sort:
            sortBy === 'oldest' || sortBy === 'alphabetical'
              ? sortBy
              : undefined,
        });
        setProducts(res.products);
        setTotalCount(res.total);
      } catch (err) {
        setUnavailableMsg(
          err instanceof Error
            ? err.message
            : 'Store catalogue is temporarily unavailable.'
        );
        setProducts([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchCatalogue();
  }, [selectedCategory, searchQuery, sortBy]);

  const sortedProducts = useMemo(() => {
    if (sortBy === 'price_asc') {
      return [...products].sort(
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
    }
    if (sortBy === 'price_desc') {
      return [...products].sort(
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
    }
    return products;
  }, [products, sortBy]);

  const activeCategoryObject = categories.find(
    (c) => c.slug === selectedCategory
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-14 sm:pt-28 sm:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Breadcrumbs & Title */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <button
              type="button"
              onClick={() => navigate('/store')}
              className="hover:text-blue-600 cursor-pointer py-1"
            >
              Store
            </button>
            <span>/</span>
            <span className="text-slate-800 font-medium truncate">
              {activeCategoryObject ? activeCategoryObject.name : 'All Products'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {activeCategoryObject
                  ? activeCategoryObject.name
                  : 'Digital Products Catalogue'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {activeCategoryObject
                  ? activeCategoryObject.description
                  : `Browse all ${totalCount} published MK Labs digital PDF products.`}
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Showing {sortedProducts.length} of {totalCount} items
            </span>
          </div>
        </div>

        {/* Filter & Search Bar (Category-Only + Search & Sort) */}
        <div className="bg-white p-3.5 sm:p-5 rounded-lg border border-slate-200 shadow-xs mb-6 sm:mb-8 space-y-3.5 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 items-center">
            <div className="sm:col-span-8 lg:col-span-9 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search published products by title, keyword, or tag..."
                className="w-full min-h-[44px] pl-9 pr-9 py-2 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="w-9 h-9 flex items-center justify-center rounded-md absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="sm:col-span-4 lg:col-span-3">
              <select
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | 'newest'
                      | 'oldest'
                      | 'alphabetical'
                      | 'price_asc'
                      | 'price_desc'
                  )
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-md border border-slate-300 text-base sm:text-sm text-slate-800 bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="alphabetical">Sort: A–Z</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Mobile Expandable Category Filter Trigger */}
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
                  {activeCategoryObject
                    ? activeCategoryObject.name
                    : 'All Categories'}
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                  mobileFiltersOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {(selectedCategory !== '' || searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  navigate('/store/search');
                }}
                className="min-h-[44px] px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 cursor-pointer shrink-0"
              >
                Reset
              </button>
            )}
          </div>

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
                  setSelectedCategory('');
                  setMobileFiltersOpen(false);
                  navigate('/store/search');
                }}
                aria-pressed={selectedCategory === ''}
                className={`min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === ''
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-blue-400 hover:text-blue-700'
                }`}
              >
                All Categories (
                {categories.reduce((acc, c) => acc + (c.productCount || 0), 0)})
              </button>

              {categories.map((c) => {
                const isActive =
                  selectedCategory === c.slug || selectedCategory === c.id;
                const badge = getCategoryGroupBadge(c);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c.slug);
                      setMobileFiltersOpen(false);
                      navigate(`/store/category/${c.slug}`);
                    }}
                    aria-pressed={isActive}
                    className={`min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-blue-400 hover:text-blue-700'
                    }`}
                  >
                    <span>{c.name}</span>
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
                      className={isActive ? 'text-blue-100' : 'text-slate-400'}
                    >
                      ({c.productCount || 0})
                    </span>
                  </button>
                );
              })}
            </div>

            {(selectedCategory !== '' || searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  navigate('/store/search');
                }}
                className="hidden md:inline-block text-xs font-semibold text-blue-600 hover:underline cursor-pointer shrink-0"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Product Cards Grid */}
        {isLoading ? (
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <span className="text-sm">Loading store products...</span>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {unavailableMsg
                ? 'Store Catalogue Temporarily Unavailable'
                : 'No matching products found'}
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              {unavailableMsg ||
                'No published products match your selected category or search query.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                navigate('/store/search');
              }}
              className="mt-4 min-h-[44px] px-5 py-2.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[375px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {sortedProducts.map((prod) => {
              const effectivePrice = getEffectiveProductPrice({
                regularPrice: prod.displayPrice,
                salePrice: prod.salePrice,
              });
              const hasSale =
                typeof prod.salePrice === 'number' &&
                prod.salePrice < prod.displayPrice;

              return (
                <div
                  key={prod.id}
                  onClick={() => navigate(`/store/product/${prod.slug}`)}
                  className="group bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="h-32 min-[375px]:h-36 sm:h-48 bg-slate-100 overflow-hidden relative">
                      {prod.coverImage?.publicUrl && !failedImgIds[prod.id] ? (
                        <img
                          src={prod.coverImage.publicUrl}
                          alt={prod.name}
                          onError={() =>
                            setFailedImgIds((prev) => ({
                              ...prev,
                              [prod.id]: true,
                            }))
                          }
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                          <FileText className="w-9 h-9 sm:w-10 sm:h-10" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex items-center gap-1 sm:gap-1.5">
                        <span className="text-[9px] sm:text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded border border-blue-200">
                          PDF Product
                        </span>
                        {prod.isFeatured && (
                          <span className="text-[9px] sm:text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded border border-amber-200">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 sm:p-5">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1 gap-1.5">
                        <span className="truncate">
                          {prod.categories?.[0]?.name || 'Digital Store'}
                          {prod.subcategoryName ? ` · ${prod.subcategoryName}` : ''}
                        </span>
                        {prod.version && <span className="shrink-0">v{prod.version}</span>}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 sm:line-clamp-1">
                        {prod.name}
                      </h3>

                      <p className="mt-1.5 sm:mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {prod.shortDescription}
                      </p>

                      {prod.tags && prod.tags.length > 0 && (
                        <div className="mt-2.5 sm:mt-3 hidden sm:flex flex-wrap gap-1">
                          {prod.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 sm:p-5 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                    <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {formatProductPrice(effectivePrice, prod.currency)}
                      </span>
                      {hasSale && (
                        <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">
                          {formatProductPrice(prod.displayPrice, prod.currency)}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0 text-[11px] sm:text-xs">
                      View →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
