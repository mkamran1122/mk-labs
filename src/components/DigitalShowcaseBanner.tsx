import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Award,
  ShoppingBag,
  FileText,
  Sparkles,
} from 'lucide-react';
import { fetchHomepageShowcaseProducts } from '../services/firestoreStore';
import { ShowcaseSlideItem } from '../services/productRanking';
import { formatProductPrice } from '../types/store';
import { useRouter } from '../hooks/useRouter';
import { getCategoryGroupBadge } from '../config/storeCatalog';

interface SlideVisualTheme {
  surfaceClass: string;
  glowPrimaryClass: string;
  glowSecondaryClass: string;
  accentTextClass: string;
  frameAccentClass: string;
  fallbackGradientClass: string;
  layoutDirection: 'visual-right' | 'visual-left';
}

const SLIDE_THEMES: SlideVisualTheme[] = [
  {
    surfaceClass: 'from-slate-50 via-blue-50/75 to-indigo-50/75',
    glowPrimaryClass: 'bg-blue-400/18',
    glowSecondaryClass: 'bg-indigo-300/20',
    accentTextClass: 'text-blue-700',
    frameAccentClass: 'border-blue-200/80',
    fallbackGradientClass: 'from-slate-900 via-blue-950 to-indigo-950',
    layoutDirection: 'visual-right',
  },
  {
    surfaceClass: 'from-slate-50 via-emerald-50/60 to-teal-50/70',
    glowPrimaryClass: 'bg-emerald-400/16',
    glowSecondaryClass: 'bg-teal-300/18',
    accentTextClass: 'text-emerald-700',
    frameAccentClass: 'border-emerald-200/80',
    fallbackGradientClass: 'from-slate-900 via-emerald-950 to-teal-950',
    layoutDirection: 'visual-left',
  },
  {
    surfaceClass: 'from-slate-50 via-indigo-50/70 to-violet-50/65',
    glowPrimaryClass: 'bg-indigo-400/18',
    glowSecondaryClass: 'bg-violet-300/18',
    accentTextClass: 'text-indigo-700',
    frameAccentClass: 'border-indigo-200/80',
    fallbackGradientClass: 'from-slate-900 via-indigo-950 to-violet-950',
    layoutDirection: 'visual-right',
  },
  {
    surfaceClass: 'from-stone-50 via-amber-50/55 to-slate-50',
    glowPrimaryClass: 'bg-amber-400/16',
    glowSecondaryClass: 'bg-orange-300/14',
    accentTextClass: 'text-amber-800',
    frameAccentClass: 'border-amber-200/80',
    fallbackGradientClass: 'from-stone-900 via-slate-900 to-amber-950',
    layoutDirection: 'visual-left',
  },
  {
    surfaceClass: 'from-slate-50 via-sky-50/75 to-cyan-50/65',
    glowPrimaryClass: 'bg-sky-400/18',
    glowSecondaryClass: 'bg-cyan-300/18',
    accentTextClass: 'text-sky-700',
    frameAccentClass: 'border-sky-200/80',
    fallbackGradientClass: 'from-slate-900 via-sky-950 to-cyan-950',
    layoutDirection: 'visual-right',
  },
];

const AUTO_ROTATE_MS = 5500;

interface DigitalShowcaseBannerProps {
  onShowcaseStateChange?: (hasSlides: boolean) => void;
}

