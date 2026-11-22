import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, X, RefreshCw, Eye } from 'lucide-react';
import {
  DigitalProduct,
  Category,
  StoreSubcategory,
  StoreProductRecord,
  formatProductPrice,
  getEffectiveProductPrice,
} from '../types/store';
import { StoreApi } from '../services/api';
import { StoreProductPreview } from '../components/store/StoreVisuals';
import { useRouter } from '../hooks/useRouter';

type CatalogueSortOption = 'newest' | 'price_asc' | 'price_desc';

function toPreviewRecord(p: DigitalProduct): StoreProductRecord {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    description: p.description,
    categoryId: p.categoryIds[0] || '',
    subcategoryId: p.subcategoryId || '',
    coverImagePath: p.coverImagePath,
    coverImageUrl: p.coverImageUrl || p.coverImage?.publicUrl,
    pdfStoragePath: p.pdfStoragePath,
    originalFileName: p.originalFileName,
    fileSize: p.fileSize,
    mimeType: p.mimeType,
    currency: p.currency,
    regularPrice: p.displayPrice,
    salePrice: p.salePrice,
    features: p.features,
    license: p.licenseInformation,
    version: p.version,
    tags: p.tags,
    featured: p.isFeatured,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    createdBy: p.createdBy || '',
  };
}

export const StoreCataloguePage: React.FC<{ categorySlug?: string }> = ({
  categorySlug,
}) => {
  const { navigate, search } = useRouter();

  const queryParams = new URLSearchParams(search);
  const initialSearch = queryParams.get('q') || '';

  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<StoreSubcategory[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categorySlug || ''
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<CatalogueSortOption>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [unavailableMsg, setUnavailableMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([StoreApi.getCategories(), StoreApi.getSubcategories()])
      .then(([cats, subs]) => {
        setCategories(cats);
        setSubcategories(subs);
      })
      .catch(() => {
        setCategories([]);
        setSubcategories([]);
      });
  }, []);

  useEffect(() => {
    setSelectedCategory(categorySlug || '');
    setSelectedSubcategory('');
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
          subcategory: selectedSubcategory || undefined,
          search: searchQuery || undefined,
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
  }, [selectedCategory, selectedSubcategory, searchQuery]);

  const activeCategoryObject = useMemo(
    () =>
      categories.find(
        (c) => c.slug === selectedCategory || c.id === selectedCategory
      ),
    [categories, selectedCategory]
  );

  const availableSubcategories = useMemo(() => {
    if (!activeCategoryObject) {
      return subcategories;
    }
    return subcategories.filter(
      (s) => s.categoryId === activeCategoryObject.id
    );
  }, [subcategories, activeCategoryObject]);

  const subcategoriesByCategory = useMemo(() => {
    const grouped = new Map<string, StoreSubcategory[]>();
    for (const sub of subcategories) {
      const list = grouped.get(sub.categoryId) || [];
      list.push(sub);
      grouped.set(sub.categoryId, list);
    }
    return grouped;
  }, [subcategories]);

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
    return [...products].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [products, sortBy]);

  const handleCategoryChange = (nextSlug: string) => {
    setSelectedCategory(nextSlug);
    setSelectedSubcategory('');
    if (nextSlug) {
      navigate(`/store/category/${nextSlug}`);
    } else {
      navigate('/store/search');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSortBy('newest');
    if (categorySlug) {
      navigate('/store/search');
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== '' ||
    selectedSubcategory !== '' ||
    sortBy !== 'newest';

  const activeSubcategoryObject = subcategories.find(
    (s) => s.id === selectedSubcategory
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
                {activeSubcategoryObject
                  ? `Filtered by ${activeSubcategoryObject.name}`
                  : activeCategoryObject
                  ? activeCategoryObject.description
                  : `Browse all ${totalCount} published MK Labs digital products.`}
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-500 tabular-nums">
              Showing {sortedProducts.length} of {totalCount} items
            </span>
          </div>
        </div>

        {/* Compact Filter Toolbar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 items-center">
            <div className="sm:col-span-2 lg:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                aria-label="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full min-h-[44px] sm:min-h-[42px] pl-9 pr-9 py-2 rounded-lg border border-slate-300 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
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

            <div className="lg:col-span-3">
              <select
                aria-label="Filter by category"
                value={activeCategoryObject?.slug || selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full min-h-[44px] sm:min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 text-base sm:text-sm text-slate-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <select
                aria-label="Filter by subcategory"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full min-h-[44px] sm:min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 text-base sm:text-sm text-slate-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="">All Subcategories</option>
                {!activeCategoryObject
                  ? categories.map((cat) => {
                      const subs = subcategoriesByCategory.get(cat.id) || [];
                      if (subs.length === 0) return null;
                      return (
                        <optgroup key={cat.id} label={cat.name}>
                          {subs.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })
                  : availableSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <select
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as CatalogueSortOption)
                }
                className="w-full min-h-[44px] sm:min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 text-base sm:text-sm text-slate-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">
                Filters applied
                {activeCategoryObject ? ` · ${activeCategoryObject.name}` : ''}
                {activeSubcategoryObject
                  ? ` · ${activeSubcategoryObject.name}`
                  : ''}
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="min-h-[38px] sm:min-h-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        {isLoading ? (
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <span className="text-sm">Loading store products...</span>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {unavailableMsg
                ? 'Store Catalogue Temporarily Unavailable'
                : 'No matching products found'}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              {unavailableMsg ||
                'No published products match your selected filters or search query.'}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 min-h-[44px] px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {sortedProducts.map((prod) => {
              const effectivePrice = getEffectiveProductPrice({
                regularPrice: prod.displayPrice,
                salePrice: prod.salePrice,
              });
              const hasSale =
                typeof prod.salePrice === 'number' &&
                prod.salePrice < prod.displayPrice;
              const previewRecord = toPreviewRecord(prod);

              return (
                <article
                  key={prod.id}
                  onClick={() => navigate(`/store/product/${prod.slug}`)}
                  className="group bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full cursor-pointer"
                >
                  <StoreProductPreview
                    product={previewRecord}
                    categoryId={prod.categoryIds[0]}
                    compact
                  />

                  <div className="flex-1 flex flex-col p-5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 min-w-0 mb-1.5">
                      <span className="truncate text-blue-700/90">
                        {prod.categories?.[0]?.name || 'Digital Store'}
                      </span>
                      {prod.subcategoryName && (
                        <>
                          <span
                            aria-hidden="true"
                            className="text-slate-300 shrink-0"
                          >
                            /
                          </span>
                          <span className="truncate text-slate-500">
                            {prod.subcategoryName}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-[17px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                      {prod.name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      {prod.shortDescription}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg font-bold text-slate-900 tabular-nums tracking-tight">
                          {formatProductPrice(effectivePrice, prod.currency)}
                        </span>
                        {hasSale && (
                          <span className="text-xs font-medium text-slate-400 line-through tabular-nums">
                            {formatProductPrice(
                              prod.displayPrice,
                              prod.currency
                            )}
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white text-slate-700 text-xs font-semibold transition-colors shrink-0">
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>View Details</span>
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
