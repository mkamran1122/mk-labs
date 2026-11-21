import React, { useState, useEffect } from 'react';
import { DownloadCloud, Search, Filter, RefreshCw, HardDrive, Users, FileText } from 'lucide-react';
import { DownloadEvent, DigitalProduct } from '../../types/store';
import { StoreApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

export const AdminDownloadsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [downloads, setDownloads] = useState<DownloadEvent[]>([]);
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [dlData, prodData] = await Promise.all([
        StoreApi.getAdminDownloads({
          productId: selectedProductId !== 'all' ? selectedProductId : undefined,
          limit: 150,
        }),
        StoreApi.getAdminProducts(),
      ]);
      setDownloads(dlData);
      setProducts(prodData.products);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [isAdmin, selectedProductId]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Metrics
  const totalDownloads = downloads.length;
  const uniqueProducts = new Set(downloads.map((d) => d.productId)).size;
  const customerDownloads = downloads.filter((d) => d.userId).length;
  const totalBytesTransferred = downloads.reduce((acc, d) => acc + (d.fileSize || 0), 0);

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
    <AdminLayout currentTab="downloads">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Email PDF Delivery Logs</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit log of verified orders marked as manually delivered via email PDF attachment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchData()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Refresh Logs</span>
          </button>
        </div>

        {/* Analytics KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Delivered</span>
              <DownloadCloud className="w-4 h-4 text-blue-600 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{totalDownloads}</div>
            <p className="text-[10px] text-slate-500 mt-1">Email PDF orders delivered</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Titles</span>
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{uniqueProducts}</div>
            <p className="text-[10px] text-slate-500 mt-1">Products delivered</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Signed-In Users</span>
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{customerDownloads}</div>
            <p className="text-[10px] text-slate-500 mt-1">
              {totalDownloads > 0 ? `${Math.round((customerDownloads / totalDownloads) * 100)}% registered` : '0%'}
            </p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">PDF Volume</span>
              <HardDrive className="w-4 h-4 text-amber-600 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{formatFileSize(totalBytesTransferred)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Recorded PDF metadata size</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-sm min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by file, title, or customer email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded-md focus:outline-hidden focus:border-blue-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              aria-label="Filter delivery logs by product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full sm:w-auto min-w-0 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded-md py-1.5 px-2 bg-white text-slate-800 focus:outline-hidden"
            >
              <option value="all">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Downloads Table & Mobile Cards */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          {/* Mobile Delivery Log Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                Loading email PDF delivery records...
              </div>
            ) : filteredDownloads.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                No delivered orders recorded yet. Mark verified orders Delivered in Admin → Orders.
              </div>
            ) : (
              filteredDownloads.map((dl) => (
                <div key={dl.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-slate-900 min-w-0 break-words">
                      {dl.productTitle || 'Digital Asset'}
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {dl.ipAddress || 'Email Sent'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {new Date(dl.createdAt || dl.timestamp || Date.now()).toLocaleString()}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 break-all">
                      {dl.fileName}
                    </span>
                    <span className="font-mono text-[11px] text-slate-700 font-semibold break-all">
                      Order: {dl.productFileId}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 break-all">
                    Recipient:{' '}
                    {dl.userEmail ? (
                      <span className="text-slate-800 font-medium">{dl.userEmail}</span>
                    ) : (
                      <span className="text-slate-400 italic">Guest</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Delivery Log Table */}
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
                      No delivered orders recorded yet. Mark verified orders Delivered in Admin → Orders.
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
                        {dl.ipAddress || 'Email Sent'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
