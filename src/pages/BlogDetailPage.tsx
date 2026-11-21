import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  User,
  Tag as TagIcon,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { BlogPostRecord } from '../types/blog';
import { fetchPublishedBlogBySlug } from '../services/firestoreBlog';
import { formatBlogDate } from '../services/blogValidation';
import { MarkdownRenderer } from '../components/blog/MarkdownRenderer';
import { useRouter } from '../hooks/useRouter';

export const BlogDetailPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { navigate } = useRouter();
  const [post, setPost] = useState<BlogPostRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      try {
        setIsLoading(true);
        setError(null);
        setImgError(false);
        const found = await fetchPublishedBlogBySlug(slug);
        if (!cancelled) {
          setPost(found);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Unable to load article.'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadArticle();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-36 pb-20 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <span className="text-sm text-slate-500">Loading article...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24 pb-14 sm:pt-36 sm:pb-20">
        <div className="max-w-xl mx-auto px-4 text-center bg-white p-6 sm:p-10 rounded-lg border border-slate-200 shadow-xs">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900">
            Article Unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {error ||
              'The requested blog post could not be found or is not published.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/blog')}
            className="mt-6 min-h-[44px] px-5 py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-blue-700 cursor-pointer"
          >
            ← Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const displayDate = formatBlogDate(post.publishedAt || post.createdAt);

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-14 sm:pt-28 sm:pb-20">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-4 sm:mb-6">
          <a
            href="/blog"
            onClick={(e) => {
              e.preventDefault();
              navigate('/blog');
            }}
            className="min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Articles</span>
          </a>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {post.coverImageUrl && !imgError && (
            <div className="h-52 sm:h-96 bg-slate-100 border-b border-slate-200 overflow-hidden">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-5 sm:p-10">
            {/* Meta Badges */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-slate-500 mb-3.5 sm:mb-4">
              {post.category && (
                <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {post.category}
                </span>
              )}
              {displayDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <time dateTime={post.publishedAt || post.createdAt}>
                    {displayDate}
                  </time>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>By {post.authorName || 'MK Labs'}</span>
              </span>
            </div>

            {/* Title & Summary */}
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight break-words">
              {post.title}
            </h1>

            <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-slate-600 leading-relaxed border-b border-slate-100 pb-5 sm:pb-6">
              {post.shortDescription}
            </p>

            {/* Full Article Content */}
            <div className="pt-5 sm:pt-6">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <TagIcon className="w-3.5 h-3.5 text-slate-400 mr-1" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Explore MK Labs Digital Products
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Browse handbooks, templates, creative assets, and software tools built by MK Labs.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/blog')}
              className="min-h-[44px] px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer text-center"
            >
              More Articles
            </button>
            <button
              type="button"
              onClick={() => navigate('/store')}
              className="min-h-[44px] px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer text-center"
            >
              Visit Store
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};
