import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { Category, StoreSubcategory } from '../../types/store';
import { StoreApi } from '../../services/api';
import { fetchAllSubcategoriesAdmin } from '../../services/firestoreStore';
import {
  initializeCategoriesInFirestore,
  CategoryInitSummary,
} from '../../services/categorySeed';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

export const AdminCategoriesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<StoreSubcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSummary, setSeedSummary] = useState<CategoryInitSummary | null>(
    null
  );
  const [seedError, setSeedError] = useState('');

  // Modal / form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Subcategory modal / delete state
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [currentSubId, setCurrentSubId] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subOrder, setSubOrder] = useState(1);
  const [subActive, setSubActive] = useState(true);
  const [subError, setSubError] = useState('');
  const [deleteSubTarget, setDeleteSubTarget] = useState<StoreSubcategory | null>(
    null
  );

  const fetchCats = async () => {
    try {
      setIsLoading(true);
      const [catsRes, subsRes] = await Promise.all([
        StoreApi.getAdminCategories(),
        fetchAllSubcategoriesAdmin().catch(() => [] as StoreSubcategory[]),
      ]);
      setCategories(catsRes);
      setSubcategories(subsRes);
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
    void fetchCats();
  }, [isAdmin]);

  const handleInitializeDefaults = async () => {
    setSeedError('');
    setSeedSummary(null);
    setIsSeeding(true);
    try {
      const summary = await initializeCategoriesInFirestore();
      setSeedSummary(summary);
      await fetchCats();
    } catch (err: unknown) {
      setSeedError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize categories in Firestore.'
      );
    } finally {
      setIsSeeding(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setSlug('');
    setDescription('');
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setDisplayOrder(cat.displayOrder || 1);
    setIsActive(cat.isActive);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    try {
      if (isEditing && currentId) {
        await StoreApi.updateCategory(currentId, {
          name,
          slug:
            slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description,
          displayOrder: Number(displayOrder),
          isActive,
        });
      } else {
        await StoreApi.createCategory({
          name,
          slug:
            slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description,
          displayOrder: Number(displayOrder),
          isActive,
        });
      }
      setIsModalOpen(false);
      setCurrentId(null);
      await fetchCats();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Category save failed.'
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await StoreApi.deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      await fetchCats();
    } catch (err: unknown) {
      setSeedError(
        err instanceof Error ? err.message : 'Failed to delete category.'
      );
    }
  };

  const openCreateSubModal = (cat: Category) => {
    const existingCount = subcategories.filter(
      (s) => s.categoryId === cat.id
    ).length;
    setIsEditingSub(false);
    setCurrentSubId(null);
    setSubCategoryId(cat.id);
    setSubName('');
    setSubSlug('');
    setSubOrder(existingCount + 1);
    setSubActive(true);
    setSubError('');
    setIsSubModalOpen(true);
  };

  const openEditSubModal = (sub: StoreSubcategory) => {
    setIsEditingSub(true);
    setCurrentSubId(sub.id);
    setSubCategoryId(sub.categoryId);
    setSubName(sub.name);
    setSubSlug(sub.slug);
    setSubOrder(sub.displayOrder || 1);
    setSubActive(sub.active);
    setSubError('');
    setIsSubModalOpen(true);
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError('');
    if (subName.trim().length < 2) {
      setSubError('Subcategory name must be at least 2 characters.');
      return;
    }
    if (!subCategoryId) {
      setSubError('Parent category is required.');
      return;
    }
    try {
      if (isEditingSub && currentSubId) {
        await StoreApi.updateSubcategory(currentSubId, {
          categoryId: subCategoryId,
          name: subName,
          slug: subSlug,
          displayOrder: Number(subOrder),
          active: subActive,
        });
      } else {
        await StoreApi.createSubcategory({
          categoryId: subCategoryId,
          name: subName,
          slug: subSlug,
          displayOrder: Number(subOrder),
          active: subActive,
        });
      }
      setIsSubModalOpen(false);
      setCurrentSubId(null);
      await fetchCats();
    } catch (err: unknown) {
      setSubError(
        err instanceof Error ? err.message : 'Subcategory save failed.'
      );
    }
  };

  const confirmDeleteSubcategory = async () => {
    if (!deleteSubTarget) return;
    try {
      await StoreApi.deleteSubcategory(deleteSubTarget.id);
      setDeleteSubTarget(null);
      await fetchCats();
    } catch (err: unknown) {
      setSeedError(
        err instanceof Error ? err.message : 'Failed to delete subcategory.'
      );
      setDeleteSubTarget(null);
    }
  };

  return (
    <AdminLayout currentTab="categories">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Categories &amp; Subcategories
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Cloud Firestore categories and safely initialize the default 6-category taxonomy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleInitializeDefaults}
              disabled={isSeeding}
              className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Database className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {isSeeding
                  ? 'Syncing...'
                  : 'Sync / Initialize Categories'}
              </span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Category</span>
            </button>
          </div>
        </div>

        {seedSummary && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">
                Category & Subcategory Sync Completed
              </strong>
              <span>
                Categories: {seedSummary.categoriesCreated} created,{' '}
                {seedSummary.categoriesUpdated} updated,{' '}
                {seedSummary.categoriesSkipped} preserved. Subcategories:{' '}
                {seedSummary.subcategoriesCreated} created,{' '}
                {seedSummary.subcategoriesUpdated} updated,{' '}
                {seedSummary.subcategoriesSkipped} preserved.
              </span>
            </div>
          </div>
        )}

        {seedError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {seedError}
          </div>
        )}

        {/* Categories Table & Mobile Cards */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          {/* Mobile Category Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                Loading categories from Firestore...
              </div>
            ) : categories.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-slate-500">
                No categories exist in Firestore yet. Tap{' '}
                <strong>Sync / Initialize Categories</strong> above to seed all 6 categories and 25 subcategories safely.
              </div>
            ) : (
              categories.map((cat) => {
                const childSubs = subcategories.filter(
                  (s) => s.categoryId === cat.id
                );
                return (
                  <div key={cat.id} className="p-3.5 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-sm block break-words">
                          {cat.name}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 block break-all">
                          /{cat.slug} · Order {cat.displayOrder} · {cat.productCount || 0} products
                        </span>
                      </div>
                      <div className="shrink-0">
                        {cat.isActive ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    {cat.description && (
                      <p className="text-[11px] text-slate-500 leading-relaxed break-words">
                        {cat.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5">
                      {childSubs.map((sub) => (
                        <span
                          key={sub.id}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border ${
                            sub.active
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                          }`}
                        >
                          <span>{sub.name}</span>
                          <button
                            type="button"
                            onClick={() => openEditSubModal(sub)}
                            className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                            title={`Edit ${sub.name}`}
                            aria-label={`Edit subcategory ${sub.name}`}
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteSubTarget(sub)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                            title={`Delete ${sub.name}`}
                            aria-label={`Delete subcategory ${sub.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => openCreateSubModal(cat)}
                        className="inline-flex items-center gap-1 min-h-[34px] text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Subcategory</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Category</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
                        className="w-10 h-10 flex items-center justify-center rounded-md bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer"
                        title="Delete Category"
                        aria-label="Delete Category"
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
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Category & Subcategories</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                      Loading categories from Firestore...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No categories exist in Firestore yet. Click{' '}
                      <strong>Sync / Initialize Categories</strong> above to seed all 6 categories and 25 subcategories safely.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => {
                    const childSubs = subcategories.filter(
                      (s) => s.categoryId === cat.id
                    );
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3.5 max-w-md">
                          <span className="font-bold text-slate-900 block">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {cat.description}
                          </span>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {childSubs.map((sub) => (
                              <span
                                key={sub.id}
                                className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                                  sub.active
                                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                                    : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                                }`}
                              >
                                <span>{sub.name}</span>
                                <button
                                  type="button"
                                  onClick={() => openEditSubModal(sub)}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer"
                                  title={`Edit ${sub.name}`}
                                  aria-label={`Edit subcategory ${sub.name}`}
                                >
                                  <Edit className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteSubTarget(sub)}
                                  className="text-slate-400 hover:text-red-600 cursor-pointer"
                                  title={`Delete ${sub.name}`}
                                  aria-label={`Delete subcategory ${sub.name}`}
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                            <button
                              type="button"
                              onClick={() => openCreateSubModal(cat)}
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add Sub</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">
                          {cat.slug}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {cat.productCount || 0}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {cat.displayOrder}
                        </td>
                        <td className="px-4 py-3.5">
                          {cat.isActive ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(cat)}
                            className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                            title="Delete"
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

        {/* Create / Edit Category Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto border border-slate-200 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Category' : 'Create New Category'}
              </h3>

              {errorMsg && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!isEditing) {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '')
                        );
                      }
                    }}
                    required
                    className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 border border-slate-300 rounded text-base sm:text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 border border-slate-300 rounded text-base sm:text-xs text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-base sm:text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={displayOrder}
                      onChange={(e) =>
                        setDisplayOrder(parseInt(e.target.value, 10) || 1)
                      }
                      className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 border border-slate-300 rounded text-base sm:text-xs text-slate-900"
                    />
                  </div>

                  <div className="flex items-center min-h-[44px] sm:min-h-0 pb-1">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setCurrentId(null);
                    }}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 bg-slate-100 text-slate-700 rounded font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 cursor-pointer"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Delete Category</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed break-words">
                Are you sure you want to delete{' '}
                <strong className="text-slate-900">
                  &quot;{deleteTarget.name}&quot;
                </strong>
                ?
              </p>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Subcategory Modal */}
        {isSubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90dvh] overflow-y-auto border border-slate-200 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                {isEditingSub ? 'Edit Subcategory' : 'Add Subcategory'}
              </h3>

              {subError && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                  {subError}
                </div>
              )}

              <form onSubmit={handleSaveSubcategory} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Parent Category *
                  </label>
                  <select
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    required
                    className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 border border-slate-300 rounded text-base sm:text-xs text-slate-900 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subcategory Name *
                  </label>
                  <input
                    type="text"
                    value={subName}
                    onChange={(e) => {
                      setSubName(e.target.value);
                      if (!isEditingSub) {
                        setSubSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '')
                        );
                      }
                    }}
                    required
                    minLength={2}
                    placeholder="e.g. Resume & CV Templates"
                    className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 border border-slate-300 rounded text-base sm:text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={subSlug}
                    onChange={(e) => setSubSlug(e.target.value)}
                    className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 border border-slate-300 rounded text-base sm:text-xs text-slate-900 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={subOrder}
                      onChange={(e) =>
                        setSubOrder(parseInt(e.target.value, 10) || 1)
                      }
                      className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 border border-slate-300 rounded text-base sm:text-xs text-slate-900"
                    />
                  </div>
                  <div className="flex items-center min-h-[44px] sm:min-h-0 pb-1">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={subActive}
                        onChange={(e) => setSubActive(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubModalOpen(false);
                      setCurrentSubId(null);
                    }}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 bg-slate-100 text-slate-700 rounded font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 cursor-pointer"
                  >
                    Save Subcategory
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Subcategory Confirmation Modal */}
        {deleteSubTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Delete Subcategory</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed break-words">
                Are you sure you want to delete subcategory{' '}
                <strong className="text-slate-900">
                  &quot;{deleteSubTarget.name}&quot;
                </strong>
                ?
              </p>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteSubTarget(null)}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDeleteSubcategory()}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 cursor-pointer"
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
