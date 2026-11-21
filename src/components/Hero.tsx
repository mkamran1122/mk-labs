import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';

interface HeroProps {
  onExploreProducts: () => void;
  onExploreAbout: () => void;
  compactTop?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreProducts,
  onExploreAbout,
  compactTop = false,
}) => {
  return (
    <section
      id={compactTop ? 'studio-overview' : 'hero'}
      className={`relative bg-white border-b border-slate-100 ${
        compactTop
          ? 'pt-10 pb-12 md:pt-20 md:pb-24'
          : 'pt-24 pb-14 md:pt-40 md:pb-28'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Subtle Studio Label */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700 mb-4 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>Digital Products &amp; Technology Studio</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.15]">
            {SITE_CONFIG.brand.tagline}
          </h1>

          {/* Supporting Text */}
          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl font-normal">
            {SITE_CONFIG.brand.heroSupportingText}
          </p>

          {/* CTAs */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onExploreProducts}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <span>Explore Digital Store</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onExploreAbout}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Compass className="w-4 h-4 text-slate-500" />
              <span>About MK Labs</span>
            </button>
          </div>

          {/* Clean Quick Proof Indicators */}
          <div className="mt-9 sm:mt-14 pt-6 sm:pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Focus
              </span>
              <span className="text-sm font-semibold text-slate-800 mt-1 block">
                Practical Web Tools
              </span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Studio Model
              </span>
              <span className="text-sm font-semibold text-slate-800 mt-1 block">
                Independent &amp; Purpose-Driven
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Digital Store
              </span>
              <span className="text-sm font-semibold text-blue-600 mt-1 block">
                Official MK Labs Catalogue
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
