import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  FolderTree,
  Tag as TagIcon,
  HardDrive,
  Download,
  Users,
  Activity,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  ShoppingBag,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';
import { BrandLogo } from '../../components/BrandLogo';
import { syncCategoryNamesOncePerSession } from '../../services/categorySeed';
import { reconcileProductSalesOncePerSession } from '../../services/firestoreStore';

export const AdminLayout: React.FC<{ children: React.ReactNode; currentTab: string }> = ({
  children,
  currentTab,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { navigate } = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      void syncCategoryNamesOncePerSession();
      void reconcileProductSalesOncePerSession();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileSidebarOpen]);

  // Protected route check
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg border border-slate-200 text-center max-w-md shadow-xs">
          <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Admin Authorization Required</h2>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            You must be signed in with administrative privileges to access the MK Labs Store control center.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => navigate('/admin/login')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
            >
              Sign In as Administrator
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors"
            >
              Return to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    { label: 'Overview', href: '/admin', id: 'dashboard', icon: LayoutDashboard },
    { label: 'Orders', href: '/admin/orders', id: 'orders', icon: ShoppingBag },
    { label: 'Products', href: '/admin/products', id: 'products', icon: Package },
    { label: 'Add Product', href: '/admin/products/new', id: 'products-new', icon: PlusCircle },
    { label: 'Categories', href: '/admin/categories', id: 'categories', icon: FolderTree },
    { label: 'Blogs', href: '/admin/blogs', id: 'blogs', icon: BookOpen },
    { label: 'Delivery Assets', href: '/admin/files', id: 'files', icon: HardDrive },
    { label: 'Tags', href: '/admin/tags', id: 'tags', icon: TagIcon },
    { label: 'Downloads & Stats', href: '/admin/downloads', id: 'downloads', icon: Download },
    { label: 'Customer Users', href: '/admin/customers', id: 'customers', icon: Users },
    { label: 'Activity Logs', href: '/admin/activity', id: 'activity', icon: Activity },
    { label: 'Store Settings', href: '/admin/settings', id: 'settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col overflow-x-clip">
      {/* Admin Topbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-3 sm:px-6 h-16 flex items-center justify-between shadow-2xs gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden w-11 h-11 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0"
            aria-label="Toggle navigation drawer"
            aria-expanded={mobileSidebarOpen}
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo size="sm" showSubtitle={false} />
            <span className="hidden sm:inline-block text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              Admin Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/store')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
          >
            <span>Live Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
          >
            <span>MK Labs Home</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

          {/* User badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-700 hidden md:inline">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-0 px-3 sm:px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:block shrink-0 p-4 space-y-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
              Store Management
            </span>
            <nav className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <span className="font-semibold text-slate-700 block">System Environment</span>
              <p>Store: Active & Online</p>
              <p>Role: Super Administrator</p>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] max-h-dvh overflow-y-auto bg-white border-r border-slate-200 p-4 flex flex-col justify-between shadow-xl z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Admin Control</span>
                    {user?.email && (
                      <span className="text-[11px] text-slate-500 break-all block mt-0.5">
                        {user.email}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer shrink-0"
                    aria-label="Close navigation drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Live Links */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      navigate('/store');
                    }}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    <span>Live Store</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      navigate('/');
                    }}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    <span>Home</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setMobileSidebarOpen(false);
                          navigate(item.href);
                        }}
                        className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium text-left cursor-pointer ${
                          isActive ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/admin/login');
                  }}
                  className="w-full min-h-[44px] py-2.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
