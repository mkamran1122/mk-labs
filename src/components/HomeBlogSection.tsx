import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar, FileText } from 'lucide-react';
import { BlogPostRecord } from '../types/blog';
import { fetchPublishedBlogs } from '../services/firestoreBlog';
import { formatBlogDate } from '../services/blogValidation';
import { isFirebaseConfigured } from '../lib/firebase';
import { useRouter } from '../hooks/useRouter';

export const HomeBlogSection: React.FC = () => {
  const { navigate } = useRouter();
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let cancelled = false;

    fetchPublishedBlogs()
      .then((all) => {
        if (!cancelled) {
          setPosts(all.slice(0, 3));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPosts([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section
      id="latest-blog"
      className="py-12 sm:py-16 md:py-24 bg-white border-b border-slate-100"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-8 sm:mb-12">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-2">
              MK Labs Journal
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Latest from the Blog
            </h2>
            <p className="mt-2.5 sm:mt-3 text-base text-slate-600 leading-relaxed">
              Practical product notes, studio guides, and updates from MK Labs.
            </p>
          </div>

          <a
            href="/blog"
            onClick={(e) => {
              e.preventDefault();
              navigate('/blog');
            }}
            className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-0 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors shrink-0 self-start sm:self-auto"
          >
            <span>View All Blogs</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {posts.map((post) => {
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
                  {post.coverImageUrl && !failedImages[post.id] ? (
                    <div className="aspect-[16/10] sm:aspect-auto sm:h-44 bg-slate-100 overflow-hidden border-b border-slate-100">
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
                  ) : (
                    <div className="h-20 sm:h-24 bg-slate-50 border-b border-slate-100 flex items-center px-4 sm:px-5">
                      <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-2">
                      {post.category ? (
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate">
                          {post.category}
                        </span>
                      ) : (
                        <span className="font-medium text-slate-500 truncate">
                          {post.authorName || 'MK Labs'}
                        </span>
                      )}
                      {displayDate && (
                        <span className="inline-flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{displayDate}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {post.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium truncate pr-2">
                    {post.authorName || 'MK Labs'}
                  </span>
                  <span className="font-semibold text-blue-600 inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <span>Read More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
