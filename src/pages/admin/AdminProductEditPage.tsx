import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Mail,
  X,
} from 'lucide-react';
import {
  Category,
  ProductStatus,
  StoreCurrency,
  StoreSubcategory,
} from '../../types/store';
import { StoreApi } from '../../services/api';
import {
  generateNewProductId,
  saveProductAdmin,
} from '../../services/firestoreStore';
import {
  detectNonDirectImageUrlHint,
  filterSubcategoriesByCategory,
  sanitizeSlug,
  validateCoverImageUrl,
  validateProductFormInput,
} from '../../services/productValidation';
import { useRouter } from '../../hooks/useRouter';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

export const AdminProductEditPage: React.FC<{ productId?: string }> = ({
  productId,
}) => {
  const { navigate } = useRouter();
  const { isAdmin } = useAuth();
  const isEditing = Boolean(productId && productId !== 'new');

  const [activeProductId] = useState<string>(() =>
    productId && productId !== 'new' ? productId : generateNewProductId()
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<StoreSubcategory[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Basic Info
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');

  // Optional Cover Image URL
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverLoadedKey, setCoverLoadedKey] = useState<string | null>(null);
  const [coverErrorKey, setCoverErrorKey] = useState<string | null>(null);
  const [coverRetryNonce, setCoverRetryNonce] = useState(0);

  // Optional Local PDF Filename Reminder (for Admin Gmail Delivery — no Storage upload required)
  const [originalFileName, setOriginalFileName] = useState('');

  // Pricing (starts blank on new product)
  const [currency, setCurrency] = useState<StoreCurrency>('PKR');
  const [regularPriceInput, setRegularPriceInput] = useState('');
  const [salePriceInput, setSalePriceInput] = useState('');

  // Additional Info
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [license, setLicense] = useState('');
  const [version, setVersion] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [featured, setFeatured] = useState(false);

  // Publishing
  const [status, setStatus] = useState<ProductStatus>('draft');

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function initData() {
      try {
        setIsLoading(true);
        setErrorMsg('');
        const [catsRes, subsRes] = await Promise.all([
          StoreApi.getAdminCategories(),
          StoreApi.getAdminSubcategories(),
        ]);

        if (cancelled) return;
        const activeCats = catsRes.filter((c) => c.isActive);
        setCategories(activeCats.length > 0 ? activeCats : catsRes);
        setAllSubcategories(subsRes.filter((s) => s.active));

        if (isEditing && productId) {
          const prod = await StoreApi.getAdminProductById(productId);
          if (cancelled) return;
          setName(prod.name);
          setSlug(prod.slug);
          setSlugTouched(true);
          setShortDescription(prod.shortDescription);
          setDescription(prod.description || '');
          setCategoryId(prod.categoryId);
          setSubcategoryId(prod.subcategoryId);
          setCoverImageUrl((prod.coverImageUrl || '').trim());
          setCoverLoadedKey(null);
          setCoverErrorKey(null);
          setCoverRetryNonce(0);
          setOriginalFileName(prod.originalFileName || '');
          setCurrency(prod.currency);
          setRegularPriceInput(String(prod.regularPrice));
          setSalePriceInput(
            typeof prod.salePrice === 'number' ? String(prod.salePrice) : ''
          );
          setFeatures(prod.features || []);
          setLicense(prod.license || '');
          setVersion(prod.version || '');
          setTags(prod.tags || []);
          setFeatured(prod.featured);
          setStatus(prod.status);
        } else if (catsRes.length > 0) {
          const defaultCat = (activeCats[0] || catsRes[0]).id;
          setCategoryId(defaultCat);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : 'Failed to load product configuration.'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void initData();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, productId, isEditing]);

  // Dependent subcategory filtering
  const filteredSubcategories = useMemo(
    () => filterSubcategoriesByCategory(allSubcategories, categoryId),
    [allSubcategories, categoryId]
  );

  // Keep subcategory valid whenever main category changes
  useEffect(() => {
    if (!categoryId) {
      setSubcategoryId('');
      return;
    }
    const stillValid = filteredSubcategories.some(
      (sub) => sub.id === subcategoryId
    );
    if (!stillValid) {
      setSubcategoryId(filteredSubcategories[0]?.id || '');
    }
  }, [categoryId, filteredSubcategories, subcategoryId]);

  const trimmedCoverImageUrl = coverImageUrl.trim();
  const coverSyntaxCheck = useMemo(
    () => validateCoverImageUrl(trimmedCoverImageUrl),
    [trimmedCoverImageUrl]
  );
  const coverPreviewKey =
    trimmedCoverImageUrl && coverSyntaxCheck.valid
      ? `${trimmedCoverImageUrl}::${coverRetryNonce}`
      : '';
  const isCoverLoaded =
    Boolean(coverPreviewKey) && coverLoadedKey === coverPreviewKey;
  const isCoverLoadError =
    Boolean(coverPreviewKey) && coverErrorKey === coverPreviewKey;
  const isCoverLoading =
    Boolean(coverPreviewKey) && !isCoverLoaded && !isCoverLoadError;
  const coverNonDirectHint = useMemo(
    () =>
      trimmedCoverImageUrl
        ? detectNonDirectImageUrlHint(trimmedCoverImageUrl)
        : null,
    [trimmedCoverImageUrl]
  );

  const handleClearCoverImage = () => {
    setCoverImageUrl('');
    setCoverLoadedKey(null);
    setCoverErrorKey(null);
    setCoverRetryNonce(0);
  };

  const handleRetryCoverPreview = () => {
    setCoverLoadedKey(null);
    setCoverErrorKey(null);
    setCoverRetryNonce((n) => n + 1);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugTouched) {
      setSlug(val.trim() ? sanitizeSlug(val) : '');
    }
  };

  // Features list
  const handleAddFeature = () => {
    const trimmed = newFeatureInput.trim();
    if (!trimmed) return;
    if (!features.includes(trimmed) && features.length < 30) {
      setFeatures([...features, trimmed]);
    }
    setNewFeatureInput('');
  };

  // Tags list
  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed) && tags.length < 25) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
  };

  // Save / Publish / Archive
  const handleSave = async (overrideStatus?: ProductStatus) => {
    setErrorMsg('');
    setSaveSuccessMsg('');

    const targetStatus = overrideStatus || status;

    const check = validateProductFormInput({
      name,
      shortDescription,
      description,
      categoryId,
      subcategoryId,
      subcategories: allSubcategories,
      coverImageUrl,
      currency,
      regularPriceInput,
      salePriceInput,
      license,
      version,
    });

    if (!check.valid || check.regularPrice === undefined) {
      setErrorMsg(check.error || 'Please review required product fields.');
      return;
    }

    try {
      setIsSaving(true);
      const saved = await saveProductAdmin(
        {
          id: activeProductId,
          name: name.trim(),
          slug: slug.trim() || name.trim(),
          shortDescription: shortDescription.trim(),
          description: description.trim() || undefined,
          categoryId,
          subcategoryId,
          coverImageUrl: coverImageUrl.trim() || undefined,
          originalFileName: originalFileName.trim() || undefined,
          currency,
          regularPrice: check.regularPrice,
          salePrice: check.salePrice,
          features,
          license: license.trim() || undefined,
          version: version.trim() || undefined,
          tags,
          featured,
          status: targetStatus,
        },
        isEditing
      );

      setStatus(saved.status);
      setSlug(saved.slug);
      setCoverImageUrl(saved.coverImageUrl || '');
      setSaveSuccessMsg(
        saved.status === 'published'
          ? `Product "${saved.name}" published successfully.`
          : saved.status === 'archived'
          ? `Product "${saved.name}" archived.`
          : `Product "${saved.name}" saved as draft.`
      );

      setTimeout(() => {
        navigate('/admin/products');
      }, 900);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to save product.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout currentTab={isEditing ? 'products' : 'products-new'}>
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <span className="text-sm">Loading product editor...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentTab={isEditing ? 'products' : 'products-new'}>
      <div className="space-y-7 max-w-4xl mx-auto pb-20">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-start sm:items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="w-10 h-10 sm:w-auto sm:h-auto sm:p-1.5 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              aria-label="Back to Products"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 break-words">
                {isEditing ? `Edit Product: ${name || 'Untitled'}` : 'Add Digital Product'}
              </h1>
              <span className="text-xs text-slate-500 block mt-0.5">
                Product metadata is saved in Cloud Firestore. Deliverable PDFs are attached manually via Gmail after payment verification.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSave('draft')}
              disabled={isSaving}
              className="min-h-[44px] sm:min-h-0 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => void handleSave('published')}
              disabled={isSaving}
              className="min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isSaving
                  ? 'Saving...'
                  : status === 'published'
                  ? 'Update & Publish'
                  : 'Publish Product'}
              </span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="break-words">{errorMsg}</span>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* 1. Basic Info */}
        <section className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Basic Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter official product name"
                maxLength={160}
                className="w-full min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-md border border-slate-300 text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                URL Slug (auto-deduplicated)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="product-url-slug"
                maxLength={160}
                className="w-full min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-md border border-slate-300 text-base sm:text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Short Description *
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Concise summary displayed on store product cards"
              maxLength={400}
              className="w-full min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed overview, use cases, and what customers will receive via email..."
              maxLength={10000}
              className="w-full px-3.5 py-2.5 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Dependent Category & Subcategory Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Main Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="">Select Main Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Subcategory *
              </label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={!categoryId || filteredSubcategories.length === 0}
                className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 bg-white focus:outline-none focus:border-blue-600 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
              >
                {filteredSubcategories.length === 0 ? (
                  <option value="">No subcategories found for category</option>
                ) : (
                  filteredSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Optional Cover Image URL */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="product-cover-image-url"
                className="block text-xs font-semibold text-slate-700 uppercase"
              >
                Cover Image URL (Optional)
              </label>
              {coverImageUrl.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCoverImage}
                  className="inline-flex items-center gap-1 min-h-[36px] sm:min-h-0 px-2.5 py-1 rounded text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove Image</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-7 space-y-2">
                <input
                  id="product-cover-image-url"
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => {
                    setCoverImageUrl(e.target.value);
                  }}
                  onBlur={() => {
                    const trimmed = coverImageUrl.trim();
                    if (trimmed !== coverImageUrl) {
                      setCoverImageUrl(trimmed);
                    }
                  }}
                  placeholder="https://cdn.example.com/product-cover.webp"
                  maxLength={1000}
                  className="w-full min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Paste a direct public HTTPS image URL (JPG, JPEG, PNG, WEBP, GIF, or public CDN image endpoint). Leave blank to display the default Digital PDF card preview.
                </p>

                {trimmedCoverImageUrl && !coverSyntaxCheck.valid && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{coverSyntaxCheck.error}</span>
                  </div>
                )}

                {coverSyntaxCheck.valid && coverSyntaxCheck.warning && (
                  <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{coverSyntaxCheck.warning}</span>
                  </div>
                )}

                {isCoverLoadError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 leading-relaxed">
                        <p className="font-semibold text-red-900">
                          Image failed to load from this URL
                        </p>
                        <p>
                          {coverNonDirectHint ||
                            'The browser could not load an image from this link. Make sure it is a direct public image file (not a webpage/viewer), allows external embedding/hotlinking without login, and is reachable over HTTPS.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-6">
                      <button
                        type="button"
                        onClick={handleRetryCoverPreview}
                        className="inline-flex items-center gap-1 min-h-[36px] sm:min-h-0 px-2.5 py-1 rounded bg-white border border-red-200 text-red-800 hover:bg-red-100 text-[11px] font-semibold cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearCoverImage}
                        className="inline-flex items-center gap-1 min-h-[36px] sm:min-h-0 px-2.5 py-1 rounded bg-white border border-red-200 text-red-800 hover:bg-red-100 text-[11px] font-semibold cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Clear URL</span>
                      </button>
                    </div>
                  </div>
                )}

                {isCoverLoaded && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Cover image preview verified</span>
                  </div>
                )}
              </div>

              {/* Live Storefront Aspect Preview */}
              <div className="md:col-span-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                  <div className="aspect-[16/10] w-full relative flex items-center justify-center bg-slate-100 overflow-hidden">
                    {!trimmedCoverImageUrl ? (
                      <div className="px-4 text-center space-y-1.5 text-slate-400">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <p className="text-[11px] font-medium text-slate-500">
                          No cover image set
                        </p>
                      </div>
                    ) : !coverSyntaxCheck.valid ? (
                      <div className="px-4 text-center space-y-1.5 text-red-600">
                        <AlertCircle className="w-6 h-6 mx-auto" />
                        <p className="text-[11px] font-semibold">
                          Invalid image URL format
                        </p>
                      </div>
                    ) : isCoverLoadError ? (
                      <div className="px-4 text-center space-y-1.5 text-red-600">
                        <AlertCircle className="w-6 h-6 mx-auto" />
                        <p className="text-[11px] font-semibold">
                          Preview unavailable
                        </p>
                        <p className="text-[10px] text-red-500">
                          Storefront falls back to Digital PDF placeholder
                        </p>
                      </div>
                    ) : (
                      <>
                        <img
                          key={coverPreviewKey}
                          src={trimmedCoverImageUrl}
                          alt={name || 'Product cover preview'}
                          referrerPolicy="no-referrer"
                          onLoad={() => setCoverLoadedKey(coverPreviewKey)}
                          onError={() => setCoverErrorKey(coverPreviewKey)}
                          className={`w-full h-full object-cover transition-opacity duration-200 ${
                            isCoverLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        {isCoverLoading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500">
                            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                            <span className="text-[11px] font-medium">
                              Loading preview...
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="px-3 py-1.5 bg-white border-t border-slate-200 flex items-center justify-between text-[10px] font-medium text-slate-500">
                    <span>Storefront Cover Preview</span>
                    <span>16:10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Email PDF Delivery Reference */}
        <section className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Email PDF Delivery Reference (Optional)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                No PDF upload is needed. Keep your deliverable PDF safely on your own computer and attach it manually in Gmail when fulfilling verified orders.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 self-start sm:self-auto shrink-0">
              <Mail className="w-3 h-3" />
              <span>Manual Email Delivery</span>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Local PDF Filename Reminder (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={originalFileName}
                onChange={(e) => setOriginalFileName(e.target.value)}
                placeholder="e.g. MK-Labs-Freelance-Proposal-Kit.pdf"
                maxLength={255}
                className="w-full min-h-[44px] sm:min-h-0 pl-9 pr-3.5 py-2 rounded-md border border-slate-300 text-base sm:text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Displayed inside the Admin Orders &amp; Delivery panel so you know which PDF file on your computer to attach to the customer&apos;s email.
            </p>
          </div>
        </section>

        {/* 3. Pricing */}
        <section className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Pricing</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Currency *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as StoreCurrency)}
                className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="PKR">PKR (Pakistani Rupee)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Regular Price *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={regularPriceInput}
                onChange={(e) => setRegularPriceInput(e.target.value)}
                placeholder={currency === 'PKR' ? 'e.g. 2500' : 'e.g. 19.00'}
                className="w-full min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-md border border-slate-300 text-base sm:text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Sale Price (Optional, &lt; Regular)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={salePriceInput}
                onChange={(e) => setSalePriceInput(e.target.value)}
                placeholder="Optional discounted price"
                className="w-full min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </section>

        {/* 4. Additional Info */}
        <section className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Additional Details &amp; Publishing</span>
          </h2>

          {/* Features Multi-Entry */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
              Product Features
            </label>
            <div className="flex flex-col min-[420px]:flex-row gap-2 mb-2.5">
              <input
                type="text"
                value={newFeatureInput}
                onChange={(e) => setNewFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Add a key feature bullet and press Enter or Add"
                className="flex-1 min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded border border-slate-300 text-base sm:text-xs"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="min-h-[44px] sm:min-h-0 px-3.5 py-2 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold cursor-pointer shrink-0"
              >
                Add Feature
              </button>
            </div>
            {features.length > 0 && (
              <ul className="space-y-1.5">
                {features.map((feat, idx) => (
                  <li
                    key={`${feat}-${idx}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 sm:py-1.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  >
                    <span className="min-w-0 break-words">{feat}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFeatures(features.filter((_, i) => i !== idx))
                      }
                      className="w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
                      aria-label="Remove feature"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                License Information
              </label>
              <input
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="e.g. Single User Commercial License"
                maxLength={1000}
                className="w-full min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Version (Optional)
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0"
                maxLength={64}
                className="w-full min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
              Tags (Optional)
            </label>
            <div className="flex flex-col min-[420px]:flex-row gap-2 mb-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag keyword and press Add"
                className="flex-1 min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded border border-slate-300 text-base sm:text-xs"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="min-h-[44px] sm:min-h-0 px-3.5 py-2 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold cursor-pointer shrink-0"
              >
                Add Tag
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 sm:py-0.5 rounded border border-slate-200"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="text-slate-400 hover:text-red-600 cursor-pointer px-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Featured & Publishing Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 items-center">
            <label className="flex items-center gap-2.5 min-h-[44px] sm:min-h-0 text-xs font-semibold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span>Feature this product on the Digital Store</span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Product Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="draft">Draft (Hidden from Store)</option>
                <option value="published">Published (Visible in Store)</option>
                <option value="archived">Archived (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap sm:items-center sm:justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving Product...' : 'Save Product'}
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};
