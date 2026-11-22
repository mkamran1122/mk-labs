import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShoppingCart,
  ShoppingBag,
  FileText,
  ShieldCheck,
  Tag as TagIcon,
  Mail,
  ArrowUpRight,
} from 'lucide-react';
import { StoreProductRecord, formatFileSize } from '../../types/store';
import {
  StoreProductPreview,
  getEffectiveProductPrice,
  formatProductPrice,
} from './StoreVisuals';

interface ProductDetailModalProps {
  product: StoreProductRecord | null;
  categoryName?: string;
  subcategoryName?: string;
  isInCart: boolean;
  onClose: () => void;
  onAddToCart: (product: StoreProductRecord) => void;
  onPlaceOrder: (product: StoreProductRecord) => void;
  onOpenCart: () => void;
  onOpenFullPage?: (slug: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  categoryName,
  subcategoryName,
  isInCart,
  onClose,
  onAddToCart,
  onPlaceOrder,
  onOpenCart,
  onOpenFullPage,
}) => {
  useEffect(() => {
    if (!product) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [product, onClose]);

  if (!product) return null;

  const effectivePrice = getEffectiveProductPrice(product);
  const hasSale =
    typeof product.salePrice === 'number' &&
    product.salePrice < product.regularPrice;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-7 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
              {categoryName && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {categoryName}
                </span>
              )}
              {subcategoryName && (
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {subcategoryName}
                </span>
              )}
            </div>
            <h2
              id="product-modal-title"
              className="text-base sm:text-xl font-bold text-slate-900 truncate"
            >
              {product.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 flex items-center justify-center -mr-1.5"
            aria-label="Close product details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-7 space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* Preview Media */}
            <div className="lg:col-span-7 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
              <StoreProductPreview
                product={product}
                categoryId={product.categoryId}
              />
            </div>

            {/* Pricing & Action Box */}
            <div className="lg:col-span-5 bg-slate-50 p-4 sm:p-5 rounded-lg border border-slate-200 space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Price
                </span>
                <div className="mt-1.5 flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-2xl font-bold text-slate-900">
                    {formatProductPrice(effectivePrice, product.currency)}
                  </span>
                  {hasSale && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatProductPrice(product.regularPrice, product.currency)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-200/80">
                {categoryName && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Category</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {categoryName}
                    </span>
                  </div>
                )}
                {subcategoryName && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Subcategory</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {subcategoryName}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Delivery Format</span>
                  <span className="font-semibold text-slate-900 text-right min-w-0 break-words">
                    Digital PDF · Email Delivery
                    {product.fileSize ? ` (${formatFileSize(product.fileSize)})` : ''}
                  </span>
                </div>
                {product.version && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Version</span>
                    <span className="font-semibold text-slate-900">
                      {product.version}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPlaceOrder(product);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Place Order</span>
                </button>

                {isInCart ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCart();
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>In Cart — Open Shopping Cart</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAddToCart(product);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                )}

                {onOpenFullPage && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFullPage(product.slug);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Full Product Page</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="p-3 rounded-md bg-white border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Manual payment via Payoneer (Preferred), Bank Transfer, Easypaisa, or JazzCash. Verified orders are delivered directly to your email as a PDF attachment.
                </span>
              </div>
            </div>
          </div>

          {/* Full Description & Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Description
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {product.description || product.shortDescription}
                </p>
              </div>

              {product.features && product.features.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Key Features
                  </h3>
                  <ul className="space-y-2">
                    {product.features.map((feat, idx) => (
                      <li
                        key={`${feat}-${idx}`}
                        className="flex items-start gap-2 text-xs text-slate-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Email PDF Delivery</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Place an order to receive payment instructions and a unique Order ID. After payment verification, MK Labs manually emails your Digital PDF directly to your inbox.
                </p>
              </div>

              {product.license && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-slate-600" />
                    <span>License</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {product.license}
                  </p>
                </div>
              )}

              {product.tags && product.tags.length > 0 && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <TagIcon className="w-4 h-4 text-slate-600" />
                    <span>Tags</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
