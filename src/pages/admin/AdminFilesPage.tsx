import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Mail,
  Image as ImageIcon,
  Edit,
  CheckCircle2,
} from 'lucide-react';
import { DigitalProduct } from '../../types/store';
import { StoreApi } from '../../services/api';
import { useRouter } from '../../hooks/useRouter';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

export const AdminFilesPage: React.FC = () => {
  const { navigate } = useRouter();
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const res = await StoreApi.getAdminProducts();
      setProducts(res.products);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Failed to load product delivery details.'
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
    void fetchProducts();
  }, [isAdmin, fetchProducts]);

  const withLocalRefCount = products.filter((p) =>
    Boolean(p.originalFileName?.trim())
  ).length;
  const publishedCount = products.filter((p) => p.status === 'published').length;
  const coverImagesCount = products.filter((p) =>
    Boolean(p.coverImageUrl?.trim())
  ).length;

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.originalFileName || '').toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout currentTab="files">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Delivery Assets &amp; PDF References
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Firebase Storage is not used on the Starter Tier. Products are fulfilled manually by emailing your local PDF files after payment verification.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchProducts()}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-3.5 py-2 sm:py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer self-start"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {loadError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {loadError}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Email Delivery Products
              </span>
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {publishedCount}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Published products available for manual order
            </p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Local PDF Filenames Set
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {withLocalRefCount}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Products with a local filename reminder
            </p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Cover URLs Attached
              </span>
              <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {coverImagesCount}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              External/public image URL previews
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product or local PDF filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] sm:min-h-0 pl-8 pr-3 py-2 sm:py-1.5 text-base sm:text-xs border border-slate-300 rounded-md focus:outline-hidden focus:border-blue-500 text-slate-800"
            />
          </div>

          <select
            aria-label="Filter by product status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded-md py-2 sm:py-1.5 px-2.5 bg-white text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Product Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Table & Mobile Cards */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          {/* Mobile Asset Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="px-4 py-10 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                Loading product delivery inventory...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-slate-400">
                No products match your filter.
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <div key={prod.id} className="p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 bg-blue-50 rounded border border-blue-200 shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900 block break-words">
                          {prod.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block break-all">
                          /{prod.slug}
                        </span>
                      </div>
                    </div>
                    <span className="capitalize text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {prod.status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="font-mono text-[11px] text-slate-700 break-all">
                      {prod.originalFileName || 'Attach manually from computer'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Delivery: Manual Email (Gmail)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/admin/products/${prod.id}/edit`)}
                    className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Local PDF Reference</th>
                  <th className="px-4 py-3">Delivery Mode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                      Loading product delivery inventory...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      No products match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-blue-50 rounded border border-blue-200 shrink-0">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {prod.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              /{prod.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        {prod.originalFileName || 'Attach manually from computer'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        Manual Email (Gmail)
                      </td>
                      <td className="px-4 py-3.5 capitalize font-medium text-slate-700">
                        {prod.status}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/products/${prod.id}/edit`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit Details</span>
                        </button>
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
