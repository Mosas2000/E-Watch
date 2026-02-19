import { WalletConnect } from './components/WalletConnect';
import { EventRegistration } from './components/EventRegistration';
import { EventDashboard } from './components/EventDashboard';
import { GovernanceDashboard } from './components/GovernanceDashboard';
import { StatusPage } from './components/StatusPage';
import { AppProvider } from './contexts/AppContext';
import { SkipToContent } from './components/SkipToContent';
import { SEOFooter } from './components/SEOFooter';
import {
  BreadcrumbSchema,
  OrganizationSchema,
  SoftwareSourceCodeSchema,
  WebAppSchema,
} from './components/StructuredData';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  WalletFallback,
  RegistrationFallback,
  DashboardFallback,
  AppFallback,
} from './components/ErrorFallbacks';
import { ErrorToast } from './components/ErrorToast';
import { ErrorProvider } from './contexts/ErrorContext';
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
    <ErrorBoundary boundary="app-root" fallback={<AppFallback />}>
      <AppProvider>
        <ErrorProvider>
      {/* Structured data for search engine rich results */}
      <OrganizationSchema />
      <WebAppSchema />
      <SoftwareSourceCodeSchema />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Governance', path: '/governance' },
          { name: 'Status', path: '/status' },
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
          <ErrorBoundary boundary="wallet" fallback={<WalletFallback />}>
            <WalletConnect />
          </ErrorBoundary>
        </header>

        <main id="main-content" role="main" aria-label="Primary content">
          <ErrorBoundary boundary="registration" fallback={<RegistrationFallback />}>
            <EventRegistration />
          </ErrorBoundary>
          <ErrorBoundary boundary="dashboard" fallback={<DashboardFallback />}>
            <EventDashboard />
          </ErrorBoundary>
          <ErrorBoundary boundary="governance" fallback={<DashboardFallback />}>
            <GovernanceDashboard />
          </ErrorBoundary>
          <ErrorBoundary boundary="status-page" fallback={<DashboardFallback />}>
            <StatusPage />
          </ErrorBoundary>
        </main>

        <SEOFooter />
      </div>

      <ErrorToast />
        </ErrorProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
