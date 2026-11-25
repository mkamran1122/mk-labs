import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { CurrencySelector } from './CurrencySelector';
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
  const isAccount = path === '/account';

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

      const totalScrollable =
        document.documentElement.scrollHeight - window.innerHeight;
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

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
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

  const userDisplayName = user
    ? user.fullName.trim().split(/\s+/)[0] || 'Account'
    : 'Account';

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
            ? 'bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-xs py-2'
            : 'bg-white/92 backdrop-blur-xs border-b border-slate-100 py-2.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-3 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-3 xl:gap-8">
            {/* Left Section: Brand Logo & Studio Subtitle */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                navigate('/');
              }}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg h-10 flex items-center shrink-0"
              aria-label="MK Labs Home"
            >
              <BrandLogo size="md" />
            </a>

            {/* Center Section: Single-Line Main Navigation */}
            <nav
              className="hidden lg:flex items-center justify-center gap-2.5 xl:gap-6 min-w-0"
              aria-label="Main Navigation"
            >
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
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative inline-flex items-center h-9 px-1 text-[13px] xl:text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-1 bottom-0.5 h-[2px] rounded-full bg-blue-600"
                      />
                    )}
                  </a>
                );
              })}
            </nav>

            {/* Right Section: Currency, Admin (if authorized), Account & Browse Store */}
            <div className="hidden lg:flex items-center justify-end gap-1.5 xl:gap-2 shrink-0">
              <CurrencySelector />

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-2 xl:px-2.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  title="Admin Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Admin Panel</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/account')}
                className={`inline-flex items-center justify-center gap-1.5 h-9 px-2 xl:px-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isAccount
                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                    : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
                title="Customer Account"
              >
                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="max-w-[78px] xl:max-w-[100px] truncate">
                  {userDisplayName}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/store')}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>Browse Store</span>
              </button>
            </div>

            {/* Tablet & Mobile Controls: Currency Selector + Hamburger Toggle */}
            <div className="flex lg:hidden items-center gap-1.5 shrink-0">
              <CurrencySelector compact />

              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer shrink-0"
                aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tablet & Mobile Backdrop + Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-x-0 top-full h-dvh z-40 bg-slate-900/35 backdrop-blur-[1px] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative z-50 lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 shadow-xl max-h-[calc(100dvh-4rem)] overflow-y-auto">
              <nav
                className="max-w-xl mx-auto flex flex-col space-y-1"
                aria-label="Mobile Navigation"
              >
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
                      aria-current={isActive ? 'page' : undefined}
                      className={`px-3.5 min-h-[44px] text-sm font-medium rounded-lg flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="w-1.5 h-1.5 rounded-full bg-blue-600"
                        />
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
                    className="w-full min-h-[44px] text-center px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>Browse Store</span>
                  </button>

                  <div
                    className={`grid gap-2 ${
                      isAdmin ? 'grid-cols-2' : 'grid-cols-1'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/account');
                      }}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {user ? userDisplayName : 'Account'}
                      </span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Admin Panel</span>
                      </button>
                    )}
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
