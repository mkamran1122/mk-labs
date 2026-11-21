import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  FileEdit,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { BlogPostRecord, BlogStatus } from '../../types/blog';
import {
  fetchAllBlogsAdmin,
  updateBlogStatusAdmin,
  deleteBlogAdmin,
} from '../../services/firestoreBlog';
import { formatBlogDate } from '../../services/blogValidation';
import { useRouter } from '../../hooks/useRouter';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

export const AdminBlogsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { isAdmin } = useAuth();

  const [blogs, setBlogs] = useState<BlogPostRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BlogStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<BlogPostRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadBlogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError(null);
      const data = await fetchAllBlogsAdmin();
      setBlogs(data);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : 'Failed to load blog posts.'
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
    void loadBlogs();
  }, [isAdmin, loadBlogs]);

  const filteredBlogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return blogs.filter((b) => {
      const matchesStatus =
        statusFilter === 'all' || b.status === statusFilter;
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.shortDescription.toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [blogs, searchQuery, statusFilter]);

  const handleToggleStatus = async (post: BlogPostRecord) => {
    const nextStatus: BlogStatus =
      post.status === 'published' ? 'draft' : 'published';
    try {
      setActionLoadingId(post.id);
      setPageError(null);
      await updateBlogStatusAdmin(post.id, nextStatus);
      setPageNotice(
        nextStatus === 'published'
          ? `"${post.title}" is now published on /blog.`
          : `"${post.title}" moved back to Draft.`
      );
      await loadBlogs();
    } catch (err) {
      setPageError(
        err instanceof Error
          ? err.message
          : 'Failed to update blog post status.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoadingId(deleteTarget.id);
      setDeleteError(null);
      setPageError(null);
      await deleteBlogAdmin(deleteTarget.id);
      const deletedTitle = deleteTarget.title;
      setDeleteTarget(null);
      setPageNotice(`Deleted "${deletedTitle}" from Firestore.`);
      await loadBlogs();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to delete blog post.';
      setDeleteError(msg);
      setPageError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusBadge = (status: BlogStatus) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          <span>Published</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
        <FileEdit className="w-3 h-3" />
        <span>Draft</span>
      </span>
    );
  };

  const publishedCount = blogs.filter((b) => b.status === 'published').length;
  const draftCount = blogs.filter((b) => b.status === 'draft').length;

  return (
    <AdminLayout currentTab="blogs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Blog Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Write, edit, publish, and manage MK Labs journal articles ({publishedCount} published · {draftCount} draft).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadBlogs()}
              className="w-11 h-11 sm:w-auto sm:h-auto sm:p-2 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Refresh blog posts"
              aria-label="Refresh blog posts"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/blogs/new')}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Blog Post</span>
            </button>
          </div>
        </div>

        {pageError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 break-words">{pageError}</div>
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
              className="text-emerald-700 hover:underline font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blog posts by title..."
              className="w-full min-h-[44px] sm:min-h-0 pl-9 pr-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              aria-label="Filter blogs by status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | BlogStatus)
              }
              className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="all">All Statuses ({blogs.length})</option>
              <option value="published">Published ({publishedCount})</option>
              <option value="draft">Draft ({draftCount})</option>
            </select>
          </div>
        </div>

        {/* Blogs Table & Mobile Cards */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          {/* Mobile Article Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                Loading blog posts...
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="px-4 py-12 text-center space-y-2 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">
                  {blogs.length === 0
                    ? 'No blog posts created yet'
                    : 'No blog posts match your filters'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Create an article to share updates, guides, and stories on `/blog`.
                </p>
                {blogs.length === 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/blogs/new')}
                    className="mt-2 inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Post</span>
                  </button>
                )}
              </div>
            ) : (
              filteredBlogs.map((post) => {
                const displayDate = formatBlogDate(
                  post.publishedAt || post.updatedAt || post.createdAt
                );
                return (
                  <div key={post.id} className="p-3.5 space-y-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {post.coverImageUrl ? (
                          <img
                            src={post.coverImageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 text-sm break-words line-clamp-2">
                            {post.title}
                          </span>
                          <div className="shrink-0">
                            {renderStatusBadge(post.status)}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 break-all mt-0.5">
                          /blog/{post.slug}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {post.category || 'General'} · {post.authorName || 'MK Labs'} · {displayDate || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/blogs/${post.id}/edit`)}
                        className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {post.status === 'published' ? (
                        <button
                          type="button"
                          onClick={() => void handleToggleStatus(post)}
                          disabled={actionLoadingId === post.id}
                          className="flex-1 min-h-[40px] inline-flex items-center justify-center px-3 py-1.5 font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 cursor-pointer disabled:opacity-40"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleToggleStatus(post)}
                          disabled={actionLoadingId === post.id}
                          className="flex-1 min-h-[40px] inline-flex items-center justify-center px-3 py-1.5 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 cursor-pointer disabled:opacity-40"
                        >
                          Publish
                        </button>
                      )}

                      {post.status === 'published' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/blog/${post.slug}`)}
                          className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-md cursor-pointer"
                          title="View Published Article"
                          aria-label="View Published Article"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(post);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-red-600 hover:text-red-700 bg-red-50 border border-red-200 rounded-md cursor-pointer"
                        title="Delete Post"
                        aria-label="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Article</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
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
                      Loading blog posts...
                    </td>
                  </tr>
                ) : filteredBlogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center space-y-2 text-slate-500"
                    >
                      <p className="font-semibold text-slate-700">
                        {blogs.length === 0
                          ? 'No blog posts created yet'
                          : 'No blog posts match your filters'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Create an article to share updates, guides, and stories on `/blog`.
                      </p>
                      {blogs.length === 0 && (
                        <button
                          type="button"
                          onClick={() => navigate('/admin/blogs/new')}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create First Post</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredBlogs.map((post) => {
                    const displayDate = formatBlogDate(
                      post.publishedAt || post.updatedAt || post.createdAt
                    );

                    return (
                      <tr
                        key={post.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-4 py-3.5 min-w-[260px] max-w-[360px]">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {post.coverImageUrl ? (
                                <img
                                  src={post.coverImageUrl}
                                  alt={post.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FileText className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">
                                {post.title}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                /blog/{post.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-700">
                          {post.category || '—'}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600">
                          {post.authorName || 'MK Labs'}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {renderStatusBadge(post.status)}
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          {displayDate || '—'}
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                          {post.status === 'published' && (
                            <button
                              type="button"
                              onClick={() => navigate(`/blog/${post.slug}`)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                              title="View Published Article"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/blogs/${post.id}/edit`)
                            }
                            className="p-1.5 text-blue-600 hover:text-blue-800 rounded cursor-pointer"
                            title="Edit Post"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {post.status === 'published' ? (
                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(post)}
                              disabled={actionLoadingId === post.id}
                              className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded hover:bg-amber-100 cursor-pointer disabled:opacity-40"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(post)}
                              disabled={actionLoadingId === post.id}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 cursor-pointer disabled:opacity-40"
                            >
                              Publish
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(post);
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 rounded cursor-pointer"
                            title="Delete Post"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Confirm Blog Deletion</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed break-words">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">"{deleteTarget.title}"</strong>?
                This action cannot be undone.
              </p>

              {deleteError && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-800 break-words">
                  {deleteError}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteTarget(null);
                  }}
                  disabled={actionLoadingId === deleteTarget.id}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={actionLoadingId === deleteTarget.id}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoadingId === deleteTarget.id
                    ? 'Deleting...'
                    : 'Delete Post'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
