import React, { useState, useEffect } from 'react';
import {
  Tag as TagIcon,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { DigitalProduct } from '../../types/store';
import { StoreApi, TagSummary } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

export const AdminTagsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TagSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const [tagRes, prodRes] = await Promise.all([
        StoreApi.getAdminTagSummaries(),
        StoreApi.getAdminProducts(),
      ]);
      setTags(tagRes);
      setProducts(prodRes.products);
      if (prodRes.products.length > 0 && !selectedProductId) {
        setSelectedProductId(prodRes.products[0].id);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to load tags from Firestore.'
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
    void fetchTags();
  }, [isAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setErrorMsg('');
    setNoticeMsg('');
    setIsCreating(true);

    try {
      const created = await StoreApi.createTag(
        newTagName.trim(),
        selectedProductId || undefined
      );
      setNewTagName('');
      setNoticeMsg(`Added tag "#${created.name}" to the selected product.`);
      await fetchTags();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to assign tag.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setErrorMsg('');
      await StoreApi.deleteTag(deleteTarget.name);
      const removedName = deleteTarget.name;
      setDeleteTarget(null);
      setNoticeMsg(`Removed "#${removedName}" from all linked products.`);
      await fetchTags();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to remove tag.'
      );
      setDeleteTarget(null);
    }
  };

  const filteredTags = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout currentTab="tags">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Tags Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Keywords and metadata used to categorize products and power search filters.
            </p>
          </div>
        </div>

        {/* Create Tag Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <TagIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="New tag name (e.g. Proposal, Automation, Wireframe)..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded-md focus:outline-hidden focus:border-blue-500 text-slate-900"
              />
            </div>
            <select
              aria-label="Target product for new tag"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={products.length === 0}
              className="w-full sm:w-auto px-3 py-2 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-300 rounded-md bg-white text-slate-800 sm:max-w-[240px]"
            >
              {products.length === 0 ? (
                <option value="">No products created yet</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    Assign to: {p.name}
                  </option>
                ))
              )}
            </select>
            <button
              type="submit"
              disabled={isCreating || !newTagName.trim() || products.length === 0}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? 'Adding...' : 'Add Tag'}</span>
            </button>
          </form>
          {errorMsg && <p className="text-[11px] text-red-600 font-medium break-words">{errorMsg}</p>}
          {noticeMsg && (
            <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="break-words">{noticeMsg}</span>
            </div>
          )}
        </div>

        {/* Search & Tags Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 min-h-[44px] sm:min-h-0 text-base sm:text-xs border border-slate-200 rounded-md focus:outline-hidden focus:border-blue-500 text-slate-800"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Total: <strong className="text-slate-800">{tags.length}</strong> tags
            </span>
          </div>

          {/* Mobile Tag Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                Loading tags...
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                No tags assigned to products yet.
              </div>
            ) : (
              filteredTags.map((tag) => (
                <div key={tag.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200 max-w-full break-words">
                        <TagIcon className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{tag.name}</span>
                      </span>
                      <div className="font-mono text-[11px] text-slate-500 break-all">
                        /{tag.slug}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(tag)}
                      className="w-10 h-10 inline-flex items-center justify-center rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title="Remove Tag"
                      aria-label={`Remove tag ${tag.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-700 mr-0.5">
                      {tag.productCount} {tag.productCount === 1 ? 'product' : 'products'}:
                    </span>
                    {tag.products.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 max-w-full truncate"
                      >
                        {p.name}
                      </span>
                    ))}
                    {tag.products.length > 3 && (
                      <span className="text-[11px] text-slate-500">
                        +{tag.products.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Tag Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Tag Name</th>
                  <th className="px-4 py-3">URL Slug</th>
                  <th className="px-4 py-3">Assigned Products</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                      Loading tags...
                    </td>
                  </tr>
                ) : filteredTags.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No tags assigned to products yet.
                    </td>
                  </tr>
                ) : (
                  filteredTags.map((tag) => (
                    <tr key={tag.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200">
                          <TagIcon className="w-3 h-3 text-slate-400" />
                          {tag.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{tag.slug}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[11px] font-semibold text-slate-700 mr-1">
                            {tag.productCount} {tag.productCount === 1 ? 'product' : 'products'}:
                          </span>
                          {tag.products.slice(0, 3).map((p) => (
                            <span
                              key={p.id}
                              className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200"
                            >
                              {p.name}
                            </span>
                          ))}
                          {tag.products.length > 3 && (
                            <span className="text-[10px] text-slate-500">
                              +{tag.products.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(tag)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                          title="Remove Tag"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Delete Tag</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900">"{deleteTarget.name}"</strong>?
                This tag will be unlinked from products that currently reference it.
              </p>
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
