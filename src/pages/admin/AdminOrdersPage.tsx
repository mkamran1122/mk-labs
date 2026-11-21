import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Send,
  X,
  FileText,
  Link2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  StoreOrderRecord,
  DigitalProduct,
  PaymentStatus,
  DeliveryStatus,
  ManualPaymentMethod,
  formatProductPrice,
} from '../../types/store';
import { StoreApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';
import {
  formatPaymentMethodLabel,
  formatOrderSummaryForCopy,
  buildSuggestedDeliveryEmail,
  buildSuggestedPayoneerRequestEmail,
} from '../../services/orderValidation';

function paymentBadgeClass(status: PaymentStatus): string {
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

function deliveryBadgeClass(status: DeliveryStatus): string {
  return status === 'Delivered'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-slate-100 text-slate-700 border-slate-200';
}

export const AdminOrdersPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [orders, setOrders] = useState<StoreOrderRecord[]>([]);
  const [productsById, setProductsById] = useState<Map<string, DigitalProduct>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | ManualPaymentMethod>(
    'all'
  );
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>(
    'all'
  );
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | DeliveryStatus>(
    'all'
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [paymentLinkInput, setPaymentLinkInput] = useState('');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmRejectOrderId, setConfirmRejectOrderId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [ordersList, productsRes] = await Promise.all([
        StoreApi.getAdminOrders(),
        StoreApi.getAdminProducts().catch(() => ({
          products: [] as DigitalProduct[],
          total: 0,
        })),
      ]);
      setOrders(ordersList);
      setProductsById(new Map(productsRes.products.map((p) => [p.id, p])));
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Failed to load store orders.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    void fetchOrders();
  }, [isAdmin, fetchOrders]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  useEffect(() => {
    if (selectedOrder) {
      setPaymentLinkInput(selectedOrder.paymentRequestLink || '');
      setAdminNotesInput(selectedOrder.adminNotes || '');
      setConfirmRejectOrderId(null);
      setModalError(null);
    }
  }, [selectedOrder]);

  useEffect(() => {
    if (!selectedOrder) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !actionBusy) {
        setSelectedOrderId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedOrder, actionBusy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, methodFilter, paymentFilter, deliveryFilter]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((ord) => {
      if (methodFilter !== 'all' && ord.paymentMethod !== methodFilter) {
        return false;
      }
      if (paymentFilter !== 'all' && ord.paymentStatus !== paymentFilter) {
        return false;
      }
      if (deliveryFilter !== 'all' && ord.deliveryStatus !== deliveryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        ord.id.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.customerEmail.toLowerCase().includes(q) ||
        ord.customerPhone.toLowerCase().includes(q) ||
        ord.productName.toLowerCase().includes(q) ||
        (ord.paymentReference || '').toLowerCase().includes(q) ||
        (ord.paymentRequestLink || '').toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery, methodFilter, paymentFilter, deliveryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const stats = useMemo(() => {
    const awaitingVerification = orders.filter(
      (o) =>
        o.paymentStatus === 'Pending' ||
        o.paymentStatus === 'Payment Link Sent' ||
        o.paymentStatus === 'Submitted'
    ).length;
    const readyForDelivery = orders.filter(
      (o) =>
        (o.paymentStatus === 'Paid' || o.paymentStatus === 'Verified') &&
        o.deliveryStatus !== 'Delivered'
    ).length;
    const delivered = orders.filter(
      (o) => o.deliveryStatus === 'Delivered'
    ).length;
    return {
      total: orders.length,
      awaitingVerification,
      readyForDelivery,
      delivered,
    };
  }, [orders]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const handleSavePayoneerLink = async (markAsSent: boolean) => {
    if (!selectedOrder) return;
    try {
      setActionBusy(true);
      setModalError(null);
      await StoreApi.savePayoneerPaymentLink(selectedOrder.id, {
        paymentRequestLink: paymentLinkInput,
        markAsSent,
        adminNotes: adminNotesInput,
      });
      setPageNotice(
        markAsSent
          ? `Payoneer payment link saved and Order ${selectedOrder.id} marked "Payment Link Sent".`
          : `Payoneer payment request link saved for Order ${selectedOrder.id}.`
      );
      await fetchOrders();
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : 'Failed to save Payoneer payment request link.'
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleMarkOrderPaid = async () => {
    if (!selectedOrder) return;
    try {
      setActionBusy(true);
      setModalError(null);
      await StoreApi.markOrderPaid(selectedOrder.id, adminNotesInput);
      setPageNotice(`Order ${selectedOrder.id} verified and marked Paid.`);
      await fetchOrders();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : 'Failed to mark order Paid.'
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;
    try {
      setActionBusy(true);
      setModalError(null);
      await StoreApi.verifyOrderPayment(selectedOrder.id, adminNotesInput);
      setPageNotice(`Payment verified for Order ${selectedOrder.id}.`);
      await fetchOrders();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : 'Failed to verify payment.'
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedOrder) return;
    try {
      setActionBusy(true);
      setModalError(null);
      await StoreApi.rejectOrderPayment(selectedOrder.id, adminNotesInput);
      setConfirmRejectOrderId(null);
      setPageNotice(`Payment marked Rejected for Order ${selectedOrder.id}.`);
      await fetchOrders();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : 'Failed to reject payment.'
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!selectedOrder) return;
    try {
      setActionBusy(true);
      setModalError(null);
      await StoreApi.markOrderDelivered(selectedOrder.id, adminNotesInput);
      setPageNotice(
        `Order ${selectedOrder.id} marked as Delivered to ${selectedOrder.customerEmail}.`
      );
      await fetchOrders();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : 'Failed to mark order delivered.'
      );
    } finally {
      setActionBusy(false);
    }
  };

  const selectedProduct = selectedOrder
    ? productsById.get(selectedOrder.productId)
    : undefined;
  const emailDraft = selectedOrder
    ? buildSuggestedDeliveryEmail(
        selectedOrder,
        selectedProduct?.originalFileName
      )
    : null;
  const payoneerRequestEmail = selectedOrder
    ? buildSuggestedPayoneerRequestEmail(selectedOrder, paymentLinkInput)
    : null;

  return (
    <AdminLayout currentTab="orders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Orders &amp; Email PDF Delivery
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Send manual Payoneer payment requests, verify Payoneer, Bank Transfer, Easypaisa, or JazzCash payments, then email the product PDF via Gmail and mark delivered.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchOrders()}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer self-start"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'
              }`}
            />
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Total Orders
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 block">
              {stats.total}
            </span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Awaiting Payment / Link
            </span>
            <span className="text-xl sm:text-2xl font-bold text-amber-600 mt-1 block">
              {stats.awaitingVerification}
            </span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Paid / Verified · Pending Email
            </span>
            <span className="text-xl sm:text-2xl font-bold text-blue-600 mt-1 block">
              {stats.readyForDelivery}
            </span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Delivered via Email
            </span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 block">
              {stats.delivered}
            </span>
          </div>
        </div>

        {loadError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{loadError}</span>
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
              className="font-semibold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, customer, email, product, or link..."
              className="w-full min-h-[44px] sm:min-h-0 pl-9 pr-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label="Filter by payment method"
              value={methodFilter}
              onChange={(e) =>
                setMethodFilter(e.target.value as 'all' | ManualPaymentMethod)
              }
              className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="all">All Payment Methods</option>
              <option value="payoneer">Payoneer</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label="Filter by payment status"
              value={paymentFilter}
              onChange={(e) =>
                setPaymentFilter(e.target.value as 'all' | PaymentStatus)
              }
              className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Payment Link Sent">Payment Link Sent</option>
              <option value="Submitted">Submitted</option>
              <option value="Paid">Paid</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Filter by delivery status"
              value={deliveryFilter}
              onChange={(e) =>
                setDeliveryFilter(e.target.value as 'all' | DeliveryStatus)
              }
              className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="all">All Delivery</option>
              <option value="Pending">Delivery Pending</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Orders Table & Mobile Cards */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          {/* Mobile Order Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                Loading customer orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="px-4 py-12 text-center text-xs text-slate-500 space-y-1.5">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="font-semibold text-slate-700">
                  {orders.length === 0
                    ? 'No customer orders recorded yet'
                    : 'No orders match your filters'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Orders placed from the MK Labs Digital Store will appear here for manual payment verification and email PDF delivery.
                </p>
              </div>
            ) : (
              paginatedOrders.map((ord) => (
                <div key={ord.id} className="p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-slate-900 break-all block">
                        {ord.id}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(ord.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900 text-sm block">
                        {formatProductPrice(ord.totalAmount, ord.currency)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Qty {ord.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 break-words">
                      {ord.productName}
                    </p>
                    <p className="text-slate-700">
                      {ord.customerName} · {ord.customerPhone}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-700 font-medium break-all">
                        {ord.customerEmail}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopy(
                            ord.customerEmail,
                            `row-email-m-${ord.id}`
                          )
                        }
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                        title="Copy Customer Email"
                        aria-label="Copy Customer Email"
                      >
                        {copiedKey === `row-email-m-${ord.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${paymentBadgeClass(
                        ord.paymentStatus
                      )}`}
                    >
                      {ord.paymentStatus}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${deliveryBadgeClass(
                        ord.deliveryStatus
                      )}`}
                    >
                      Delivery: {ord.deliveryStatus}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      · {formatPaymentMethodLabel(ord.paymentMethod)}
                    </span>
                  </div>

                  {ord.paymentReference && (
                    <div className="text-[11px] font-mono text-slate-600 break-all">
                      Ref: {ord.paymentReference}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(
                          formatOrderSummaryForCopy(ord),
                          `row-sum-m-${ord.id}`
                        )
                      }
                      className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      {copiedKey === `row-sum-m-${ord.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(ord.id)}
                      className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Manage / Deliver</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Order ID &amp; Date</th>
                  <th className="px-4 py-3">Customer &amp; Email</th>
                  <th className="px-4 py-3">Product &amp; Amount</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Delivery Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading customer orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-500 space-y-1.5"
                    >
                      <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      <p className="font-semibold text-slate-700">
                        {orders.length === 0
                          ? 'No customer orders recorded yet'
                          : 'No orders match your filters'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Orders placed from the MK Labs Digital Store will appear here for manual payment verification and email PDF delivery.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          {ord.id}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(ord.createdAt).toLocaleString()}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 min-w-[210px]">
                        <div className="font-bold text-slate-900">
                          {ord.customerName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-blue-700 font-medium break-all">
                            {ord.customerEmail}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopy(
                                ord.customerEmail,
                                `row-email-${ord.id}`
                              )
                            }
                            className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                            title="Copy Customer Email"
                          >
                            {copiedKey === `row-email-${ord.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ord.customerPhone}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 min-w-[190px]">
                        <div className="font-semibold text-slate-900">
                          {ord.productName}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Qty: <strong>{ord.quantity}</strong> ·{' '}
                          <strong className="text-slate-900">
                            {formatProductPrice(ord.totalAmount, ord.currency)}
                          </strong>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${paymentBadgeClass(
                            ord.paymentStatus
                          )}`}
                        >
                          {ord.paymentStatus}
                        </span>
                        <div className="text-[11px] text-slate-600 font-medium mt-1">
                          {formatPaymentMethodLabel(ord.paymentMethod)}
                        </div>
                        {ord.paymentRequestLink && (
                          <div className="text-[10px] text-indigo-700 font-medium flex items-center gap-1 mt-0.5">
                            <Link2 className="w-3 h-3 shrink-0" />
                            <span>Request Link Saved</span>
                          </div>
                        )}
                        {ord.paymentReference && (
                          <div
                            className="text-[10px] font-mono text-slate-600 max-w-[140px] truncate"
                            title={ord.paymentReference}
                          >
                            Ref: {ord.paymentReference}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${deliveryBadgeClass(
                            ord.deliveryStatus
                          )}`}
                        >
                          {ord.deliveryStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void handleCopy(
                              formatOrderSummaryForCopy(ord),
                              `row-sum-${ord.id}`
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 cursor-pointer"
                          title="Copy Order Details"
                        >
                          {copiedKey === `row-sum-${ord.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(ord.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Manage / Deliver</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredOrders.length > PAGE_SIZE && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600">
              <span>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filteredOrders.length)} of{' '}
                {filteredOrders.length} orders
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
      </div>

      {/* Order Verification & Email Delivery Modal */}
      {selectedOrder && emailDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-order-modal-title"
          onClick={() => !actionBusy && setSelectedOrderId(null)}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-3.5 sm:py-4 flex items-start sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="admin-order-modal-title"
                    className="text-base sm:text-lg font-bold text-slate-900 font-mono break-all"
                  >
                    {selectedOrder.id}
                  </h2>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${paymentBadgeClass(
                      selectedOrder.paymentStatus
                    )}`}
                  >
                    Payment: {selectedOrder.paymentStatus}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${deliveryBadgeClass(
                      selectedOrder.deliveryStatus
                    )}`}
                  >
                    Delivery: {selectedOrder.deliveryStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Placed {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                disabled={actionBusy}
                className="w-11 h-11 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer shrink-0"
                aria-label="Close order details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Quick Copy Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void handleCopy(
                      selectedOrder.customerEmail,
                      'modal-copy-email'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-800 cursor-pointer"
                >
                  {copiedKey === 'modal-copy-email' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Copy Customer Email</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleCopy(
                      formatOrderSummaryForCopy(selectedOrder),
                      'modal-copy-summary'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-800 cursor-pointer"
                >
                  {copiedKey === 'modal-copy-summary' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>Copy Order Details</span>
                </button>
              </div>

              {/* Customer & Product Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Customer Name
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedOrder.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Customer Email (PDF Recipient)
                  </span>
                  <span className="font-bold text-blue-700 break-all">
                    {selectedOrder.customerEmail}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Phone / WhatsApp
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedOrder.customerPhone}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Exact Product &amp; Quantity
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedOrder.productName} (Qty {selectedOrder.quantity})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Total Payable Amount
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatProductPrice(
                      selectedOrder.totalAmount,
                      selectedOrder.currency
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Payment Method &amp; Reference
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatPaymentMethodLabel(selectedOrder.paymentMethod)}
                    {selectedOrder.paymentReference
                      ? ` · Ref: ${selectedOrder.paymentReference}`
                      : ' (No reference entered)'}
                  </span>
                </div>
                {selectedOrder.notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Customer Notes
                    </span>
                    <span className="text-slate-700">
                      {selectedOrder.notes}
                    </span>
                  </div>
                )}
              </div>

              {/* Payoneer Payment Request Link Panel */}
              <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-indigo-600" />
                      <span>Payoneer Payment Request Link (Manual)</span>
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Create the payment request inside your Payoneer account for{' '}
                      <strong>
                        {formatProductPrice(
                          selectedOrder.totalAmount,
                          selectedOrder.currency
                        )}
                      </strong>{' '}
                      and paste the generated request link below.
                    </p>
                  </div>
                  {selectedOrder.paymentMethod === 'payoneer' && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Payoneer Order
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="admin-payment-request-link"
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    Payment Request Link (https://...)
                  </label>
                  <input
                    id="admin-payment-request-link"
                    type="url"
                    value={paymentLinkInput}
                    onChange={(e) => setPaymentLinkInput(e.target.value)}
                    placeholder="https://link.payoneer.com/..."
                    className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 bg-white text-base sm:text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleSavePayoneerLink(true)}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>Save Link &amp; Mark &quot;Payment Link Sent&quot;</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleSavePayoneerLink(false)}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Link2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Save Link Only</span>
                  </button>

                  {payoneerRequestEmail && paymentLinkInput.trim() && (
                    <>
                      <a
                        href={payoneerRequestEmail.gmailComposeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span>Email Link via Gmail</span>
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopy(
                            `Subject: ${payoneerRequestEmail.subject}\n\n${payoneerRequestEmail.body}`,
                            'modal-copy-payoneer-email'
                          )
                        }
                        className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                      >
                        {copiedKey === 'modal-copy-payoneer-email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>Copy Request Email</span>
                      </button>
                    </>
                  )}
                </div>

                {selectedOrder.paymentLinkSentAt && (
                  <div className="text-[11px] text-indigo-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Payment Link Sent{' '}
                      {new Date(selectedOrder.paymentLinkSentAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Verification Controls */}
              <div className="p-4 rounded-lg border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Step 1 · Manual Payment Verification
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedOrder.paymentMethod === 'payoneer'
                    ? 'Verify payment has cleared inside your Payoneer account before marking this order Paid.'
                    : 'Verify transfer details on your statement before marking Paid or Verified.'}
                </p>

                <div>
                  <label
                    htmlFor="admin-order-notes"
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Admin Verification / Delivery Notes (Optional)
                  </label>
                  <input
                    id="admin-order-notes"
                    type="text"
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="e.g. Confirmed Payoneer payment ID #... or bank TID"
                    className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleMarkOrderPaid()}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Mark Order Paid</span>
                  </button>

                  {selectedOrder.paymentMethod !== 'payoneer' && (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => void handleVerifyPayment()}
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Verify Payment</span>
                    </button>
                  )}

                  {confirmRejectOrderId === selectedOrder.id ? (
                    <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                      <span className="text-[11px] font-semibold text-red-800">
                        Reject this payment?
                      </span>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => void handleRejectPayment()}
                        className="min-h-[38px] px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Confirm Reject
                      </button>
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => setConfirmRejectOrderId(null)}
                        className="min-h-[38px] px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => setConfirmRejectOrderId(selectedOrder.id)}
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Reject Payment</span>
                    </button>
                  )}

                  {selectedOrder.verifiedAt && (
                    <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Confirmed{' '}
                      {new Date(selectedOrder.verifiedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Manual Email PDF Delivery Panel */}
              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Step 2 · Email PDF Delivery (Manual Gmail)</span>
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      No email is sent automatically. Open Gmail Compose, attach your local PDF from your computer, send it, then mark delivered below.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Send To Email
                    </span>
                    <span className="font-bold text-blue-700 break-all">
                      {selectedOrder.customerEmail}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Product to Attach
                    </span>
                    <span className="font-bold text-slate-900 break-words">
                      {selectedOrder.productName}
                    </span>
                    {selectedProduct?.originalFileName && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 break-all">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span>{selectedProduct.originalFileName}</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Order ID
                    </span>
                    <span className="font-mono font-bold text-slate-900 break-all">
                      {selectedOrder.id}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700">
                      Suggested Email Subject &amp; Message
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(
                          `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`,
                          'modal-copy-msg'
                        )
                      }
                      className="inline-flex items-center gap-1 min-h-[36px] sm:min-h-0 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      {copiedKey === 'modal-copy-msg' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy Subject &amp; Message</span>
                    </button>
                  </div>

                  <div className="p-3 rounded bg-white border border-slate-200 space-y-1.5">
                    <div className="font-semibold text-slate-900 break-words">
                      Subject: {emailDraft.subject}
                    </div>
                    <pre className="text-[11px] text-slate-600 whitespace-pre-wrap break-words font-sans leading-relaxed">
                      {emailDraft.body}
                    </pre>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2.5 pt-1">
                  <a
                    href={emailDraft.gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Open in Gmail Compose</span>
                  </a>

                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void handleMarkDelivered()}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {selectedOrder.deliveryStatus === 'Delivered'
                        ? 'Already Marked Delivered (Update Note)'
                        : 'Mark as Delivered'}
                    </span>
                  </button>
                </div>

                {selectedOrder.deliveredAt && (
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Marked Delivered on{' '}
                      {new Date(selectedOrder.deliveredAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