export const DigitalShowcaseBanner: React.FC<DigitalShowcaseBannerProps> = ({
  onShowcaseStateChange,
}) => {
  const { navigate } = useRouter();
  const [slides, setSlides] = useState<ShowcaseSlideItem[]>([]);
  const [hasBestSellers, setHasBestSellers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    async function loadShowcase() {
      try {
        setIsLoading(true);
        const result = await fetchHomepageShowcaseProducts(5);
        if (!active) return;
        setSlides(result.slides);
        setHasBestSellers(result.hasBestSellers);
        setActiveIndex(0);
        onShowcaseStateChange?.(result.slides.length > 0);
      } catch (err) {
        console.warn('Digital showcase load warning:', err);
        if (!active) return;
        setSlides([]);
        onShowcaseStateChange?.(false);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    void loadShowcase();
    return () => {
      active = false;
    };
  }, [onShowcaseStateChange]);

  const goToSlide = useCallback(
    (nextIndex: number) => {
      if (slides.length <= 1) return;
      const normalized = ((nextIndex % slides.length) + slides.length) % slides.length;
      if (normalized === activeIndex) return;

      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
      setIsTransitioning(true);
      setActiveIndex(normalized);
      transitionTimerRef.current = window.setTimeout(() => {
        setIsTransitioning(false);
      }, 260);
    },
    [activeIndex, slides.length]
  );

  const goNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, AUTO_ROTATE_MS);
    return () => window.clearInterval(interval);
  }, [slides.length, isPaused]);

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    const touch = e.changedTouches[0];
    touchStartRef.current = null;
    setIsPaused(false);
    if (!start || !touch || slides.length <= 1) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    }
  };

  if (isLoading) {
    return (
      <section
        aria-label="Featured Digital Products Showcase"
        className="relative pt-20 pb-8 sm:pt-28 sm:pb-12 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 border-b border-slate-200/80"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-4 sm:p-10 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center animate-pulse">
              <div className="lg:col-span-6 space-y-4">
                <div className="h-4 w-36 bg-slate-200 rounded" />
                <div className="h-10 w-4/5 bg-slate-200 rounded" />
                <div className="h-16 w-full bg-slate-100 rounded" />
                <div className="h-8 w-32 bg-slate-200 rounded" />
                <div className="flex gap-3 pt-2">
                  <div className="h-11 w-36 bg-slate-200 rounded-md" />
                  <div className="h-11 w-36 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="lg:col-span-6">
                <div className="aspect-[4/3] w-full rounded-xl bg-slate-200/80" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  const safeIndex = activeIndex < slides.length ? activeIndex : 0;
  const activeSlide = slides[safeIndex];
  const theme = SLIDE_THEMES[safeIndex % SLIDE_THEMES.length];
  const product = activeSlide.product;
  const categoryBadge = getCategoryGroupBadge({
    id: product.categoryId,
    name: activeSlide.categoryName,
  });

  const discountPercent =
    activeSlide.hasDiscount && product.regularPrice > 0
      ? Math.round(
          ((product.regularPrice - activeSlide.effectivePrice) /
            product.regularPrice) *
            100
        )
      : 0;

  const hasValidCoverImage =
    Boolean(product.coverImageUrl) && !failedImages[product.id];
  const productPath = `/store/product/${encodeURIComponent(product.slug)}`;
  const isVisualLeft = theme.layoutDirection === 'visual-left';

  return (
    <section
      aria-roledescription="carousel"
      aria-label="MK Labs Digital Product Showcase"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative pt-20 pb-8 sm:pt-28 sm:pb-14 bg-gradient-to-br ${theme.surfaceClass} border-b border-slate-200/80 overflow-hidden transition-colors duration-500 focus:outline-none`}
    >
      {/* Layered Architectural Backdrop & Subtle Ambient Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(15, 23, 42, 0.14) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-24 ${
          isVisualLeft ? '-left-16' : '-right-16'
        } w-64 h-64 sm:w-[26rem] sm:h-[26rem] rounded-full blur-3xl transition-all duration-700 ${theme.glowPrimaryClass}`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-28 ${
          isVisualLeft ? 'right-1/4' : 'left-1/4'
        } w-56 h-56 sm:w-[22rem] sm:h-[22rem] rounded-full blur-3xl transition-all duration-700 ${theme.glowSecondaryClass}`}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Context Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-slate-700 min-w-0">
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${theme.accentTextClass}`} />
            <span className="uppercase tracking-wider truncate">
              {hasBestSellers
                ? 'MK Labs Digital Store · Top Releases'
                : 'MK Labs Digital Store · Featured Releases'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/store')}
            className="inline-flex items-center gap-1.5 min-h-[36px] sm:min-h-0 px-1 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
          >
            <span>Explore Full Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Showcase Stage Card */}
        <div
          className={`relative rounded-2xl border ${theme.frameAccentClass} bg-white/95 sm:bg-white/90 sm:backdrop-blur-xs shadow-md sm:shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)] p-4 sm:p-9 lg:p-11 transition-all duration-500`}
        >
          <div
            className={`grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-center transition-opacity duration-300 ${
              isTransitioning ? 'opacity-80' : 'opacity-100'
            }`}
          >
            {/* Visual Product Cover Column */}
            <div
              className={`lg:col-span-6 ${
                isVisualLeft ? 'lg:order-1' : 'lg:order-2'
              }`}
            >
              <div className="relative group">
                {/* Architectural Offset Backplate for Layered Depth */}
                <div
                  aria-hidden="true"
                  className={`hidden sm:block absolute inset-0 rounded-2xl border border-slate-200/80 bg-slate-100/80 transition-transform duration-500 ${
                    isVisualLeft
                      ? '-translate-x-2.5 translate-y-2.5 group-hover:-translate-x-3.5 group-hover:translate-y-3'
                      : 'translate-x-2.5 translate-y-2.5 group-hover:translate-x-3.5 group-hover:translate-y-3'
                  }`}
                />

                {/* Primary Mockup Surface */}
                <button
                  type="button"
                  onClick={() => navigate(productPath)}
                  aria-label={`Open ${product.name}`}
                  className="relative w-full text-left rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-3 shadow-sm overflow-hidden cursor-pointer block focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70">
                    {hasValidCoverImage ? (
                      <img
                        src={product.coverImageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [product.id]: true,
                          }))
                        }
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                      />
                    ) : (
                      /* Bespoke Editorial Fallback Artwork when product has no cover image URL */
                      <div
                        className={`w-full h-full bg-gradient-to-br ${theme.fallbackGradientClass} text-white p-4 sm:p-8 flex flex-col justify-between relative overflow-hidden`}
                      >
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 opacity-15"
                          style={{
                            backgroundImage:
                              'linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)',
                            backgroundSize: '28px 28px',
                          }}
                        />
                        <div className="relative flex items-center justify-between gap-3">
                          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                            MK Labs Digital Edition
                          </span>
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="relative my-auto py-3 sm:py-4">
                          <span className="text-[11px] sm:text-xs font-medium text-blue-200 block mb-1.5 sm:mb-2 truncate">
                            {activeSlide.categoryName}
                          </span>
                          <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-snug line-clamp-3">
                            {product.name}
                          </h3>
                        </div>

                        <div className="relative flex items-center justify-between pt-2.5 sm:pt-3 border-t border-white/15 text-[11px] sm:text-xs text-slate-300">
                          <span>Verified PDF Delivery</span>
                          <span className="font-semibold text-white tabular-nums">
                            {formatProductPrice(
                              activeSlide.effectivePrice,
                              product.currency
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Editorial Copy & Purchase CTA Column */}
            <div
              className={`lg:col-span-6 space-y-3.5 sm:space-y-5 min-w-0 ${
                isVisualLeft ? 'lg:order-2' : 'lg:order-1'
              }`}
            >
              {/* Slide Index + Category + Conditional Best Seller Label */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold tabular-nums text-slate-400">
                  {String(safeIndex + 1).padStart(2, '0')} /{' '}
                  {String(slides.length).padStart(2, '0')}
                </span>

                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <span
                    className={`w-2 h-2 rounded-full ${categoryBadge.dotClass}`}
                  />
                  <span>{activeSlide.categoryName}</span>
                </span>

                {activeSlide.isBestSeller && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300/90 text-[11px] font-semibold">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Best Seller</span>
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h2 className="text-xl min-[375px]:text-2xl sm:text-3xl lg:text-[2.35rem] font-bold tracking-tight text-slate-900 leading-[1.16] break-words">
                {product.name}
              </h2>

              {/* Short Description */}
              <p className="text-sm sm:text-lg text-slate-600 leading-relaxed line-clamp-3">
                {product.shortDescription}
              </p>

              {/* Price & Optional Discount Comparison */}
              <div className="pt-0.5 sm:pt-1 flex flex-wrap items-baseline gap-2.5 sm:gap-3">
                <span className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {formatProductPrice(
                    activeSlide.effectivePrice,
                    product.currency
                  )}
                </span>

                {activeSlide.hasDiscount && (
                  <>
                    <span className="text-sm sm:text-base font-medium text-slate-400 line-through tabular-nums">
                      {formatProductPrice(product.regularPrice, product.currency)}
                    </span>
                    {discountPercent > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold tabular-nums">
                        Save {discountPercent}%
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="pt-1 sm:pt-2 flex flex-col min-[420px]:flex-row sm:flex-wrap items-stretch min-[420px]:items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => navigate(productPath)}
                  className="w-full min-[420px]:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <span>View Product</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate(productPath)}
                  className="w-full min-[420px]:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Slide Controls Bar */}
          {slides.length > 1 && (
            <div className="mt-6 pt-4 sm:mt-8 sm:pt-6 border-t border-slate-200/80 flex flex-row items-center justify-between gap-3">
              {/* Slide Indicators & Quick-Jump */}
              <div
                className="flex flex-wrap items-center gap-1.5 sm:gap-2"
                role="tablist"
                aria-label="Choose featured product slide"
              >
                {slides.map((slide, idx) => {
                  const isActive = idx === safeIndex;
                  return (
                    <button
                      key={slide.product.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Show slide ${idx + 1}: ${slide.product.name}`}
                      onClick={() => goToSlide(idx)}
                      className={`group flex items-center justify-center gap-2 min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 px-2.5 py-1.5 rounded-md border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white/80 hover:bg-white text-slate-600 border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`block h-1.5 rounded-full transition-all duration-300 ${
                          isActive
                            ? 'w-4 sm:w-5 bg-blue-400'
                            : 'w-1.5 bg-slate-300 group-hover:bg-slate-400'
                        }`}
                      />
                      <span className="text-[11px] font-medium max-w-[115px] truncate hidden md:inline">
                        {slide.product.name}
                      </span>
                      <span className="text-[11px] font-semibold tabular-nums md:hidden">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous featured product"
                  className="w-11 h-11 sm:w-10 sm:h-10 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next featured product"
                  className="w-11 h-11 sm:w-10 sm:h-10 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
