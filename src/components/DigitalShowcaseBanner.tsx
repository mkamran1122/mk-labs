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
import { useRouter } from '../hooks/useRouter';
import { useCurrency } from '../context/CurrencyContext';
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

const AUTO_ROTATE_MS = 6200;
const TRANSITION_DURATION_MS = 950;

type SlideDirection = 'next' | 'prev';

interface CarouselTransitionState {
  activeIndex: number;
  outgoingIndex: number | null;
  direction: SlideDirection;
  transitionSeq: number;
}

interface DigitalShowcaseBannerProps {
  onShowcaseStateChange?: (hasSlides: boolean) => void;
}

export const DigitalShowcaseBanner: React.FC<DigitalShowcaseBannerProps> = ({
  onShowcaseStateChange,
}) => {
  const { navigate } = useRouter();
  const { convertPrice } = useCurrency();
  const [slides, setSlides] = useState<ShowcaseSlideItem[]>([]);
  const [hasBestSellers, setHasBestSellers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const [carousel, setCarousel] = useState<CarouselTransitionState>({
    activeIndex: 0,
    outgoingIndex: null,
    direction: 'next',
    transitionSeq: 0,
  });

  // Independent pause sources prevent hover/touch/focus/tab visibility conflicts
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let active = true;
    async function loadShowcase() {
      try {
        setIsLoading(true);
        const result = await fetchHomepageShowcaseProducts(5);
        if (!active) return;
        setSlides(result.slides);
        setHasBestSellers(result.hasBestSellers);
        setCarousel({
          activeIndex: 0,
          outgoingIndex: null,
          direction: 'next',
          transitionSeq: 0,
        });
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

  // Listen for OS prefers-reduced-motion changes & browser tab visibility
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

    const updateReducedMotion = () => {
      setPrefersReducedMotion(Boolean(mq?.matches));
    };
    updateReducedMotion();

    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
    };

    mq?.addEventListener?.('change', updateReducedMotion);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      mq?.removeEventListener?.('change', updateReducedMotion);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Warm browser image cache for all showcase cover images so slides never flash while decoding
  useEffect(() => {
    if (typeof Image === 'undefined' || slides.length === 0) return;
    for (const slide of slides) {
      const url = slide.product.coverImageUrl;
      if (url) {
        const preload = new Image();
        preload.referrerPolicy = 'no-referrer';
        preload.src = url;
      }
    }
  }, [slides]);

  const navigateToSlide = useCallback(
    (targetIndex: number, explicitDirection?: SlideDirection) => {
      if (slides.length <= 1) return;

      setCarousel((prev) => {
        const normalized =
          ((targetIndex % slides.length) + slides.length) % slides.length;
        if (normalized === prev.activeIndex) return prev;

        const inferredDirection: SlideDirection =
          explicitDirection ??
          (prev.activeIndex === slides.length - 1 && normalized === 0
            ? 'next'
            : prev.activeIndex === 0 && normalized === slides.length - 1
            ? 'prev'
            : normalized > prev.activeIndex
            ? 'next'
            : 'prev');

        return {
          activeIndex: normalized,
          outgoingIndex: prefersReducedMotion ? null : prev.activeIndex,
          direction: inferredDirection,
          transitionSeq: prev.transitionSeq + 1,
        };
      });
    },
    [slides.length, prefersReducedMotion]
  );

  const goToSlide = useCallback(
    (nextIndex: number) => {
      navigateToSlide(nextIndex);
    },
    [navigateToSlide]
  );

  const goNext = useCallback(() => {
    navigateToSlide(carousel.activeIndex + 1, 'next');
  }, [carousel.activeIndex, navigateToSlide]);

  const goPrev = useCallback(() => {
    navigateToSlide(carousel.activeIndex - 1, 'prev');
  }, [carousel.activeIndex, navigateToSlide]);

  // Clear outgoing transition layer cleanly once the exit/enter animation completes
  useEffect(() => {
    if (carousel.outgoingIndex === null) return;
    const timer = window.setTimeout(() => {
      setCarousel((prev) =>
        prev.outgoingIndex === null ? prev : { ...prev, outgoingIndex: null }
      );
    }, TRANSITION_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [carousel.transitionSeq, carousel.outgoingIndex]);

  const isAutoRotatePaused =
    isHovered || isFocused || isTouching || isTabHidden || prefersReducedMotion;

  // Reset viewing timer whenever slide changes (manually or automatically) or pause clears
  useEffect(() => {
    if (slides.length <= 1 || isAutoRotatePaused) return;
    const timer = window.setTimeout(() => {
      navigateToSlide(carousel.activeIndex + 1, 'next');
    }, AUTO_ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [slides.length, isAutoRotatePaused, carousel.activeIndex, navigateToSlide]);

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsTouching(true);
  };

  const handleTouchCancel = () => {
    touchStartRef.current = null;
    setIsTouching(false);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    const touch = e.changedTouches[0];
    touchStartRef.current = null;
    setIsTouching(false);
    if (!start || !touch || slides.length <= 1) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.15) {
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
        className="relative pt-[76px] pb-6 sm:pt-24 sm:pb-10 lg:pt-28 lg:pb-12 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 border-b border-slate-200/80"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-3.5 sm:p-7 lg:p-10 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center animate-pulse">
              <div className="md:col-span-6 space-y-3 sm:space-y-4">
                <div className="h-4 w-36 bg-slate-200 rounded" />
                <div className="h-8 sm:h-10 w-4/5 bg-slate-200 rounded" />
                <div className="h-14 sm:h-16 w-full bg-slate-100 rounded" />
                <div className="h-7 sm:h-8 w-32 bg-slate-200 rounded" />
                <div className="flex gap-3 pt-1">
                  <div className="h-11 w-32 sm:w-36 bg-slate-200 rounded-md" />
                  <div className="h-11 w-32 sm:w-36 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="md:col-span-6">
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

  const safeIndex =
    carousel.activeIndex < slides.length ? carousel.activeIndex : 0;
  const activeTheme = SLIDE_THEMES[safeIndex % SLIDE_THEMES.length];
  const paritySuffix = carousel.transitionSeq % 2 === 0 ? 'a' : 'b';

  return (
    <section
      aria-roledescription="carousel"
      aria-label="MK Labs Digital Product Showcase"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchCancel={handleTouchCancel}
      onTouchEnd={handleTouchEnd}
      className="relative pt-[76px] pb-6 sm:pt-24 sm:pb-10 lg:pt-28 lg:pb-14 bg-slate-50 border-b border-slate-200/80 overflow-hidden focus:outline-none"
    >
      {/* Crossfading Layered Backdrop Surfaces & Ambient Glows */}
      {slides.map((slide, idx) => {
        const theme = SLIDE_THEMES[idx % SLIDE_THEMES.length];
        const isCurrentTheme = idx === safeIndex;
        const themeVisualLeft = theme.layoutDirection === 'visual-left';

        return (
          <div
            key={`backdrop-${slide.product.id}`}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isCurrentTheme ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${theme.surfaceClass}`}
            />
            <div
              className={`absolute -top-24 ${
                themeVisualLeft ? '-left-16' : '-right-16'
              } w-64 h-64 sm:w-[26rem] sm:h-[26rem] rounded-full blur-3xl ${theme.glowPrimaryClass}`}
            />
            <div
              className={`absolute -bottom-28 ${
                themeVisualLeft ? 'right-1/4' : 'left-1/4'
              } w-56 h-56 sm:w-[22rem] sm:h-[22rem] rounded-full blur-3xl ${theme.glowSecondaryClass}`}
            />
          </div>
        );
      })}

      {/* Architectural Dot Grid Texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(15, 23, 42, 0.14) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Context Strip */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-5">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-slate-700 min-w-0">
            <Sparkles
              className={`w-3.5 h-3.5 shrink-0 transition-colors duration-700 ${activeTheme.accentTextClass}`}
            />
            <span className="uppercase tracking-wider truncate">
              <span className="hidden sm:inline">MK Labs Digital Store · </span>
              {hasBestSellers ? 'Top Releases' : 'Featured Releases'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/store')}
            className="inline-flex items-center gap-1 sm:gap-1.5 min-h-[36px] sm:min-h-0 px-1 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span className="sm:hidden">View Store</span>
            <span className="hidden sm:inline">Explore Full Store</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>

        {/* Main Showcase Stage Card */}
        <div
          className={`relative rounded-2xl border ${activeTheme.frameAccentClass} bg-white/95 sm:bg-white/90 sm:backdrop-blur-xs shadow-md sm:shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)] p-3.5 sm:p-6 md:p-7 lg:p-11 transition-colors duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]`}
        >
          {/* Persistent Overlapping CSS Grid Stage — zero height jump, zero image remount flicker */}
          <div className="relative grid grid-cols-1 items-center overflow-hidden p-1 sm:p-3 md:p-4 -m-1 sm:-m-3 md:-m-4">
            {slides.map((slide, idx) => {
              const theme = SLIDE_THEMES[idx % SLIDE_THEMES.length];
              const product = slide.product;
              const isActive = idx === safeIndex;
              const isOutgoing =
                !isActive && carousel.outgoingIndex === idx;
              const isDormant = !isActive && !isOutgoing;

              const categoryBadge = getCategoryGroupBadge({
                id: product.categoryId,
                name: slide.categoryName,
              });

              const discountPercent =
                slide.hasDiscount && product.regularPrice > 0
                  ? Math.round(
                      ((product.regularPrice - slide.effectivePrice) /
                        product.regularPrice) *
                        100
                    )
                  : 0;

              const hasValidCoverImage =
                Boolean(product.coverImageUrl) && !failedImages[product.id];
              const productPath = `/store/product/${encodeURIComponent(
                product.slug
              )}`;
              const isVisualLeft = theme.layoutDirection === 'visual-left';

              const displayEffective = convertPrice(
                slide.effectivePrice,
                product.currency
              );
              const displayRegular = convertPrice(
                product.regularPrice,
                product.currency
              );

              let layerMotionClass = 'opacity-100';
              if (isActive && carousel.transitionSeq > 0 && !prefersReducedMotion) {
                layerMotionClass =
                  carousel.direction === 'next'
                    ? `showcase-enter-next-${paritySuffix}`
                    : `showcase-enter-prev-${paritySuffix}`;
              } else if (isOutgoing) {
                layerMotionClass =
                  carousel.direction === 'next'
                    ? `showcase-exit-next-${paritySuffix}`
                    : `showcase-exit-prev-${paritySuffix}`;
              } else if (isDormant) {
                layerMotionClass = 'opacity-0 invisible';
              }

              return (
                <div
                  key={product.id}
                  aria-hidden={!isActive}
                  className={`col-start-1 row-start-1 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 lg:gap-12 items-center ${
                    isActive
                      ? 'relative z-20 pointer-events-auto'
                      : isOutgoing
                      ? 'relative z-10 pointer-events-none select-none'
                      : 'relative z-0 pointer-events-none select-none'
                  } ${layerMotionClass}`}
                >
                  {/* Visual Product Cover Column */}
                  <div
                    className={`md:col-span-6 min-w-0 ${
                      isVisualLeft ? 'md:order-1' : 'md:order-2'
                    }`}
                  >
                    <div className="relative group">
                      {/* Architectural Offset Backplate for Layered Depth */}
                      <div
                        aria-hidden="true"
                        className={`hidden md:block absolute inset-0 rounded-2xl border border-slate-200/80 bg-slate-100/80 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isVisualLeft
                            ? '-translate-x-2.5 translate-y-2.5 group-hover:-translate-x-3.5 group-hover:translate-y-3'
                            : 'translate-x-2.5 translate-y-2.5 group-hover:translate-x-3.5 group-hover:translate-y-3'
                        }`}
                      />

                      {/* Primary Mockup Surface */}
                      <button
                        type="button"
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => navigate(productPath)}
                        aria-label={`Open ${product.name}`}
                        className="relative w-full text-left rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-1.5 sm:p-2.5 lg:p-3 shadow-sm overflow-hidden cursor-pointer block focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70">
                          {hasValidCoverImage ? (
                            <img
                              src={product.coverImageUrl}
                              alt={product.name}
                              loading="eager"
                              decoding="async"
                              draggable={false}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedImages((prev) => ({
                                  ...prev,
                                  [product.id]: true,
                                }))
                              }
                              className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025]"
                            />
                          ) : (
                            /* Bespoke Editorial Fallback Artwork when product has no cover image URL */
                            <div
                              className={`w-full h-full bg-gradient-to-br ${theme.fallbackGradientClass} text-white p-3.5 sm:p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden`}
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
                              <div className="relative flex items-center justify-between gap-2">
                                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-300 truncate">
                                  MK Labs Digital Edition
                                </span>
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                              </div>

                              <div className="relative my-auto py-2 sm:py-3">
                                <span className="text-[11px] sm:text-xs font-medium text-blue-200 block mb-1 sm:mb-2 truncate">
                                  {slide.categoryName}
                                </span>
                                <h3 className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-white leading-snug line-clamp-2 sm:line-clamp-3">
                                  {product.name}
                                </h3>
                              </div>

                              <div className="relative flex items-center justify-between gap-2 pt-2 sm:pt-3 border-t border-white/15 text-[11px] sm:text-xs text-slate-300">
                                <span className="truncate">Verified PDF Delivery</span>
                                <span className="font-semibold text-white tabular-nums shrink-0">
                                  {displayEffective.formatted}
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
                    className={`md:col-span-6 space-y-2.5 sm:space-y-3.5 lg:space-y-5 min-w-0 ${
                      isVisualLeft ? 'md:order-2' : 'md:order-1'
                    }`}
                  >
                    {/* Slide Index + Category + Conditional Best Seller Label */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-xs font-semibold tabular-nums text-slate-400">
                        {String(idx + 1).padStart(2, '0')} /{' '}
                        {String(slides.length).padStart(2, '0')}
                      </span>

                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-600 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${categoryBadge.dotClass}`}
                        />
                        <span className="truncate">{slide.categoryName}</span>
                      </span>

                      {slide.isBestSeller && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300/90 text-[11px] font-semibold shrink-0">
                          <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
                          <span>Best Seller</span>
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h2 className="text-lg min-[360px]:text-xl md:text-2xl lg:text-[2.35rem] font-bold tracking-tight text-slate-900 leading-[1.2] lg:leading-[1.16] break-words">
                      {product.name}
                    </h2>

                    {/* Short Description */}
                    <p className="text-[13px] min-[375px]:text-sm md:text-[15px] lg:text-lg text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-3">
                      {product.shortDescription}
                    </p>

                    {/* Price & Optional Discount Comparison */}
                    <div className="pt-0.5 sm:pt-1 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                        <span
                          className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 tabular-nums"
                          title={
                            displayEffective.isConverted
                              ? `Original price: ${displayEffective.originalFormatted}`
                              : undefined
                          }
                        >
                          {displayEffective.formatted}
                        </span>

                        {slide.hasDiscount && (
                          <>
                            <span className="text-xs sm:text-sm lg:text-base font-medium text-slate-400 line-through tabular-nums">
                              {displayRegular.formatted}
                            </span>
                            {discountPercent > 0 && (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] sm:text-xs font-semibold tabular-nums">
                                Save {discountPercent}%
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {displayEffective.isConverted && (
                        <p className="text-[11px] sm:text-xs text-slate-500 tabular-nums">
                          Est. · Orig.{' '}
                          <span className="font-medium text-slate-700">
                            {displayEffective.originalFormatted}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Primary & Secondary CTAs */}
                    <div className="pt-1 sm:pt-2 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => navigate(productPath)}
                        className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 lg:py-3 text-xs min-[375px]:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        <span>View Product</span>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      </button>

                      <button
                        type="button"
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => navigate(productPath)}
                        className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 lg:py-3 text-xs min-[375px]:text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Slide Controls Bar */}
          {slides.length > 1 && (
            <div className="mt-4 pt-3.5 sm:mt-6 sm:pt-5 lg:mt-8 lg:pt-6 border-t border-slate-200/80 flex flex-row items-center justify-between gap-2 sm:gap-3">
              {/* Slide Indicators & Quick-Jump */}
              <div
                className="flex flex-wrap items-center gap-1 sm:gap-2 min-w-0"
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
                      className={`group flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-auto min-w-[28px] sm:min-w-0 px-1.5 sm:px-2.5 sm:py-1.5 rounded-md border text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white/80 hover:bg-white text-slate-600 border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`hidden sm:block h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isActive
                            ? 'w-5 bg-blue-400'
                            : 'w-1.5 bg-slate-300 group-hover:bg-slate-400'
                        }`}
                      />
                      <span className="text-[11px] font-medium max-w-[115px] truncate hidden lg:inline">
                        {slide.product.name}
                      </span>
                      <span className="text-[11px] font-semibold tabular-nums lg:hidden">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous featured product"
                  className="w-10 h-10 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next featured product"
                  className="w-10 h-10 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
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
