import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  FileEdit,
  Archive,
  FolderTree,
  Users,
  Download,
  Plus,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { StoreDashboardStats } from '../../types/store';
import { StoreApi } from '../../services/api';
import { useRouter } from '../../hooks/useRouter';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

export const AdminDashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<StoreDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await StoreApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    fetchStats();
  }, [isAdmin]);

  return (
    <AdminLayout currentTab="dashboard">
      <div className="space-y-6 sm:space-y-8">
        {/* Page Title & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Store Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time store metrics, digital product status, and download records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchStats}
              className="w-11 h-11 sm:w-auto sm:h-auto sm:p-2 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Refresh Stats"
              aria-label="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <span>Manage Orders</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products/new')}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* 8 Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Products
              </span>
              <Package className="w-4 h-4 text-blue-600 shrink-0" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              {stats?.totalProducts ?? 0}
            </span>
            <div className="mt-1.5 sm:mt-2 text-[11px] text-slate-500">Catalog items in system</div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Published
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-emerald-600">
              {stats?.publishedProducts ?? 0}
            </span>
            <div className="mt-1.5 sm:mt-2 text-[11px] text-slate-500">Visible in digital store</div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Drafts &amp; Review
              </span>
              <FileEdit className="w-4 h-4 text-amber-600 shrink-0" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-amber-600">
              {stats?.draftProducts ?? 0}
            </span>
            <div className="mt-1.5 sm:mt-2 text-[11px] text-slate-500">Unpublished internal drafts</div>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Delivered Orders
              </span>
              <Download className="w-4 h-4 text-indigo-600 shrink-0" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-indigo-600">
              {stats?.totalDownloads ?? 0}
            </span>
            <div className="mt-1.5 sm:mt-2 text-[11px] text-slate-500">Email PDFs marked delivered</div>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <FolderTree className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-slate-500 block">Active Categories</span>
                <span className="text-base font-bold text-slate-900">{stats?.totalCategories ?? 0}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/categories')}
              className="min-h-[40px] px-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer shrink-0"
            >
              Manage →
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-slate-500 block">Order Customers</span>
                <span className="text-base font-bold text-slate-900">{stats?.totalCustomers ?? 0}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="min-h-[40px] px-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer shrink-0"
            >
              Orders →
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <Archive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-slate-500 block">Archived Items</span>
                <span className="text-base font-bold text-slate-900">{stats?.archivedProducts ?? 0}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="min-h-[40px] px-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer shrink-0"
            >
              Filter →
            </button>
          </div>
        </div>

        {/* Recent Activity & Recent Downloads Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">
          {/* Recent Downloads */}
          <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Download className="w-4 h-4 text-blue-600 shrink-0" />
                  <h2 className="text-sm font-bold text-slate-900 truncate">Recent Email PDF Deliveries</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/downloads')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer shrink-0"
                >
                  View All
                </button>
              </div>

              {stats?.recentDownloads && stats.recentDownloads.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {stats.recentDownloads.map((dl) => (
                    <div key={dl.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-800 block truncate">
                          {dl.productTitle || dl.fileName}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {dl.userEmail || 'Customer'} · Order {dl.productFileId} · {dl.ipAddress || 'Manual'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(dl.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No email PDF deliveries marked yet.
                </div>
              )}
            </div>
          </div>

          {/* Recent Admin Audit Activity */}
          <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="w-4 h-4 text-slate-600 shrink-0" />
                  <h2 className="text-sm font-bold text-slate-900 truncate">Admin Audit Activity</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/activity')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer shrink-0"
                >
                  View Log
                </button>
              </div>

              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="divide-y divide-slate-100 text-xs">
                  {stats.recentActivity.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-800 block truncate">
                          {log.summary}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          Action: {log.action} · Actor: {log.actorEmail}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No audit logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
