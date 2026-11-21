import React from 'react';
import { Boxes, Layout, Cloud, Wrench } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';

export const WhatWeDo: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Boxes':
        return <Boxes className="w-5 h-5 text-slate-700" />;
      case 'Layout':
        return <Layout className="w-5 h-5 text-slate-700" />;
      case 'Cloud':
        return <Cloud className="w-5 h-5 text-slate-700" />;
      case 'Wrench':
        return <Wrench className="w-5 h-5 text-slate-700" />;
      default:
        return <Boxes className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <section id="capabilities" className="py-12 sm:py-16 md:py-28 bg-slate-50 border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-2">
            Capabilities
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
            What We Do
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            We build and maintain purpose-focused software with clean architecture, fast load
            times, and accessible interfaces.
          </p>
        </div>

        {/* 4 Capabilities Grid */}
        <div className="mt-8 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {SITE_CONFIG.capabilities.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 sm:p-6 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center mb-3.5 sm:mb-5">
                  {getIcon(item.iconName)}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5 sm:mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
