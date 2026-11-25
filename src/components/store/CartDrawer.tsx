import React, { useEffect, useState } from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Lock,
  FileText,
  Mail,
} from 'lucide-react';
import { StoreProductRecord } from '../../types/store';
import { useCurrency } from '../../context/CurrencyContext';
import {
  getEffectiveProductPrice,
  formatProductPrice,
} from './StoreVisuals';

export interface CartEntry {
  product: StoreProductRecord;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  items: CartEntry[];
  onClose: () => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToOrder: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  onClose,
  onRemoveItem,
  onClearCart,
  onProceedToOrder,
}) => {
  const {
    selectedCurrency,
    convertPrice,
    convertNumericAmount,
    formatCurrency,
  } = useCurrency();
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group subtotals cleanly per currency (USD / PKR)
  const totalsByCurrency = items.reduce<Record<string, number>>((acc, entry) => {
    const cur = entry.product.currency === 'PKR' ? 'PKR' : 'USD';
    const lineTotal =
      getEffectiveProductPrice(entry.product) * entry.quantity;
    acc[cur] = (acc[cur] || 0) + lineTotal;
    return acc;
  }, {});

  const currencyTotalsList = Object.entries(totalsByCurrency);

  // Compute unified estimated total in selected display currency when applicable
  let estimatedTotal = 0;
  let allConvertible = currencyTotalsList.length > 0;
  let anyCurrencyDiffers = false;

  for (const [cur, amt] of currencyTotalsList) {
    if (cur !== selectedCurrency) {
      anyCurrencyDiffers = true;
    }
    const res = convertNumericAmount(amt, cur);
    if (cur !== selectedCurrency && !res.converted) {
      allConvertible = false;
      break;
    }
    estimatedTotal += res.amount;
  }

  const showEstimatedTotal = anyCurrencyDiffers && allConvertible;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white h-dvh border-l border-slate-200 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingCart className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">
                Shopping Cart ({items.length})
              </h2>
              <span className="text-[11px] text-slate-500 block">
                MK Labs Digital Store
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center shrink-0 -mr-1.5"
            aria-label="Close shopping cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="py-14 sm:py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Your cart is empty
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Browse categories and published digital PDF products to add items to your cart.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Digital PDF products delivered via email after verification.</span>
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-slate-500 hover:text-red-600 font-medium cursor-pointer shrink-0 ml-2"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-3">
                {items.map(({ product, quantity }) => {
                  const unitPrice = getEffectiveProductPrice(product);
                  const lineTotal = unitPrice * quantity;
                  const lineConverted = convertPrice(lineTotal, product.currency);
                  return (
                    <div
                      key={product.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-md border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0 text-blue-600">
                        {(() => {
                          const thumbUrl = (product.coverImageUrl || '').trim();
                          const thumbKey = `${product.id}:${thumbUrl}`;
                          return thumbUrl && !failedThumbIds[thumbKey] ? (
                            <img
                              src={thumbUrl}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedThumbIds((prev) => ({
                                  ...prev,
                                  [thumbKey]: true,
                                }))
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-4 h-4" />
                          );
                        })()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {product.name}
                            </h3>
                            <span className="text-[11px] text-slate-500 block truncate">
                              Digital PDF · Email Delivery
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(product.id)}
                            className="w-9 h-9 -mt-1 -mr-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            aria-label={`Remove ${product.name} from cart`}
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Single License · Qty {quantity}</span>
                          </span>

                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 tabular-nums block">
                              {lineConverted.formatted}
                            </span>
                            {lineConverted.isConverted && (
                              <span className="text-[10px] text-slate-500 tabular-nums block">
                                Orig. {lineConverted.originalFormatted}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3.5 sm:space-y-4">
            <div className="space-y-1.5 text-xs">
              {showEstimatedTotal && (
                <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                  <span>Estimated Total ({selectedCurrency})</span>
                  <span className="text-blue-700 tabular-nums">
                    {formatCurrency(estimatedTotal, selectedCurrency)}
                  </span>
                </div>
              )}
              {currencyTotalsList.map(([cur, amount]) => (
                <div
                  key={cur}
                  className={`flex items-center justify-between ${
                    showEstimatedTotal
                      ? 'text-xs font-medium text-slate-600'
                      : 'text-sm font-bold text-slate-900'
                  }`}
                >
                  <span>
                    {showEstimatedTotal
                      ? `Payable Subtotal (${cur})`
                      : `Subtotal (${cur})`}
                  </span>
                  <span className="tabular-nums">
                    {formatProductPrice(amount, cur)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-md bg-white border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Complete your order using Payoneer (Preferred), Bank Transfer, Easypaisa, or JazzCash. PDFs are sent manually by email after verification.
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={onProceedToOrder}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                Place Order ({items.length})
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
