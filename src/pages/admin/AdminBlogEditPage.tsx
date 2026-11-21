import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Eye,
  Edit3,
  X,
} from 'lucide-react';
import { BlogStatus } from '../../types/blog';
import {
  generateNewBlogId,
  fetchBlogByIdAdmin,
  saveBlogAdmin,
} from '../../services/firestoreBlog';
import { validateBlogFormInput } from '../../services/blogValidation';
import { sanitizeSlug } from '../../services/productValidation';
import { MarkdownRenderer } from '../../components/blog/MarkdownRenderer';
import { useRouter } from '../../hooks/useRouter';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';

export const AdminBlogEditPage: React.FC<{ blogId?: string }> = ({
  blogId,
}) => {
  const { navigate } = useRouter();
  const { isAdmin } = useAuth();
  const isEditing = Boolean(blogId && blogId !== 'new');

  const [activeBlogId] = useState<string>(() =>
    blogId && blogId !== 'new' ? blogId : generateNewBlogId()
  );

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saveNotice, setSaveNotice] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverPreviewError, setCoverPreviewError] = useState(false);
  const [authorName, setAuthorName] = useState('MK Labs');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [status, setStatus] = useState<BlogStatus>('draft');
  const [publishedAt, setPublishedAt] = useState<string | undefined>(undefined);

  // Editor toolbar / preview state
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');
  const [showLinkInserter, setShowLinkInserter] = useState(false);
  const [linkLabelInput, setLinkLabelInput] = useState('');
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [showImageInserter, setShowImageInserter] = useState(false);
  const [imgAltInput, setImgAltInput] = useState('');
  const [imgUrlInput, setImgUrlInput] = useState('');

  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isAdmin || !isEditing || !blogId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    async function loadExisting() {
      try {
        setIsLoading(true);
        setErrorMsg('');
        const post = await fetchBlogByIdAdmin(blogId!);
        if (cancelled) return;
        if (!post) {
          setErrorMsg('Requested blog post could not be found.');
          return;
        }
        setTitle(post.title);
        setSlug(post.slug);
        setSlugTouched(true);
        setShortDescription(post.shortDescription);
        setContent(post.content);
        setCoverImageUrl(post.coverImageUrl || '');
        setAuthorName(post.authorName || 'MK Labs');
        setCategory(post.category || '');
        setTags(post.tags || []);
        setStatus(post.status);
        setPublishedAt(post.publishedAt);
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Failed to load blog post.'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadExisting();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, isEditing, blogId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched) {
      setSlug(val.trim() ? sanitizeSlug(val) : '');
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed) && tags.length < 20) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
  };

  const insertAtCursor = (before: string, after = '', placeholder = '') => {
    const textarea = contentRef.current;
    if (!textarea) {
      setContent((prev) => `${prev}${before}${placeholder}${after}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const nextContent =
      content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(nextContent);
    setEditorMode('write');

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + before.length;
      const cursorEnd = cursorStart + selected.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const handleInsertLink = () => {
    const url = linkUrlInput.trim();
    if (!url) return;
    const label = linkLabelInput.trim() || url;
    insertAtCursor(`[${label}](${url})`);
    setLinkLabelInput('');
    setLinkUrlInput('');
    setShowLinkInserter(false);
  };

  const handleInsertImage = () => {
    const url = imgUrlInput.trim();
    if (!url) return;
    const alt = imgAltInput.trim() || 'Article image';
    insertAtCursor(`\n![${alt}](${url})\n`);
    setImgAltInput('');
    setImgUrlInput('');
    setShowImageInserter(false);
  };

  const handleSave = async (targetStatus: BlogStatus) => {
    setErrorMsg('');
    setSaveNotice('');

    const validation = validateBlogFormInput({
      title,
      slug,
      shortDescription,
      content,
      coverImageUrl,
      authorName,
      category,
    });

    if (!validation.valid) {
      setErrorMsg(validation.error || 'Please check required blog fields.');
      return;
    }

    try {
      setIsSaving(true);
      const saved = await saveBlogAdmin(
        {
          id: activeBlogId,
          title,
          slug,
          shortDescription,
          content,
          coverImageUrl,
          authorName: authorName.trim() || 'MK Labs',
          category,
          tags,
          status: targetStatus,
        },
        isEditing
      );

      setStatus(saved.status);
      setSlug(saved.slug);
      setPublishedAt(saved.publishedAt);
      setSaveNotice(
        saved.status === 'published'
          ? 'Blog article published and live at /blog.'
          : 'Blog draft saved.'
      );

      if (!isEditing) {
        navigate(`/admin/blogs/${saved.id}/edit`);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to save blog post.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout currentTab="blogs">
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => navigate('/admin/blogs')}
              className="inline-flex items-center gap-1.5 min-h-[36px] sm:min-h-0 text-xs font-semibold text-slate-500 hover:text-blue-600 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Blogs</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {isEditing ? 'Edit Blog Post' : 'Create Blog Post'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isEditing && status === 'published' && slug && (
              <button
                type="button"
                onClick={() => navigate(`/blog/${slug}`)}
                className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Live</span>
              </button>
            )}
            <button
              type="button"
              disabled={isSaving || isLoading}
              onClick={() => void handleSave('draft')}
              className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50 cursor-pointer"
            >
              {status === 'published' ? 'Unpublish to Draft' : 'Save as Draft'}
            </button>
            <button
              type="button"
              disabled={isSaving || isLoading}
              onClick={() => void handleSave('published')}
              className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving
                ? 'Saving...'
                : status === 'published'
                ? 'Update Published Post'
                : 'Publish Post'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 break-words">{errorMsg}</div>
          </div>
        )}

        {saveNotice && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveNotice}</span>
            </div>
            {status === 'published' && slug && (
              <button
                type="button"
                onClick={() => navigate(`/blog/${slug}`)}
                className="font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                Open /blog/{slug} →
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="bg-white p-12 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw className="w-7 h-7 animate-spin text-blue-600 mb-2" />
            <span className="text-xs">Loading blog editor...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Main Editor Column */}
            <div className="lg:col-span-8 space-y-5 min-w-0">
              <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. How to Structure Digital Handbooks for Clarity"
                    className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center min-w-0 rounded-md border border-slate-300 overflow-hidden bg-slate-50">
                    <span className="px-2.5 sm:px-3 py-2.5 sm:py-2 text-xs text-slate-500 border-r border-slate-300 shrink-0">
                      /blog/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(sanitizeSlug(e.target.value));
                      }}
                      placeholder="auto-generated-from-title"
                      className="flex-1 min-w-0 min-h-[44px] sm:min-h-0 px-3 py-2 bg-white text-base sm:text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    maxLength={400}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="A concise 1–2 sentence summary shown on blog listing cards..."
                    className="w-full px-3 py-2 rounded-md border border-slate-300 text-base sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-[11px] text-slate-400">
                    {shortDescription.length}/400 characters
                  </span>
                </div>
              </div>

              {/* Markdown Content Editor */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertAtCursor('\n## ', '', 'Heading 2')}
                      className="w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="Heading 2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertAtCursor('\n### ', '', 'Heading 3')}
                      className="w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="Heading 3"
                    >
                      <Heading3 className="w-4 h-4" />
                    </button>
                    <span className="w-[1px] h-4 bg-slate-300 mx-0.5 sm:mx-1" />
                    <button
                      type="button"
                      onClick={() => insertAtCursor('**', '**', 'bold text')}
                      className="w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertAtCursor('*', '*', 'italic text')}
                      className="w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <span className="w-[1px] h-4 bg-slate-300 mx-0.5 sm:mx-1" />
                    <button
                      type="button"
                      onClick={() => insertAtCursor('\n- ', '', 'List item')}
                      className="w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertAtCursor('\n1. ', '', 'Numbered item')
                      }
                      className="w-9 h-9 sm:w-auto sm:h-auto sm:p-1.5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <span className="w-[1px] h-4 bg-slate-300 mx-0.5 sm:mx-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowImageInserter(false);
                        setShowLinkInserter((prev) => !prev);
                      }}
                      className={`inline-flex items-center gap-1 min-h-[36px] sm:min-h-0 px-2.5 sm:px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                        showLinkInserter
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Insert Link"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLinkInserter(false);
                        setShowImageInserter((prev) => !prev);
                      }}
                      className={`inline-flex items-center gap-1 min-h-[36px] sm:min-h-0 px-2.5 sm:px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                        showImageInserter
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Insert Image URL"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Image</span>
                    </button>
                  </div>

                  {/* Write / Preview Toggle */}
                  <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setEditorMode('write')}
                      className={`inline-flex items-center gap-1 min-h-[34px] sm:min-h-0 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        editorMode === 'write'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Write</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('preview')}
                      className={`inline-flex items-center gap-1 min-h-[34px] sm:min-h-0 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        editorMode === 'preview'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>

                {/* Inline Link Inserter */}
                {showLinkInserter && (
                  <div className="p-3 bg-blue-50/70 border-b border-blue-200 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 text-xs">
                    <input
                      type="text"
                      value={linkLabelInput}
                      onChange={(e) => setLinkLabelInput(e.target.value)}
                      placeholder="Link text (e.g. Visit Store)"
                      className="min-h-[42px] sm:min-h-0 px-2.5 py-1.5 rounded border border-slate-300 bg-white w-full sm:flex-1 sm:min-w-[140px] text-base sm:text-xs"
                    />
                    <input
                      type="url"
                      value={linkUrlInput}
                      onChange={(e) => setLinkUrlInput(e.target.value)}
                      placeholder="https://example.com"
                      className="min-h-[42px] sm:min-h-0 px-2.5 py-1.5 rounded border border-slate-300 bg-white w-full sm:flex-1 sm:min-w-[180px] text-base sm:text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleInsertLink}
                        className="flex-1 sm:flex-initial min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded bg-blue-600 text-white font-semibold cursor-pointer"
                      >
                        Insert Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLinkInserter(false)}
                        className="w-10 h-10 sm:w-auto sm:h-auto sm:p-1 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                        aria-label="Close link inserter"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Image URL Inserter */}
                {showImageInserter && (
                  <div className="p-3 bg-blue-50/70 border-b border-blue-200 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 text-xs">
                    <input
                      type="text"
                      value={imgAltInput}
                      onChange={(e) => setImgAltInput(e.target.value)}
                      placeholder="Image alt description"
                      className="min-h-[42px] sm:min-h-0 px-2.5 py-1.5 rounded border border-slate-300 bg-white w-full sm:flex-1 sm:min-w-[140px] text-base sm:text-xs"
                    />
                    <input
                      type="url"
                      value={imgUrlInput}
                      onChange={(e) => setImgUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="min-h-[42px] sm:min-h-0 px-2.5 py-1.5 rounded border border-slate-300 bg-white w-full sm:flex-1 sm:min-w-[180px] text-base sm:text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleInsertImage}
                        className="flex-1 sm:flex-initial min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded bg-blue-600 text-white font-semibold cursor-pointer"
                      >
                        Insert Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowImageInserter(false)}
                        className="w-10 h-10 sm:w-auto sm:h-auto sm:p-1 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                        aria-label="Close image inserter"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Full Article Content (Markdown supported){' '}
                    <span className="text-red-500">*</span>
                  </label>

                  {editorMode === 'write' ? (
                    <textarea
                      ref={contentRef}
                      rows={16}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`# Section Heading\n\nWrite your article paragraphs here with **bold** and *italic* formatting.\n\n- Bullet point one\n- Bullet point two`}
                      className="w-full px-3.5 py-3 rounded-md border border-slate-300 font-mono text-base sm:text-sm text-slate-900 leading-relaxed focus:outline-none focus:border-blue-600"
                    />
                  ) : (
                    <div className="min-h-[320px] p-4 sm:p-5 rounded-md border border-slate-200 bg-slate-50/40">
                      {content.trim() ? (
                        <MarkdownRenderer content={content} />
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Nothing to preview yet. Switch to Write mode to compose your article.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Metadata Column */}
            <div className="lg:col-span-4 space-y-5 min-w-0">
              <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Publishing Status
                </h2>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Current State</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded border ${
                      status === 'published'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}
                  >
                    {status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                {publishedAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Published On</span>
                    <span className="font-medium text-slate-900">
                      {new Date(publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Optional Details
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => {
                      setCoverPreviewError(false);
                      setCoverImageUrl(e.target.value);
                    }}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  {coverImageUrl.trim() && !coverPreviewError && (
                    <div className="mt-2.5 h-32 rounded border border-slate-200 overflow-hidden bg-slate-100">
                      <img
                        src={coverImageUrl.trim()}
                        alt="Cover preview"
                        onError={() => setCoverPreviewError(true)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="MK Labs"
                    className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Guides, Product Updates, Engineering"
                    className="w-full min-h-[44px] sm:min-h-0 px-3 py-2 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-col min-[380px]:flex-row gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag & press Enter"
                      className="flex-1 min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-md border border-slate-300 text-base sm:text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-1 sm:py-0.5 rounded border border-slate-200"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setTags(tags.filter((t) => t !== tag))
                            }
                            className="text-slate-400 hover:text-red-600 cursor-pointer p-0.5"
                            aria-label={`Remove tag ${tag}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
