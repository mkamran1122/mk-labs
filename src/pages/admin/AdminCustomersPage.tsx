import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  AlertTriangle,
  X,
} from 'lucide-react';
import { UserProfile, DownloadEvent } from '../../types/store';
import { StoreApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

export const AdminCustomersPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'downloads'>('members');
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [downloads, setDownloads] = useState<DownloadEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [confirmStatusTarget, setConfirmStatusTarget] =
    useState<UserProfile | null>(null);

  // Selected customer for inspection modal
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const [custRes, dlRes] = await Promise.all([
        StoreApi.getAdminCustomers(),
        StoreApi.getAdminDownloads({ limit: 200 }),
      ]);
      setCustomers(custRes);
      setDownloads(dlRes);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to load customer records.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    void fetchData();
  }, [isAdmin]);

  const confirmToggleStatus = async () => {
    if (!confirmStatusTarget) return;
    const customer = confirmStatusTarget;
    const currentStatus = customer.accountStatus || customer.status || 'active';
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      setUpdatingId(customer.id);
      setErrorMsg('');
      await StoreApi.updateCustomerStatus(customer.id, nextStatus);
      setConfirmStatusTarget(null);
      setNoticeMsg(
        `Account ${customer.email} is now marked ${nextStatus}.`
      );
      await fetchData();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to update customer status.'
      );
      setConfirmStatusTarget(null);
    } finally {
      setUpdatingId(null);
    }
  };

  const getCustomerDownloadCount = (custEmail: string, custId: string) => {
    return downloads.filter(
      (d) => (d.userId && d.userId === custId) || (d.userEmail && d.userEmail.toLowerCase() === custEmail.toLowerCase())
    ).length;
  };

  const getCustomerDownloads = (custEmail: string, custId: string) => {
    return downloads.filter(
      (d) => (d.userId && d.userId === custId) || (d.userEmail && d.userEmail.toLowerCase() === custEmail.toLowerCase())
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeCount = customers.filter((c) => (c.accountStatus || c.status) === 'active').length;
  const suspendedCount = customers.filter((c) => (c.accountStatus || c.status) === 'suspended').length;
  const totalDownloads = downloads.length;

  const filteredCustomers = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDownloads = downloads.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.productTitle?.toLowerCase().includes(q) ||
      d.fileName?.toLowerCase().includes(q) ||
      d.userEmail?.toLowerCase().includes(q) ||
      d.ipAddress?.includes(q)
    );
  });

  return (
    <AdminLayout currentTab="customers">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Customers &amp; Delivery Records
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage registered customer accounts, moderation status, and review completed email PDF order deliveries.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchData()}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Refresh Records</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {noticeMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{noticeMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setNoticeMsg('')}
              className="font-semibold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Total Members
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{customers.length}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Registered accounts</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Active Accounts
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">{activeCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Access granted</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Suspended
            </span>
            <div className="text-xl sm:text-2xl font-bold text-amber-600">{suspendedCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Restricted</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Total Deliveries
            </span>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalDownloads}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Email PDF orders delivered</p>
          </div>
        </div>

        {/* Tab switch & Search */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 border-b sm:border-b-0 border-slate-100 pb-2.5 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`min-h-[40px] sm:min-h-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Registered Members ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('downloads')}
              className={`min-h-[40px] sm:min-h-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'downloads'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Delivered Orders ({downloads.length})
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'members' ? 'Search members by name or email...' : 'Search downloads by file, product, or email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] sm:min-h-0 pl-8 pr-3 py-2 sm:py-1.5 text-base sm:text-xs border border-slate-300 rounded-md focus:outline-hidden focus:border-blue-500 text-slate-800"
            />
          </div>
        </div>

        {/* Tab 1: Customers Table & Mobile Cards */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            {/* Mobile Customer Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                  Loading member accounts...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-slate-400">
                  No customer accounts found.
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const isCustomerActive = (cust.accountStatus || cust.status) === 'active';
                  const dlCount = getCustomerDownloadCount(cust.email, cust.id);

                  return (
                    <div key={cust.id} className="p-3.5 space-y-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-sm break-words">
                            {cust.fullName || 'Member'}
                          </div>
                          <div className="text-slate-500 text-[11px] font-mono break-all">
                            {cust.email}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {isCustomerActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                              <AlertCircle className="w-3 h-3" />
                              Suspended
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 uppercase">
                          {cust.role}
                        </span>
                        <span>{dlCount} delivered</span>
                        <span>· Joined {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : '—'}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(cust)}
                          className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View Orders ({dlCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmStatusTarget(cust)}
                          disabled={updatingId === cust.id}
                          className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                            isCustomerActive
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {updatingId === cust.id
                            ? 'Updating...'
                            : isCustomerActive
                            ? 'Suspend'
                            : 'Reactivate'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Customer Profile</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Downloads</th>
                    <th className="px-4 py-3">Joined Date</th>
                    <th className="px-4 py-3">Account Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                        Loading member accounts...
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No customer accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const isCustomerActive = (cust.accountStatus || cust.status) === 'active';
                      const dlCount = getCustomerDownloadCount(cust.email, cust.id);

                      return (
                        <tr key={cust.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-900">{cust.fullName || 'Member'}</div>
                            <div className="text-slate-500 text-[11px] font-mono">{cust.email}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 uppercase">
                              {cust.role}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => setSelectedCustomer(cust)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded font-semibold text-[11px] cursor-pointer"
                              title="Click to view downloaded files"
                            >
                              <Download className="w-3 h-3" />
                              <span>{dlCount} delivered</span>
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                            {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            {isCustomerActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                                <AlertCircle className="w-3 h-3" />
                                Suspended
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => setSelectedCustomer(cust)}
                              className="px-2.5 py-1 rounded text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                            >
                              View Orders
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmStatusTarget(cust)}
                              disabled={updatingId === cust.id}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                                isCustomerActive
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {updatingId === cust.id
                                ? 'Updating...'
                                : isCustomerActive
                                ? 'Suspend'
                                : 'Reactivate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: All Download Events */}
        {activeTab === 'downloads' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            {/* Mobile Delivered Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                  Loading email PDF delivery records...
                </div>
              ) : filteredDownloads.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-slate-400">
                  No delivered orders recorded yet.
                </div>
              ) : (
                filteredDownloads.map((dl) => (
                  <div key={dl.id} className="p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-900 break-words">
                        {dl.productTitle || 'Digital Asset'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        {new Date(dl.createdAt || dl.timestamp || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 break-all">
                        {dl.fileName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-700 font-semibold break-all">
                        #{dl.productFileId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 break-all">
                      {dl.userEmail || 'Guest'} · {dl.ipAddress || 'Manual'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">PDF Reference</th>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                        Loading email PDF delivery records...
                      </td>
                    </tr>
                  ) : filteredDownloads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No delivered orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredDownloads.map((dl) => (
                      <tr key={dl.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(dl.createdAt || dl.timestamp || Date.now()).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {dl.productTitle || 'Digital Asset'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {dl.fileName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700 font-semibold">
                          {dl.productFileId}
                        </td>
                        <td className="px-4 py-3.5">
                          {dl.userEmail ? (
                            <span className="text-slate-800 font-medium">{dl.userEmail}</span>
                          ) : (
                            <span className="text-slate-400 italic">Guest</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-slate-600 font-medium">
                          {dl.ipAddress || 'Manual'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Delivery History Inspection Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-lg max-w-xl w-full max-h-[90dvh] flex flex-col border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-start sm:items-center justify-between gap-3 bg-slate-50">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 break-words">
                    {selectedCustomer.fullName || 'Member'}&apos;s Delivered Orders
                  </h3>
                  <p className="text-xs text-slate-500 font-mono break-all">{selectedCustomer.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="w-10 h-10 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                  aria-label="Close customer orders"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                {getCustomerDownloads(selectedCustomer.email, selectedCustomer.id).length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">
                    No email PDF deliveries recorded for this customer yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {getCustomerDownloads(selectedCustomer.email, selectedCustomer.id).map((dl) => (
                      <div
                        key={dl.id}
                        className="p-3 bg-slate-50 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 break-words">{dl.productTitle}</div>
                          <div className="text-slate-500 font-mono text-[11px] mt-0.5 break-all">
                            Order {dl.productFileId} • {dl.fileName}
                            {dl.fileSize ? ` • ${formatFileSize(dl.fileSize)}` : ''}
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-slate-500">
                            {new Date(dl.createdAt || dl.timestamp || Date.now()).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Delivered
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Total: <strong>{getCustomerDownloads(selectedCustomer.email, selectedCustomer.id).length}</strong> delivered orders
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="min-h-[40px] sm:min-h-0 px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Account Status Change Modal */}
        {confirmStatusTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>
                  {(confirmStatusTarget.accountStatus || confirmStatusTarget.status) ===
                  'active'
                    ? 'Suspend Customer Account'
                    : 'Reactivate Customer Account'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed break-words">
                Are you sure you want to{' '}
                {(confirmStatusTarget.accountStatus || confirmStatusTarget.status) ===
                'active'
                  ? 'suspend'
                  : 'reactivate'}{' '}
                <strong className="text-slate-900 break-all">
                  {confirmStatusTarget.email}
                </strong>
                ?
              </p>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmStatusTarget(null)}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingId === confirmStatusTarget.id}
                  onClick={() => void confirmToggleStatus()}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                >
                  Confirm Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
