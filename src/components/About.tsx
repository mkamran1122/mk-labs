import React from 'react';
import { Target, Users, Zap } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';

export const About: React.FC = () => {
  const pillars = [
    {
      icon: Target,
      title: 'Purpose-Driven Development',
      description:
        'We focus on real everyday needs, creating software tools that eliminate friction rather than adding unnecessary complexity.',
    },
    {
      icon: Users,
      title: 'Accessible & Intuitive',
      description:
        'Every tool is crafted to be immediately accessible across devices with clean interfaces that require zero learning curve.',
    },
    {
      icon: Zap,
      title: 'Modern & Reliable',
      description:
        'Built with current web technologies, ensuring high performance, fast loading, and dependable browser execution.',
    },
  ];

  return (
    <section id="about" className="py-12 sm:py-16 md:py-28 bg-slate-50 border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Section Kicker */}
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-2">
            Overview
          </span>

          {/* Heading */}
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
            About MK Labs
          </h2>

          {/* Description */}
          <p className="mt-3.5 sm:mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
            {SITE_CONFIG.brand.aboutText}
          </p>
        </div>

        {/* Studio Pillars Grid */}
        <div className="mt-8 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-white p-5 sm:p-6 rounded-lg border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3.5 sm:mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5 sm:mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
