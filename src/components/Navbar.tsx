import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { Menu, X, ShoppingBag, ShieldCheck, User } from 'lucide-react';
import { useRouter } from '../hooks/useRouter';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { path, navigate } = useRouter();
  const { user, isAdmin } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const isStore = path.startsWith('/store');
  const isBlog = path === '/blog' || path.startsWith('/blog/');
  const isHome = path === '/' || path === '';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScrollable > 0) {
        const progress = (window.scrollY / totalScrollable) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }

      if (isHome) {
        const sections = ['hero', 'about', 'capabilities', 'contact'];
        const scrollPos = window.scrollY + 120;

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
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const navItems = [
    { label: 'Home', href: '/#hero', id: 'hero' },
    { label: 'Digital Store', href: '/store', id: 'store' },
    { label: 'Blog', href: '/blog', id: 'blog' },
    { label: 'About', href: '/#about', id: 'about' },
    { label: 'What We Do', href: '/#capabilities', id: 'capabilities' },
    { label: 'Contact', href: '/#contact', id: 'contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (href.startsWith('/#')) {
      const hashId = href.replace('/#', '');
      if (isHome) {
        const el = document.getElementById(hashId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(hashId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      navigate(href);
    }
  };

  return (
    <>
      {/* Top subtle scroll progress bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-transparent pointer-events-none"
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Page scroll progress"
      >
        <div
          className="h-full bg-blue-600 transition-all duration-75 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-xs py-2.5 md:py-3.5'
            : 'bg-white/90 backdrop-blur-xs border-b border-slate-100 py-3 md:py-4'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                navigate('/');
              }}
              className="focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md min-h-[44px] flex items-center"
              aria-label="MK Labs Home"
            >
              <BrandLogo size="md" />
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-7" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isStoreLink = item.id === 'store';
                const isBlogLink = item.id === 'blog';
                const isActive = isStoreLink
                  ? isStore
                  : isBlogLink
                  ? isBlog
                  : isHome && activeSection === item.id;

                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`text-sm font-medium transition-colors py-1 relative ${
                      isActive
                        ? 'text-blue-600 font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isStoreLink && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                        Store
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>

            {/* Right Action Menu: Store, Account & Admin */}
            <div className="hidden md:flex items-center space-x-3">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors cursor-pointer"
                  title="Admin Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Admin Panel</span>
                </button>
              )}

              <button
                onClick={() => navigate('/account')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                title="Customer Account"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{user ? user.fullName.split(' ')[0] : 'Account'}</span>
              </button>

              <button
                onClick={() => navigate('/store')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Browse Store</span>
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer shrink-0"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Backdrop & Scrollable Navigation Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-x-0 bottom-0 top-[68px] z-40 bg-slate-900/35 backdrop-blur-[1px] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-50 md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 shadow-xl max-h-[calc(100dvh-4.25rem)] overflow-y-auto">
              <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
                {navItems.map((item) => {
                  const isStoreLink = item.id === 'store';
                  const isBlogLink = item.id === 'blog';
                  const isActive = isStoreLink
                    ? isStore
                    : isBlogLink
                    ? isBlog
                    : isHome && activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={`px-3.5 min-h-[44px] text-sm font-medium rounded-md flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isStoreLink && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                          Store
                        </span>
                      )}
                    </a>
                  );
                })}
                <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/store');
                    }}
                    className="w-full min-h-[44px] text-center px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Browse Digital Store</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/account');
                      }}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{user ? 'My Account' : 'Account'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/admin');
                      }}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>
              </nav>
            </div>
          </>
        )}
      </header>
    </>
  );
};
