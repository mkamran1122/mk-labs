import React from 'react';
import { ArrowDown, ArrowUpRight, Compass, Sparkles } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';

interface HeroProps {
  onExploreProjects: () => void;
  onExploreAbout: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreProjects, onExploreAbout }) => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-between pt-28 pb-12 overflow-hidden pointer-events-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Hero Typography & Actions */}
          <div className="lg:col-span-7 space-y-8 pointer-events-auto">
            {/* Small Technical Label & Status */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[#4D8DFF] font-semibold">
                {SITE_CONFIG.brand.subLabel}
              </span>
              <span className="text-[#1E2638]" aria-hidden="true">|</span>
              <div className="flex items-center gap-2 text-xs font-mono text-[#9AA6B5] bg-[#0D1118]/80 border border-[#1E2638] px-2.5 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-[#55F2E3]" />
                <span>{SITE_CONFIG.brand.statusLabel}</span>
              </div>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#F5F7FA] leading-[1.08]">
                Ideas into <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F7FA] via-[#4D8DFF] to-[#55F2E3]">
                  Digital Products.
                </span>
              </h1>
              <p className="max-w-2xl text-lg sm:text-xl text-[#9AA6B5] font-normal leading-relaxed">
                {SITE_CONFIG.brand.coreMessage} From everyday browser tools to experimental platforms,
                we turn practical concepts into working software that anyone can access.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreProjects}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#4D8DFF] text-white text-sm font-semibold hover:bg-[#3d7ae6] transition-all shadow-[0_0_25px_rgba(77,141,255,0.35)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>Explore Our Projects</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreAbout}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#0D1118] border border-[#1E2638] text-sm font-semibold text-[#F5F7FA] hover:border-[#4D8DFF] hover:bg-[#1E2638]/50 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4D8DFF]"
              >
                <Compass className="w-4 h-4 text-[#55F2E3]" />
                <span>Inside MK Labs</span>
              </button>
            </div>

            {/* Spatial Lab Telemetry Labels */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-[#1E2638]/80 max-w-xl">
              <div>
                <span className="block font-mono text-[11px] text-[#9AA6B5]">DISCIPLINE</span>
                <span className="font-mono text-xs text-[#F5F7FA] font-medium mt-0.5 block">
                  Useful Internet Tools
                </span>
              </div>
              <div>
                <span className="block font-mono text-[11px] text-[#9AA6B5]">ENVIRONMENT</span>
                <span className="font-mono text-xs text-[#F5F7FA] font-medium mt-0.5 block">
                  Browser-Native & WebGL
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block font-mono text-[11px] text-[#9AA6B5]">ACTIVE PIPELINE</span>
                <span className="font-mono text-xs text-[#55F2E3] font-medium mt-0.5 block">
                  3 Products Live
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Clear Spatial Reading Corridor for the 3D Core */}
          <div className="lg:col-span-5 h-[340px] lg:h-[500px] relative pointer-events-none flex items-center justify-center">
            {/* Ambient telemetry brackets indicating spatial interactive coordinates */}
            <div className="absolute top-4 right-4 text-right hidden sm:block">
              <span className="font-mono text-[10px] text-[#9AA6B5]/70 block">ORBIT: 45.0° / ALT: 7.5</span>
              <span className="font-mono text-[10px] text-[#4D8DFF]/80 block">LAB CORE // RE-01</span>
            </div>
            <div className="absolute bottom-6 right-6 hidden sm:block">
              <span className="font-mono text-[10px] text-[#55F2E3]/80 bg-[#07090D]/60 border border-[#1E2638] px-2 py-1 rounded">
                MOUSE RESPONSIVE FIELD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 pointer-events-auto">
        <button
          onClick={onExploreAbout}
          className="group inline-flex items-center gap-2 text-xs font-mono text-[#9AA6B5] hover:text-[#F5F7FA] transition-colors cursor-pointer"
          aria-label="Scroll to Studio Introduction"
        >
          <div className="w-5 h-8 rounded-full border border-[#1E2638] group-hover:border-[#4D8DFF] flex items-start justify-center p-1 transition-colors">
            <span className="w-1 h-1.5 rounded-full bg-[#4D8DFF] animate-bounce" />
          </div>
          <span>SCROLL TO ENTER STUDIO</span>
        </button>
      </div>
    </section>
  );
};
