import React from 'react';
import { SITE_CONFIG } from '../config/siteConfig';
import { Compass, ShieldCheck, Zap, RefreshCw } from 'lucide-react';

export const StudioPrinciples: React.FC = () => {
  const icons = [Compass, ShieldCheck, Zap, RefreshCw];

  return (
    <section id="principles" className="relative py-28 border-t border-[#1E2638] bg-[#0D1118]/80 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#4D8DFF] uppercase font-semibold">
            <span>05 / WHAT WE BELIEVE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F7FA]">
            Useful Over Unnecessary. Curiosity Over Convention.
          </h2>
          <p className="text-base sm:text-lg text-[#9AA6B5] leading-relaxed">
            The studio operates on four straightforward tenets that prioritize tangible digital
            utility over buzzwords or inflated claims.
          </p>
        </div>

        {/* 4 Illuminated Principle Panels */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          {SITE_CONFIG.principles.map((principle, idx) => {
            const Icon = icons[idx % icons.length];

            return (
              <div
                key={principle.number}
                className="relative rounded-2xl border border-[#1E2638] bg-[#07090D] p-8 hover:border-[#4D8DFF]/60 hover:bg-[#0D1118] transition-all duration-300 group shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar with Number & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#4D8DFF] tracking-widest">
                      PRINCIPLE {principle.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#0D1118] border border-[#1E2638] flex items-center justify-center text-[#55F2E3] group-hover:border-[#55F2E3]/50 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">
                    {principle.title}
                  </h3>

                  <p className="text-base text-[#F5F7FA]/90 font-medium leading-relaxed">
                    "{principle.statement}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#1E2638] text-xs text-[#9AA6B5] leading-relaxed">
                  {principle.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
