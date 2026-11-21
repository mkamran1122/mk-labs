import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ShieldCheck, FileEdit, Trash2, PlusCircle } from 'lucide-react';
import { AdminActivityLog } from '../../types/store';
import { StoreApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

export const AdminActivityPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await StoreApi.getAdminActivity();
      setLogs(res);
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
    fetchLogs();
  }, [isAdmin]);

  const getActionBadge = (action: string) => {
    if (action.includes('create') || action.includes('publish')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <PlusCircle className="w-3 h-3" />
          {action}
        </span>
      );
    }
    if (action.includes('delete') || action.includes('archive')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
          <Trash2 className="w-3 h-3" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <FileEdit className="w-3 h-3" />
        {action}
      </span>
    );
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' || l.action.toLowerCase().includes(actionFilter.toLowerCase());

    return matchesSearch && matchesAction;
  });

  return (
    <AdminLayout currentTab="activity">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Admin Activity & Audit Log</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable ledger of administrative actions, file modifications, and store configuration changes.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Refresh Audit Logs</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-sm min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded-md focus:outline-hidden focus:border-blue-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              aria-label="Filter audit logs by action type"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full sm:w-auto flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded-md py-1.5 px-2 bg-white text-slate-800 focus:outline-hidden"
            >
              <option value="all">All Action Types</option>
              <option value="publish">Publish Events</option>
              <option value="create">Creations</option>
              <option value="update">Updates</option>
              <option value="delete">Deletions</option>
            </select>
          </div>
        </div>

        {/* Activity Table & Mobile Cards */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          {/* Mobile Audit Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                Loading audit log records...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                No activity logs match the filter.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-4 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {getActionBadge(log.action)}
                    <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {log.targetType}
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 break-words leading-relaxed">
                    {log.summary}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px] text-slate-500">
                    <span className="font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Administrator</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Audit Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target Entity</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                      Loading audit log records...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No activity logs match the filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{getActionBadge(log.action)}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {log.targetType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">{log.summary}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Administrator</span>
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
