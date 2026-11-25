import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Mail,
  CreditCard,
  Loader2,
  FileText,
} from 'lucide-react';
import {
  StoreProductRecord,
  ManualPaymentMethod,
  PaymentInstructionsConfig,
} from '../../types/store';
import { StoreApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  getEffectiveProductPrice,
  formatProductPrice,
} from './StoreVisuals';
import { validateOrderFormInput } from '../../services/orderValidation';

export interface OrderDraftItem {
  product: StoreProductRecord;
  quantity: number;
}

interface PlaceOrderModalProps {
  isOpen: boolean;
  items: OrderDraftItem[];
  onClose: () => void;
  onOrderCreated: (orderIds: string[]) => void;
}

export const PlaceOrderModal: React.FC<PlaceOrderModalProps> = ({
  isOpen,
  items,
  onClose,
  onOrderCreated,
}) => {
  const { user } = useAuth();
  const {
    selectedCurrency,
    convertPrice,
    convertNumericAmount,
    formatCurrency,
  } = useCurrency();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [singleQuantity, setSingleQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] =
    useState<ManualPaymentMethod>('payoneer');
  const [notes, setNotes] = useState('');

  const [paymentConfig, setPaymentConfig] =
    useState<PaymentInstructionsConfig | null>(null);
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setPaymentMethod('payoneer');
    if (user) {
      setCustomerName((prev) => prev || user.fullName || '');
      setCustomerEmail((prev) => prev || user.email || '');
    }
    if (items.length === 1) {
      setSingleQuantity(Math.max(1, items[0].quantity || 1));
    }
    StoreApi.getPaymentInstructions()
      .then((cfg) => {
        setPaymentConfig(cfg);
      })
      .catch(() => {
        setPaymentConfig(null);
      });
  }, [isOpen, user, items]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || items.length === 0) return null;

  const isSingleProduct = items.length === 1;
  const effectiveItems = items.map((entry, idx) => ({
    product: entry.product,
    quantity: isSingleProduct && idx === 0 ? singleQuantity : entry.quantity,
  }));

  const totalsByCurrency = effectiveItems.reduce<Record<string, number>>(
    (acc, entry) => {
      const cur = entry.product.currency === 'PKR' ? 'PKR' : 'USD';
      acc[cur] =
        (acc[cur] || 0) +
        getEffectiveProductPrice(entry.product) * entry.quantity;
      return acc;
    },
    {}
  );

  const currencyTotalsList = Object.entries(totalsByCurrency);
  let estimatedDisplayTotal = 0;
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
    estimatedDisplayTotal += res.amount;
  }

  const showEstimatedTotal = anyCurrencyDiffers && allConvertible;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateOrderFormInput({
      customerName,
      customerEmail,
      customerPhone,
      quantity: isSingleProduct ? singleQuantity : 1,
      paymentMethod,
      notes,
    });

    if (!validation.valid) {
      setErrorMsg(validation.error || 'Please check your order details.');
      return;
    }

    try {
      setIsSubmitting(true);
      const createdIds: string[] = [];

      for (const entry of effectiveItems) {
        const order = await StoreApi.createOrder({
          productId: entry.product.id,
          customerName,
          customerEmail,
          customerPhone,
          quantity: entry.quantity,
          paymentMethod,
          notes,
        });
        createdIds.push(order.id);
      }

      onOrderCreated(createdIds);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to place your order. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-order-modal-title"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="place-order-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 truncate"
              >
                Place Order — Email PDF Delivery
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                MK Labs Digital Store · Manual Payment Verification
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-11 h-11 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0 -mr-1.5"
            aria-label="Close order form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Selected Product Summary */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Order Summary
            </span>
            <div className="space-y-2.5">
              {effectiveItems.map(({ product, quantity }) => {
                const unitPrice = getEffectiveProductPrice(product);
                const lineTotal = unitPrice * quantity;
                const lineConverted = convertPrice(lineTotal, product.currency);
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden text-blue-600">
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
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatProductPrice(unitPrice, product.currency)} ×{' '}
                          {quantity}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900 tabular-nums block">
                        {formatProductPrice(lineTotal, product.currency)}
                      </span>
                      {lineConverted.isConverted && (
                        <span className="text-[11px] text-slate-500 tabular-nums block">
                          Est. {lineConverted.formatted}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {isSingleProduct && (
              <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <label
                  htmlFor="order-quantity"
                  className="font-semibold text-slate-700"
                >
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSingleQuantity((q) => Math.max(1, q - 1))
                    }
                    className="w-10 h-10 sm:w-8 sm:h-8 rounded border border-slate-300 bg-white hover:bg-slate-100 font-bold text-slate-700 cursor-pointer flex items-center justify-center"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    id="order-quantity"
                    type="number"
                    min={1}
                    max={99}
                    value={singleQuantity}
                    onChange={(e) =>
                      setSingleQuantity(
                        Math.min(99, Math.max(1, Number(e.target.value) || 1))
                      )
                    }
                    className="w-14 h-10 sm:h-8 text-center py-1 rounded border border-slate-300 bg-white text-base sm:text-xs font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSingleQuantity((q) => Math.min(99, q + 1))
                    }
                    className="w-10 h-10 sm:w-8 sm:h-8 rounded border border-slate-300 bg-white hover:bg-slate-100 font-bold text-slate-700 cursor-pointer flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2.5 border-t border-slate-200/80 space-y-1.5">
              {currencyTotalsList.map(([cur, amt]) => (
                <div
                  key={cur}
                  className="flex items-center justify-between text-sm font-bold text-slate-900"
                >
                  <span>Total Payable ({cur})</span>
                  <span className="text-blue-700 tabular-nums">
                    {formatProductPrice(amt, cur)}
                  </span>
                </div>
              ))}

              {showEstimatedTotal && (
                <>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pt-1">
                    <span>Estimated Equivalent ({selectedCurrency})</span>
                    <span className="tabular-nums">
                      ~ {formatCurrency(estimatedDisplayTotal, selectedCurrency)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                    Display currency is an estimate using live FX rates. Your order and manual payment verification remain in the original payable currency shown above.
                  </p>
                </>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="order-customer-name"
                className="block text-xs font-semibold text-slate-700 uppercase mb-1"
              >
                Full Name *
              </label>
              <input
                id="order-customer-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Muhammad Kamran"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="order-customer-email"
                className="block text-xs font-semibold text-slate-700 uppercase mb-1"
              >
                Email Address (PDF Delivery) *
              </label>
              <input
                id="order-customer-email"
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="order-customer-phone"
                className="block text-xs font-semibold text-slate-700 uppercase mb-1"
              >
                Phone / WhatsApp Number *
              </label>
              <input
                id="order-customer-phone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Select Payment Method *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  {
                    id: 'payoneer' as ManualPaymentMethod,
                    label: 'Payoneer',
                    preferred: true,
                    hint: 'Receive a Payoneer payment request link via email',
                  },
                  {
                    id: 'bank_transfer' as ManualPaymentMethod,
                    label: 'Bank Transfer',
                    preferred: false,
                    hint: paymentConfig?.bankTransfer.enabled
                      ? paymentConfig.bankTransfer.bankName || 'Bank Account'
                      : 'Manual Bank Transfer',
                  },
                  {
                    id: 'easypaisa' as ManualPaymentMethod,
                    label: 'Easypaisa',
                    preferred: false,
                    hint: paymentConfig?.easypaisa.enabled
                      ? paymentConfig.easypaisa.accountTitle || 'Mobile Wallet'
                      : 'Easypaisa Transfer',
                  },
                  {
                    id: 'jazzcash' as ManualPaymentMethod,
                    label: 'JazzCash',
                    preferred: false,
                    hint: paymentConfig?.jazzcash.enabled
                      ? paymentConfig.jazzcash.accountTitle || 'Mobile Wallet'
                      : 'JazzCash Transfer',
                  },
                ] as const
              ).map((option) => {
                const selected = paymentMethod === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPaymentMethod(option.id)}
                    className={`min-h-[44px] p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <span>{option.label}</span>
                        {option.preferred && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                            Preferred
                          </span>
                        )}
                      </span>
                      {selected ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </div>
                    <span className="mt-1 block text-[11px] text-slate-500 truncate">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Order Notes */}
          <div>
            <label
              htmlFor="order-notes"
              className="block text-xs font-semibold text-slate-700 uppercase mb-1"
            >
              Order Notes (Optional)
            </label>
            <textarea
              id="order-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any delivery notes or questions for MK Labs..."
              className="w-full px-3.5 py-2.5 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Honest Payment & Email Delivery Disclosure */}
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <strong className="font-semibold block">
                {paymentMethod === 'payoneer'
                  ? 'Payoneer Manual Payment Request & Email PDF Delivery'
                  : 'Manual Verification & Email PDF Delivery'}
              </strong>
              <span>
                {paymentMethod === 'payoneer' ? (
                  <>
                    No automatic charge is made here. Your order will be saved with status <strong>Pending</strong>, and MK Labs will send a <strong>Payoneer payment request link</strong> to{' '}
                    <strong>{customerEmail.trim() || 'your email address'}</strong>. Once your Payoneer payment is verified, we will email your digital PDF product.
                  </>
                ) : (
                  <>
                    No automatic charge is made here. After submitting your order, you will see your unique Order ID and transfer instructions. Once we verify your payment, MK Labs will manually email the digital PDF product to{' '}
                    <strong>{customerEmail.trim() || 'your email address'}</strong>.
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] px-4 py-2.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Place Order</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
