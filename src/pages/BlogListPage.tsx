import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  Calendar,
  ArrowRight,
  FileText,
  RefreshCw,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { BlogPostRecord } from '../types/blog';
import { fetchPublishedBlogs } from '../services/firestoreBlog';
import { formatBlogDate } from '../services/blogValidation';
import { isFirebaseConfigured } from '../lib/firebase';
import { useRouter } from '../hooks/useRouter';

export const BlogListPage: React.FC = () => {
  const { navigate } = useRouter();
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const loadPosts = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setPosts([]);
      setLoadError('Firebase configuration is missing.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const published = await fetchPublishedBlogs();
      setPosts(published);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Unable to load blog articles right now.'
      );
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const p of posts) {
      if (p.category?.trim()) {
        seen.add(p.category.trim());
      }
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        (post.category || '').trim() === selectedCategory;

      const tagsText = (post.tags || []).join(' ').toLowerCase();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.shortDescription.toLowerCase().includes(q) ||
        (post.category || '').toLowerCase().includes(q) ||
        (post.authorName || '').toLowerCase().includes(q) ||
        tagsText.includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [posts, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 sm:pt-28 sm:pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-6 sm:mb-10">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1.5 sm:mb-2">
            MK Labs Journal
          </span>
          <h1 className="text-2xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Blog &amp; Articles
          </h1>
          <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-slate-600 leading-relaxed">
            Guides, engineering notes, product updates, and practical insights from MK Labs.
          </p>
        </div>

        {/* Search & Category Filter Bar (shown when published posts exist) */}
        {posts.length > 0 && (
          <div className="bg-white p-3.5 sm:p-5 rounded-lg border border-slate-200 shadow-2xs mb-6 sm:mb-8 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="relative flex-1 max-w-xl">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles by title, topic, or tag..."
                  className="w-full min-h-[44px] pl-9 pr-9 py-2 rounded-md border border-slate-300 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="w-9 h-9 flex items-center justify-center rounded-md absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Clear blog search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <span className="text-xs font-semibold text-slate-500">
                Showing {filteredPosts.length} of {posts.length}{' '}
                {posts.length === 1 ? 'article' : 'articles'}
              </span>
            </div>

            {categories.length > 0 && (
              <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap sm:overflow-visible">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`min-h-[38px] sm:min-h-0 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-blue-400'
                  }`}
                >
                  All Topics ({posts.length})
                </button>
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  const count = posts.filter(
                    (p) => (p.category || '').trim() === cat
                  ).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`min-h-[38px] sm:min-h-0 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-blue-400'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Loading, Error, Empty, or Articles Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <span className="text-sm font-medium">Loading articles...</span>
          </div>
        ) : loadError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
            <h2 className="text-base font-bold text-red-900">
              Unable to Load Blog Posts
            </h2>
            <p className="text-xs text-red-800 break-words">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadPosts()}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                No Articles Published Yet
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                MK Labs has not published any blog articles yet. Check back soon for new guides, updates, and technical notes.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/store')}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Explore Digital Store
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">
              No matching articles found
            </h2>
            <p className="text-xs text-slate-600">
              Try adjusting your search query or selected topic filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPosts.map((post) => {
              const displayDate = formatBlogDate(
                post.publishedAt || post.createdAt
              );

              return (
                <article
                  key={post.id}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="group bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {post.coverImageUrl && !failedImages[post.id] && (
                      <div className="aspect-[16/10] sm:aspect-auto sm:h-48 bg-slate-100 overflow-hidden border-b border-slate-100">
                        <img
                          src={post.coverImageUrl}
                          alt={post.title}
                          onError={() =>
                            setFailedImages((prev) => ({
                              ...prev,
                              [post.id]: true,
                            }))
                          }
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2 sm:mb-2.5">
                        {post.category ? (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate">
                            {post.category}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500">
                            Article
                          </span>
                        )}

                        {displayDate && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{displayDate}</span>
                          </span>
                        )}
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {post.title}
                      </h2>

                      <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {post.shortDescription}
                      </p>

                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium truncate">
                      {post.authorName || 'MK Labs'}
                    </span>
                    <a
                      href={`/blog/${post.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/blog/${post.slug}`);
                      }}
                      className="font-semibold text-blue-600 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
