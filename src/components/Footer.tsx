import React from 'react';
import { BrandLogo } from './BrandLogo';
import { SITE_CONFIG } from '../config/siteConfig';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative border-t border-[#1E2638] bg-[#07090D] pt-16 pb-12 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#1E2638]">
          {/* Brand & Mission */}
          <div className="md:col-span-6 space-y-4">
            <a
              href="#hero"
              onClick={(e) => handleNavClick(e, '#hero')}
              className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4D8DFF] rounded"
            >
              <BrandLogo size="lg" />
            </a>
            <p className="max-w-md text-sm text-[#9AA6B5] leading-relaxed">
              An independent studio exploring ideas and building useful projects for the internet.
              From everyday browser tools to experimental platforms.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#55F2E3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#55F2E3]" />
              <span>{SITE_CONFIG.brand.tagline}</span>
            </div>
          </div>

          {/* Quick Jump Directory */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-mono text-[#F5F7FA] uppercase tracking-wider block font-semibold">
              Studio Navigation
            </span>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#hero"
                  onClick={(e) => handleNavClick(e, '#hero')}
                  className="text-[#9AA6B5] hover:text-[#4D8DFF] transition-colors"
                >
                  Home / Top
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleNavClick(e, '#about')}
                  className="text-[#9AA6B5] hover:text-[#4D8DFF] transition-colors"
                >
                  About Studio
                </a>
              </li>
              <li>
                <a
                  href="#projects"
                  onClick={(e) => handleNavClick(e, '#projects')}
                  className="text-[#9AA6B5] hover:text-[#4D8DFF] transition-colors"
                >
                  Project Universe
                </a>
              </li>
              <li>
                <a
                  href="#process"
                  onClick={(e) => handleNavClick(e, '#process')}
                  className="text-[#9AA6B5] hover:text-[#4D8DFF] transition-colors"
                >
                  How We Build
                </a>
              </li>
              <li>
                <a
                  href="#experiments"
                  onClick={(e) => handleNavClick(e, '#experiments')}
                  className="text-[#9AA6B5] hover:text-[#4D8DFF] transition-colors"
                >
                  Experiments
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleNavClick(e, '#contact')}
                  className="text-[#9AA6B5] hover:text-[#4D8DFF] transition-colors"
                >
                  Contact Desk
                </a>
              </li>
            </ul>
          </div>

          {/* Live Studio Products Direct */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs font-mono text-[#F5F7FA] uppercase tracking-wider block font-semibold">
              Live Products
            </span>
            <ul className="space-y-2 text-sm">
              {SITE_CONFIG.projects.map((proj) => (
                <li key={proj.id}>
                  <a
                    href={proj.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9AA6B5] hover:text-[#55F2E3] transition-colors flex items-center justify-between"
                  >
                    <span>{proj.name}</span>
                    <span className="text-[10px] font-mono text-[#4D8DFF]">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#9AA6B5]">
          <p>© {currentYear} MK Labs. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#9AA6B5]/60">Ideas into Digital Products</span>
            <span className="w-1 h-1 rounded-full bg-[#1E2638]" />
            <span className="text-[#4D8DFF]">Independent Web Studio</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
