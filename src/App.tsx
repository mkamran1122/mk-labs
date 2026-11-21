/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { useRouter } from './hooks/useRouter';
import { Navbar } from './components/Navbar';
import { DigitalShowcaseBanner } from './components/DigitalShowcaseBanner';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { WhatWeDo } from './components/WhatWeDo';
import { ContactSection } from './components/ContactSection';
import { HomeBlogSection } from './components/HomeBlogSection';
import { Footer } from './components/Footer';

// Public Store Pages
import { StoreHomePage } from './pages/StoreHomePage';
import { StoreCataloguePage } from './pages/StoreCataloguePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AccountPage } from './pages/AccountPage';

// Public Blog Pages
import { BlogListPage } from './pages/BlogListPage';
import { BlogDetailPage } from './pages/BlogDetailPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductEditPage } from './pages/admin/AdminProductEditPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminFilesPage } from './pages/admin/AdminFilesPage';
import { AdminTagsPage } from './pages/admin/AdminTagsPage';
import { AdminDownloadsPage } from './pages/admin/AdminDownloadsPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminActivityPage } from './pages/admin/AdminActivityPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminBlogsPage } from './pages/admin/AdminBlogsPage';
import { AdminBlogEditPage } from './pages/admin/AdminBlogEditPage';

/**
 * Public Layout Wrapper with standard Studio Navigation and Footer
 */
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1 min-w-0">{children}</main>
      <Footer />
    </div>
  );
};

/**
 * Main Application Router Component
 */
function MainRouter() {
  const { path, matchPath, navigate } = useRouter();
  const [hasShowcaseSlides, setHasShowcaseSlides] = useState(true);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ---------------------------------------------------------------------------
  // 1. Admin Management Routes (Protected / Admin Layout)
  // ---------------------------------------------------------------------------
  if (path === '/admin/login') {
    return <AdminLoginPage />;
  }

  if (path.startsWith('/admin')) {
    if (path === '/admin/products/new') {
      return <AdminProductEditPage />;
    }

    const editMatch = matchPath('/admin/products/:id/edit');
    if (editMatch) {
      return <AdminProductEditPage productId={editMatch.id} />;
    }

    if (path === '/admin/orders') {
      return <AdminOrdersPage />;
    }

    if (path === '/admin/products') {
      return <AdminProductsPage />;
    }

    if (path === '/admin/categories') {
      return <AdminCategoriesPage />;
    }

    if (path === '/admin/files') {
      return <AdminFilesPage />;
    }

    if (path === '/admin/tags') {
      return <AdminTagsPage />;
    }

    if (path === '/admin/downloads') {
      return <AdminDownloadsPage />;
    }

    if (path === '/admin/customers') {
      return <AdminCustomersPage />;
    }

    if (path === '/admin/activity') {
      return <AdminActivityPage />;
    }

    if (path === '/admin/settings') {
      return <AdminSettingsPage />;
    }

    if (path === '/admin/blogs/new') {
      return <AdminBlogEditPage />;
    }

    const blogEditMatch = matchPath('/admin/blogs/:id/edit');
    if (blogEditMatch) {
      return <AdminBlogEditPage blogId={blogEditMatch.id} />;
    }

    if (path === '/admin/blogs') {
      return <AdminBlogsPage />;
    }

    // Default /admin -> Dashboard
    return <AdminDashboardPage />;
  }

  // ---------------------------------------------------------------------------
  // 2. Customer Account Route
  // ---------------------------------------------------------------------------
  if (path === '/account') {
    return (
      <PublicLayout>
        <AccountPage />
      </PublicLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // 2b. Public Blog Routes (/blog & /blog/:slug)
  // ---------------------------------------------------------------------------
  if (path === '/blog') {
    return (
      <PublicLayout>
        <BlogListPage />
      </PublicLayout>
    );
  }

  const blogPostMatch = matchPath('/blog/:slug');
  if (blogPostMatch) {
    return (
      <PublicLayout>
        <BlogDetailPage slug={blogPostMatch.slug} />
      </PublicLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Digital Store Public Routes
  // ---------------------------------------------------------------------------
  if (path.startsWith('/store')) {
    // Category Catalogue Page: /store/category/:slug
    const categoryMatch = matchPath('/store/category/:slug');
    if (categoryMatch) {
      return (
        <PublicLayout>
          <StoreCataloguePage categorySlug={categoryMatch.slug} />
        </PublicLayout>
      );
    }

    // Full Search / Catalogue: /store/search or /store/products or /store/all
    if (
      path === '/store/search' ||
      path === '/store/products' ||
      path === '/store/all'
    ) {
      return (
        <PublicLayout>
          <StoreCataloguePage />
        </PublicLayout>
      );
    }

    // Order Confirmation Page: /store/order/:orderId
    const orderMatch = matchPath('/store/order/:orderId');
    if (orderMatch) {
      return (
        <PublicLayout>
          <OrderConfirmationPage orderId={orderMatch.orderId} />
        </PublicLayout>
      );
    }

    // Single Product Detail Page: supports both /store/product/:slug and /store/:slug
    const productMatchWithPrefix = matchPath('/store/product/:slug');
    if (productMatchWithPrefix) {
      return (
        <PublicLayout>
          <ProductDetailPage slug={productMatchWithPrefix.slug} />
        </PublicLayout>
      );
    }

    const directSlugMatch = matchPath('/store/:slug');
    if (
      directSlugMatch &&
      directSlugMatch.slug !== 'search' &&
      directSlugMatch.slug !== 'products' &&
      directSlugMatch.slug !== 'all' &&
      directSlugMatch.slug !== 'category' &&
      directSlugMatch.slug !== 'order'
    ) {
      return (
        <PublicLayout>
          <ProductDetailPage slug={directSlugMatch.slug} />
        </PublicLayout>
      );
    }

    // Store Landing Home: /store
    return (
      <PublicLayout>
        <StoreHomePage />
      </PublicLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Studio Website Homepage (Default: /)
  // ---------------------------------------------------------------------------
  return (
    <PublicLayout>
      {/* Featured & Best-Selling Digital Product Showcase Banner */}
      <div id={hasShowcaseSlides ? 'hero' : undefined}>
        <DigitalShowcaseBanner onShowcaseStateChange={setHasShowcaseSlides} />
      </div>

      {/* Hero Section */}
      <Hero
        compactTop={hasShowcaseSlides}
        onExploreProducts={() => navigate('/store')}
        onExploreAbout={() => scrollToSection('about')}
      />

      {/* About MK Labs Section */}
      <About />

      {/* What We Do (Capabilities) */}
      <WhatWeDo />

      {/* Latest Blog Posts (only renders if published posts exist) */}
      <HomeBlogSection />

      {/* Let's Connect (Contact + LinkedIn) */}
      <ContactSection />
    </PublicLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </ErrorBoundary>
  );
}
