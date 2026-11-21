import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Mail,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Tag as TagIcon,
  ShoppingBag,
} from 'lucide-react';
import {
  DigitalProduct,
  StoreProductRecord,
  formatProductPrice,
  formatFileSize,
  getEffectiveProductPrice,
} from '../types/store';
import { StoreApi } from '../services/api';
import { useRouter } from '../hooks/useRouter';
import { PlaceOrderModal } from '../components/store/PlaceOrderModal';

function toStoreProductRecord(p: DigitalProduct): StoreProductRecord {
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

export const ProductDetailPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { navigate } = useRouter();
  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setIsLoading(true);
        setError(null);
        setImgError(false);
        const data = await StoreApi.getProductBySlug(slug);
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Product not found');
      } finally {
        setIsLoading(false);
      }
    }
    void loadProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-36 pb-20 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <span className="text-sm text-slate-500">Loading product details...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-14 sm:pt-36 sm:pb-20">
        <div className="max-w-xl mx-auto px-4 text-center bg-white p-6 sm:p-10 rounded-lg border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">
            Product Unavailable
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {error ||
              'The requested digital product could not be found or is not published.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/store')}
            className="mt-6 min-h-[44px] px-5 py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-blue-700 cursor-pointer"
          >
            ← Back to Store
          </button>
        </div>
      </div>
    );
  }

  const effectivePrice = getEffectiveProductPrice({
    regularPrice: product.displayPrice,
    salePrice: product.salePrice,
  });
  const hasSale =
    typeof product.salePrice === 'number' &&
    product.salePrice < product.displayPrice;

  const productRecord = toStoreProductRecord(product);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-14 sm:pt-28 sm:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('/store')}
            className="min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Digital Store</span>
          </button>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 max-w-full">
            <span className="truncate">{product.categories?.[0]?.name || 'Digital Store'}</span>
            {product.subcategoryName && (
              <>
                <span>/</span>
                <span className="text-slate-700 font-semibold truncate">
                  {product.subcategoryName}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Left Column: Cover Image, Description & Features */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-8 min-w-0">
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
              <div className="h-56 sm:h-96 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                {product.coverImage?.publicUrl && !imgError ? (
                  <img
                    src={product.coverImage.publicUrl}
                    alt={product.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FileText className="w-16 h-16 mb-2" />
                    <span className="text-xs font-medium">
                      MK Labs Digital PDF Product
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-8 rounded-lg border border-slate-200 shadow-xs space-y-5 sm:space-y-6">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 break-words">
                  {product.name}
                </h1>
                <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  {product.shortDescription}
                </p>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                  <TagIcon className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  {product.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {product.description && (
                <div className="pt-4 border-t border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                    About this Product
                  </h2>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </div>
                </div>
              )}

              {product.features && product.features.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Key Features
                  </h2>
                  <ul className="space-y-2.5">
                    {product.features.map((feat, idx) => (
                      <li
                        key={`${feat}-${idx}`}
                        className="flex items-start gap-2.5 text-sm text-slate-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing, Place Order CTA, Deliverable Specs & License */}
          <div className="lg:col-span-4 space-y-6 min-w-0">
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-xs space-y-4 sm:space-y-5 lg:sticky lg:top-24">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Price
                </span>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-2xl font-bold text-slate-900">
                    {formatProductPrice(effectivePrice, product.currency)}
                  </span>
                  {hasSale && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatProductPrice(product.displayPrice, product.currency)}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOrderModalOpen(true)}
                className="w-full min-h-[44px] py-3 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Place Order</span>
              </button>

              <div className="p-3.5 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Pay via Payoneer (Preferred), Bank Transfer, Easypaisa, or JazzCash. Once verified, MK Labs will send your PDF product directly to your email address.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                <div className="flex justify-between gap-2 py-1 border-b border-slate-50">
                  <span className="text-slate-500 shrink-0">Category</span>
                  <span className="font-semibold text-slate-900 text-right min-w-0 break-words">
                    {product.categories?.[0]?.name || '—'}
                  </span>
                </div>
                <div className="flex justify-between gap-2 py-1 border-b border-slate-50">
                  <span className="text-slate-500 shrink-0">Subcategory</span>
                  <span className="font-semibold text-slate-900 text-right min-w-0 break-words">
                    {product.subcategoryName || '—'}
                  </span>
                </div>
                <div className="flex justify-between gap-2 py-1 border-b border-slate-50">
                  <span className="text-slate-500 shrink-0">Delivery Format</span>
                  <span className="font-semibold text-slate-900 text-right min-w-0 break-words">
                    Digital PDF (Email Delivery)
                    {product.fileSize ? ` · ${formatFileSize(product.fileSize)}` : ''}
                  </span>
                </div>
                {product.version && (
                  <div className="flex justify-between gap-2 py-1 border-b border-slate-50">
                    <span className="text-slate-500 shrink-0">Version</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {product.version}
                    </span>
                  </div>
                )}
                {product.licenseInformation && (
                  <div className="flex justify-between py-1 border-b border-slate-50 gap-2">
                    <span className="text-slate-500 shrink-0">License</span>
                    <span
                      className="font-semibold text-slate-900 text-right min-w-0 break-words"
                      title={product.licenseInformation}
                    >
                      {product.licenseInformation}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Updated</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(product.updatedAt).getTime() > 0
                      ? new Date(product.updatedAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Official MK Labs digital product · Manual verification &amp; direct email delivery.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PlaceOrderModal
        isOpen={isOrderModalOpen}
        items={[{ product: productRecord, quantity: 1 }]}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderCreated={(orderIds) => {
          setIsOrderModalOpen(false);
          if (orderIds.length > 0) {
            navigate(`/store/order/${orderIds[0]}`);
          }
        }}
      />
    </div>
  );
};
