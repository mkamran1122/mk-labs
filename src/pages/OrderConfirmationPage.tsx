import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  CreditCard,
  Mail,
  Clock,
  AlertCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Building2,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import {
  StoreOrderRecord,
  PaymentInstructionsConfig,
  ManualPaymentMethod,
  formatProductPrice,
} from '../types/store';
import { StoreApi } from '../services/api';
import { useRouter } from '../hooks/useRouter';
import {
  formatPaymentMethodLabel,
  isSafeExternalHttpsUrl,
} from '../services/orderValidation';

function getPaymentBadgeClasses(status: StoreOrderRecord['paymentStatus']): string {
  switch (status) {
    case 'Paid':
    case 'Verified':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Payment Link Sent':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Submitted':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Rejected':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-amber-50 text-amber-800 border-amber-200';
  }
}

function getDeliveryBadgeClasses(
  status: StoreOrderRecord['deliveryStatus']
): string {
  return status === 'Delivered'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-slate-100 text-slate-700 border-slate-200';
}

export const OrderConfirmationPage: React.FC<{ orderId: string }> = ({
  orderId,
}) => {
  const { navigate, search } = useRouter();

  const [orders, setOrders] = useState<StoreOrderRecord[]>([]);
  const [canSubmitByOrderId, setCanSubmitByOrderId] = useState<
    Record<string, boolean>
  >({});
  const [paymentConfig, setPaymentConfig] =
    useState<PaymentInstructionsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<ManualPaymentMethod>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [proofMessage, setProofMessage] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams(search);
      const batchParam = params.get('batch');
      const targetIds = batchParam
        ? Array.from(
            new Set(
              batchParam
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          )
        : [orderId];

      if (!targetIds.includes(orderId)) {
        targetIds.unshift(orderId);
      }

      const [orderResults, cfg] = await Promise.all([
        Promise.all(targetIds.map((id) => StoreApi.getOrderById(id))),
        StoreApi.getPaymentInstructions().catch(() => null),
      ]);

      const foundOrders: StoreOrderRecord[] = [];
      const submitMap: Record<string, boolean> = {};

      for (const res of orderResults) {
        if (res.order) {
          foundOrders.push(res.order);
          submitMap[res.order.id] = res.canSubmitPayment;
        }
      }

      if (foundOrders.length === 0) {
        setErrorMsg(
          'Order record could not be retrieved. If you placed this order as a guest, open it from the same browser session or sign in with the customer account used.'
        );
      } else {
        setPaymentMethod(foundOrders[0].paymentMethod);
      }

      setOrders(foundOrders);
      setCanSubmitByOrderId(submitMap);
      setPaymentConfig(cfg);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to load order confirmation.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderId, search]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // Clipboard blocked in restricted frame
    }
  };

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setProofError(null);
    setProofMessage(null);

    try {
      setIsSubmittingProof(true);
      const submittable = orders.filter(
        (o) =>
          (o.paymentStatus === 'Pending' ||
            o.paymentStatus === 'Payment Link Sent') &&
          canSubmitByOrderId[o.id]
      );
      if (submittable.length === 0) {
        setProofError(
          'Payment confirmation has already been submitted or cannot be modified from this session.'
        );
        return;
      }

      for (const ord of submittable) {
        await StoreApi.submitPaymentProof(ord.id, {
          paymentMethod,
          paymentReference: paymentReference.trim() || undefined,
        });
      }

      setProofMessage(
        'Payment submission recorded. MK Labs will verify your transfer manually and email your digital PDF.'
      );
      await loadData();
    } catch (err) {
      setProofError(
        err instanceof Error
          ? err.message
          : 'Failed to update payment status. Please try again.'
      );
    } finally {
      setIsSubmittingProof(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-36 pb-20 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <span className="text-sm text-slate-500">
          Loading order confirmation &amp; payment instructions...
        </span>
      </div>
    );
  }

  if (errorMsg || orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-14 sm:pt-36 sm:pb-20">
        <div className="max-w-xl mx-auto px-4 text-center bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">
            Order Confirmation Not Available
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {errorMsg ||
              'We could not find this order in the current session.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate('/store')}
              className="min-h-[44px] px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              Return to Digital Store
            </button>
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="min-h-[44px] px-4 py-2.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Customer Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryOrder = orders[0];
  const isPayoneerOrder = primaryOrder.paymentMethod === 'payoneer';
  const hasAnyPendingSubmittable = orders.some(
    (o) =>
      (o.paymentMethod === 'payoneer'
        ? o.paymentStatus === 'Payment Link Sent'
        : o.paymentStatus === 'Pending') && canSubmitByOrderId[o.id]
  );

  const totalsByCurrency = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.currency] = (acc[o.currency] || 0) + o.totalAmount;
    return acc;
  }, {});

  const hasConfiguredMethods =
    paymentConfig &&
    (paymentConfig.bankTransfer.enabled ||
      paymentConfig.easypaisa.enabled ||
      paymentConfig.jazzcash.enabled);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-14 sm:pt-28 sm:pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/store')}
            className="min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Digital Store</span>
          </button>

          <button
            type="button"
            onClick={() => void loadData()}
            className="min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded border border-slate-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Success Banner */}
        <div className="bg-white p-4 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  Order Recorded Successfully
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 break-words">
                  Thank You, {primaryOrder.customerName}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {isPayoneerOrder ? (
                    primaryOrder.paymentStatus === 'Paid' ||
                    primaryOrder.paymentStatus === 'Verified' ? (
                      <>
                        Your Payoneer payment has been manually verified. Your digital PDF will be sent to{' '}
                        <strong className="text-slate-900">
                          {primaryOrder.customerEmail}
                        </strong>
                        .
                      </>
                    ) : primaryOrder.paymentStatus === 'Payment Link Sent' ? (
                      <>
                        A Payoneer payment request link has been prepared for your order. Please check your inbox at{' '}
                        <strong className="text-slate-900">
                          {primaryOrder.customerEmail}
                        </strong>{' '}
                        (or use the payment link below if signed in). Payment has not been marked Paid until MK Labs confirms receipt in Payoneer.
                      </>
                    ) : (
                      <>
                        Your order is saved with status <strong>Pending</strong>. You will receive a{' '}
                        <strong>Payoneer payment request link by email</strong> at{' '}
                        <strong className="text-slate-900">
                          {primaryOrder.customerEmail}
                        </strong>
                        . No payment has been received yet.
                      </>
                    )
                  ) : (
                    <>
                      Please send payment using the instructions below. Once our team manually verifies your payment, your digital PDF will be sent to{' '}
                      <strong className="text-slate-900">
                        {primaryOrder.customerEmail}
                      </strong>
                      .
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded border ${getPaymentBadgeClasses(
                  primaryOrder.paymentStatus
                )}`}
              >
                Payment: {primaryOrder.paymentStatus}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded border ${getDeliveryBadgeClasses(
                  primaryOrder.deliveryStatus
                )}`}
              >
                Delivery: {primaryOrder.deliveryStatus}
              </span>
            </div>
          </div>

          {/* Order IDs Strip */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5 sm:gap-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs max-w-full"
              >
                <span className="text-slate-500 font-medium shrink-0">Order ID:</span>
                <span className="font-mono font-bold text-slate-900 break-all">
                  {ord.id}
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopy(ord.id, `id-${ord.id}`)}
                  className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-blue-600 cursor-pointer shrink-0 -my-1 -mr-1"
                  title="Copy Order ID"
                  aria-label="Copy Order ID"
                >
                  {copiedId === `id-${ord.id}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details & Customer Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Order &amp; Delivery Details
            </h2>

            <div className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm break-words">
                      {ord.productName}
                    </div>
                    <div className="text-slate-500 mt-0.5 break-all">
                      Order ID: <span className="font-mono">{ord.id}</span> ·
                      Qty {ord.quantity} ×{' '}
                      {formatProductPrice(ord.unitPrice, ord.currency)}
                    </div>
                    {ord.paymentReference && (
                      <div className="text-blue-700 mt-1 font-medium break-all">
                        Reference: {ord.paymentReference}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900 text-sm">
                      {formatProductPrice(ord.totalAmount, ord.currency)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {formatPaymentMethodLabel(ord.paymentMethod)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1">
              {Object.entries(totalsByCurrency).map(([cur, amt]) => (
                <div
                  key={cur}
                  className="flex items-center justify-between text-sm font-bold text-slate-900"
                >
                  <span>Total Amount ({cur})</span>
                  <span className="text-blue-700">
                    {formatProductPrice(amt, cur)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Customer Email</span>
                <span className="font-semibold text-slate-900 break-all">
                  {primaryOrder.customerEmail}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone / WhatsApp</span>
                <span className="font-semibold text-slate-900">
                  {primaryOrder.customerPhone}
                </span>
              </div>
              {primaryOrder.notes && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block">Notes</span>
                  <span className="text-slate-800">{primaryOrder.notes}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Your PDF product will be sent directly to{' '}
                <strong>{primaryOrder.customerEmail}</strong> once payment verification is complete. Please check your spam or promotions folder if needed.
              </span>
            </div>
          </div>

          {/* Right Column: Submit Payment Confirmation */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            {hasAnyPendingSubmittable ? (
              <form
                onSubmit={handleSubmitPaymentProof}
                className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Confirm Your Payment
                  </h2>
                </div>
                {isPayoneerOrder &&
                  primaryOrder.paymentRequestLink &&
                  isSafeExternalHttpsUrl(primaryOrder.paymentRequestLink) && (
                  <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 block">
                      Payoneer Payment Request Ready
                    </span>
                    <a
                      href={primaryOrder.paymentRequestLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                    >
                      <span>Open Payoneer Payment Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isPayoneerOrder
                    ? 'After completing your Payoneer payment request, enter your Payoneer transaction ID or reference (optional) and submit so our team can verify it in Payoneer and mark your order Paid.'
                    : 'After transferring the amount using the payment details below, enter your transaction reference ID (optional) and click submit so our team can verify your order.'}
                </p>

                {proofError && (
                  <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-800">
                    {proofError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="confirm-payment-method"
                    className="block text-xs font-semibold text-slate-700 uppercase mb-1"
                  >
                    Payment Method Used
                  </label>
                  <select
                    id="confirm-payment-method"
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as ManualPaymentMethod)
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="easypaisa">Easypaisa</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="payoneer">Payoneer</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="confirm-payment-ref"
                    className="block text-xs font-semibold text-slate-700 uppercase mb-1"
                  >
                    Transaction / Reference ID (Optional)
                  </label>
                  <input
                    id="confirm-payment-ref"
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. Payoneer Payment ID or TID"
                    className="w-full min-h-[44px] px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingProof}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingProof
                    ? 'Submitting Confirmation...'
                    : 'I Have Sent Payment (Mark as Submitted)'}
                </button>
              </form>
            ) : (
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Current Status
                  </h2>
                </div>
                {proofMessage && (
                  <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    {proofMessage}
                  </div>
                )}
                {isPayoneerOrder &&
                  primaryOrder.paymentStatus === 'Payment Link Sent' &&
                  primaryOrder.paymentRequestLink &&
                  isSafeExternalHttpsUrl(primaryOrder.paymentRequestLink) && (
                    <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 block">
                        Payoneer Payment Request Link
                      </span>
                      <a
                        href={primaryOrder.paymentRequestLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                      >
                        <span>Pay via Payoneer</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                <p className="text-xs text-slate-600 leading-relaxed break-words">
                  {isPayoneerOrder && primaryOrder.paymentStatus === 'Pending' &&
                    `Your Payoneer order is Pending. MK Labs will create a payment request in Payoneer and send the payment link to ${primaryOrder.customerEmail}. Payment has not been received yet.`}
                  {isPayoneerOrder && primaryOrder.paymentStatus === 'Payment Link Sent' &&
                    `Your Payoneer payment request link has been sent to ${primaryOrder.customerEmail}. Complete the request and our team will verify it in Payoneer before marking your order Paid.`}
                  {primaryOrder.paymentStatus === 'Submitted' &&
                    'We have received your payment submission note. Our admin team will verify the payment manually and email your PDF.'}
                  {(primaryOrder.paymentStatus === 'Paid' ||
                    primaryOrder.paymentStatus === 'Verified') &&
                    primaryOrder.deliveryStatus !== 'Delivered' &&
                    'Your payment has been verified. MK Labs is preparing to email your PDF product shortly.'}
                  {primaryOrder.deliveryStatus === 'Delivered' &&
                    `Your order has been marked as Delivered to ${primaryOrder.customerEmail}. Please check your inbox for the email with your PDF attachment.`}
                  {primaryOrder.paymentStatus === 'Rejected' &&
                    'This payment submission could not be verified. Please contact MK Labs support with your Order ID.'}
                </p>
                {primaryOrder.adminNotes && (
                  <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="font-semibold block text-slate-900 mb-0.5">
                      Admin Note:
                    </span>
                    {primaryOrder.adminNotes}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Verification Timeline</span>
              </div>
              <p className="leading-relaxed break-words">
                {isPayoneerOrder ? (
                  <>
                    Please check <strong className="break-all">{primaryOrder.customerEmail}</strong> (including spam/promotions) for your Payoneer payment request link referencing Order ID{' '}
                    <strong className="font-mono break-all">{primaryOrder.id}</strong>.
                  </>
                ) : (
                  <>
                    Always include your Order ID (
                    <strong className="font-mono break-all">{primaryOrder.id}</strong>) as the payment reference when possible so verification is faster.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Manual Payment Instructions */}
        <div className="bg-white p-4 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>
                  {isPayoneerOrder
                    ? 'Payoneer Payment Request Instructions'
                    : 'Manual Payment Instructions'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isPayoneerOrder
                  ? 'Payoneer payments are requested manually by email after order placement.'
                  : 'Transfer your total payable amount using any enabled MK Labs payment account below.'}
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 self-start">
              Selected: {formatPaymentMethodLabel(primaryOrder.paymentMethod)}
            </span>
          </div>

          {isPayoneerOrder ? (
            <div className="p-4 sm:p-5 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-2 leading-relaxed">
              <strong className="font-bold text-sm block text-indigo-900">
                How Payoneer Payment Requests Work
              </strong>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Your order (<strong>{primaryOrder.id}</strong>) is currently recorded with payment status <strong>{primaryOrder.paymentStatus}</strong>.
                </li>
                <li>
                  MK Labs will manually create a Payoneer payment request and send the payment link to{' '}
                  <strong>{primaryOrder.customerEmail}</strong>.
                </li>
                <li>
                  For account security, no Payoneer bank receiving account details are displayed publicly on this website.
                </li>
                <li>
                  Once you complete the Payoneer request and our team verifies receipt inside Payoneer, your order will be marked <strong>Paid</strong> and your digital PDF will be emailed to you.
                </li>
              </ul>
            </div>
          ) : !hasConfiguredMethods ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong className="font-semibold block">
                Payment Account Details Pending Configuration
              </strong>
              <p className="leading-relaxed">
                The store administrator has not published Bank Transfer, Easypaisa, or JazzCash account numbers yet. Please check back or contact MK Labs with your Order ID{' '}
                <strong className="font-mono">{primaryOrder.id}</strong>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {paymentConfig?.bankTransfer.enabled && (
                <div
                  className={`p-4 rounded-lg border space-y-2.5 ${
                    primaryOrder.paymentMethod === 'bank_transfer'
                      ? 'border-blue-500 bg-blue-50/40'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Bank Transfer
                    </span>
                    {primaryOrder.paymentMethod === 'bank_transfer' && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-500">Bank:</span>{' '}
                      <strong className="text-slate-900">
                        {paymentConfig.bankTransfer.bankName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Title:</span>{' '}
                      <strong className="text-slate-900">
                        {paymentConfig.bankTransfer.accountTitle}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="font-mono font-bold text-slate-900 break-all">
                        {paymentConfig.bankTransfer.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopy(
                            paymentConfig.bankTransfer.accountNumber,
                            'bank-acc'
                          )
                        }
                        className="w-10 h-10 flex items-center justify-center rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 shrink-0 cursor-pointer"
                        title="Copy Account Number"
                        aria-label="Copy Bank Account Number"
                      >
                        {copiedId === 'bank-acc' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {paymentConfig.bankTransfer.iban && (
                      <div className="text-[11px] text-slate-600 break-all">
                        IBAN: {paymentConfig.bankTransfer.iban}
                      </div>
                    )}
                    {paymentConfig.bankTransfer.branchCode && (
                      <div className="text-[11px] text-slate-600">
                        Branch Code: {paymentConfig.bankTransfer.branchCode}
                      </div>
                    )}
                    {paymentConfig.bankTransfer.instructions && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80">
                        {paymentConfig.bankTransfer.instructions}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {paymentConfig?.easypaisa.enabled && (
                <div
                  className={`p-4 rounded-lg border space-y-2.5 ${
                    primaryOrder.paymentMethod === 'easypaisa'
                      ? 'border-blue-500 bg-blue-50/40'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      Easypaisa
                    </span>
                    {primaryOrder.paymentMethod === 'easypaisa' && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-500">Account Title:</span>{' '}
                      <strong className="text-slate-900">
                        {paymentConfig.easypaisa.accountTitle}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="font-mono font-bold text-slate-900 break-all">
                        {paymentConfig.easypaisa.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopy(
                            paymentConfig.easypaisa.accountNumber,
                            'ep-acc'
                          )
                        }
                        className="w-10 h-10 flex items-center justify-center rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 shrink-0 cursor-pointer"
                        title="Copy Easypaisa Number"
                        aria-label="Copy Easypaisa Number"
                      >
                        {copiedId === 'ep-acc' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {paymentConfig.easypaisa.instructions && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80">
                        {paymentConfig.easypaisa.instructions}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {paymentConfig?.jazzcash.enabled && (
                <div
                  className={`p-4 rounded-lg border space-y-2.5 ${
                    primaryOrder.paymentMethod === 'jazzcash'
                      ? 'border-blue-500 bg-blue-50/40'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-rose-600" />
                      JazzCash
                    </span>
                    {primaryOrder.paymentMethod === 'jazzcash' && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-500">Account Title:</span>{' '}
                      <strong className="text-slate-900">
                        {paymentConfig.jazzcash.accountTitle}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="font-mono font-bold text-slate-900 break-all">
                        {paymentConfig.jazzcash.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopy(
                            paymentConfig.jazzcash.accountNumber,
                            'jc-acc'
                          )
                        }
                        className="w-10 h-10 flex items-center justify-center rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 shrink-0 cursor-pointer"
                        title="Copy JazzCash Number"
                        aria-label="Copy JazzCash Number"
                      >
                        {copiedId === 'jc-acc' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {paymentConfig.jazzcash.instructions && (
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80">
                        {paymentConfig.jazzcash.instructions}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentConfig?.generalInstructions && (
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {paymentConfig.generalInstructions}
              {paymentConfig.supportEmail && (
                <span className="block mt-1 font-medium text-slate-900">
                  Support Email: {paymentConfig.supportEmail}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
