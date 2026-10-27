import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { SITE_CONFIG } from '../config/siteConfig';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      // Compute scroll percentage accurately
      const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScrollable > 0) {
        const progress = (window.scrollY / totalScrollable) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }

      const sections = ['hero', 'about', 'projects', 'process', 'experiments', 'principles', 'contact'];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initialize on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', href: '#hero', id: 'hero' },
    { label: 'About', href: '#about', id: 'about' },
    { label: 'Projects', href: '#projects', id: 'projects' },
    { label: 'Process', href: '#process', id: 'process' },
    { label: 'Experiments', href: '#experiments', id: 'experiments' },
    { label: 'Principles', href: '#principles', id: 'principles' },
    { label: 'Contact', href: '#contact', id: 'contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Subtle Progress Indicator Bar pinned at the very top of the viewport */}
      <div
        className="fixed top-0 left-0 right-0 h-[2.5px] z-[60] bg-transparent pointer-events-none"
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lab experience exploration progress"
      >
        <div
          className="h-full bg-gradient-to-r from-[#4D8DFF] via-[#55F2E3] to-[#4D8DFF] transition-all duration-75 ease-out shadow-[0_0_8px_rgba(85,242,227,0.6)] relative"
          style={{ width: `${scrollProgress}%` }}
        >
          {/* Subtle luminous tip on the leading edge */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#55F2E3] shadow-[0_0_6px_#55F2E3]" />
        </div>
      </div>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#07090D]/90 backdrop-blur-md border-b border-[#1E2638] py-3.5 shadow-lg'
            : 'bg-transparent py-5 border-b border-transparent'
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, '#hero')}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4D8DFF] rounded-lg"
            aria-label="MK Labs Home"
          >
            <BrandLogo size="md" />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`text-sm font-medium transition-colors relative py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4D8DFF] rounded ${
                    isActive
                      ? 'text-[#F5F7FA]'
                      : 'text-[#9AA6B5] hover:text-[#F5F7FA]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4D8DFF] rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Desktop Right Action: Explore Projects */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="#projects"
              onClick={(e) => handleNavClick(e, '#projects')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0D1118] border border-[#1E2638] text-xs font-semibold text-[#F5F7FA] hover:border-[#4D8DFF] hover:bg-[#4D8DFF]/10 transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4D8DFF]"
            >
              <span>Explore Projects</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#4D8DFF]" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#9AA6B5] hover:text-[#F5F7FA] hover:bg-[#0D1118] border border-transparent hover:border-[#1E2638] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4D8DFF]"
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D1118] border-b border-[#1E2638] px-4 pt-3 pb-6 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3" aria-label="Mobile Navigation">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-between ${
                    isActive
                      ? 'bg-[#4D8DFF]/10 text-[#4D8DFF] font-semibold'
                      : 'text-[#9AA6B5] hover:text-[#F5F7FA] hover:bg-[#07090D]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#4D8DFF]" />}
                </a>
              );
            })}
            <div className="pt-3 border-t border-[#1E2638]">
              <a
                href="#projects"
                onClick={(e) => handleNavClick(e, '#projects')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#4D8DFF] text-white text-sm font-semibold hover:bg-[#3d7ae6] transition-colors shadow-sm"
              >
                <span>Explore Projects</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
    </>
  );
};
