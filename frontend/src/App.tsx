import { WalletConnect } from './components/WalletConnect';
import { EventRegistration } from './components/EventRegistration';
import { EventDashboard } from './components/EventDashboard';
import { AppProvider } from './contexts/AppContext';
import { SkipToContent } from './components/SkipToContent';
import { SEOFooter } from './components/SEOFooter';
import {
  BreadcrumbSchema,
  OrganizationSchema,
  WebAppSchema,
} from './components/StructuredData';
import { usePageSEO } from './hooks/usePageSEO';
import { PAGE_META, SITE_CONFIG } from './config/seo.config';
import './App.css';

function App() {
  usePageSEO({
    title: PAGE_META.home.title,
    description: PAGE_META.home.description,
    keywords: PAGE_META.home.keywords,
    canonical: PAGE_META.home.canonical,
  });

  return (
    <AppProvider>
      {/* Structured data for search engine rich results */}
      <OrganizationSchema />
      <WebAppSchema />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Dashboard', path: '/dashboard' },
        ]}
      />

      {/* Keyboard accessibility: skip to main content */}
      <SkipToContent />

      <div className="container">
        <header className="header" role="banner">
          <h1>
            <a href="/" className="logo-link" aria-label={`${SITE_CONFIG.name} home`}>
              {SITE_CONFIG.name}
              <span className="tagline"> — {SITE_CONFIG.tagline}</span>
            </a>
          </h1>
          <WalletConnect />
        </header>

        <main id="main-content" role="main" aria-label="Primary content">
          <EventRegistration />
          <EventDashboard />
        </main>

        <SEOFooter />
      </div>
    </AppProvider>
  );
}

export default App;
