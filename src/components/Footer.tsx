import React from 'react';
import { BrandLogo } from './BrandLogo';
import { Linkedin, ArrowUp } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';
import { useRouter } from '../hooks/useRouter';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { path, navigate } = useRouter();
  const isHome = path === '/' || path === '';

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href.startsWith('/#')) {
      const sectionId = href.replace('/#', '');
      if (isHome) {
        const target = document.getElementById(sectionId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/');
        setTimeout(() => {
          const target = document.getElementById(sectionId);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      navigate(href);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-slate-200 pt-10 pb-8 md:pt-16 md:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 pb-8 md:pb-12 border-b border-slate-100">
          {/* Brand & Description */}
          <div className="md:col-span-5 space-y-3 sm:space-y-4">
            <BrandLogo size="md" />
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              {SITE_CONFIG.brand.footerDescription}
            </p>
            <div className="pt-1">
              <a
                href={SITE_CONFIG.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 min-h-[40px] md:min-h-0 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                aria-label="MK Labs LinkedIn Company Profile"
              >
                <Linkedin className="w-4 h-4 text-blue-600" />
                <span>Follow on LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-2.5 sm:space-y-3">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">
              Navigation
            </span>
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-1 md:gap-y-2 text-sm">
              {SITE_CONFIG.navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="inline-flex items-center min-h-[40px] md:min-h-0 text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Products & Websites */}
          <div className="md:col-span-4 space-y-2.5 sm:space-y-3">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">
              Our Products &amp; Websites
            </span>
            <ul className="space-y-2 md:space-y-2.5 text-sm">
              {SITE_CONFIG.websites.map((site) => (
                <li key={site.id}>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${site.name} — ${site.category} (opens in a new tab)`}
                    className="text-slate-600 hover:text-blue-600 transition-colors flex items-center justify-between gap-3 group min-h-[44px] md:min-h-0 px-3 py-2 md:p-0 rounded-md md:rounded-none bg-slate-50/70 md:bg-transparent border border-slate-100 md:border-0"
                  >
                    <span className="flex items-baseline gap-2 min-w-0">
                      <span className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors shrink-0">
                        {site.name}
                      </span>
                      <span className="text-xs text-slate-400 truncate">
                        {site.category}
                      </span>
                    </span>
                    <span className="text-xs text-slate-400 group-hover:text-blue-600 shrink-0">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-6 md:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>© {currentYear} MK Labs. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <span>Digital Products &amp; Technology Studio</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 min-h-[40px] sm:min-h-0 px-2 sm:px-0 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Back to top"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
