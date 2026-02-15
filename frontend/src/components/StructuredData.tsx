import { SITE_CONFIG } from '../config/seo.config';

// ─── Types ────────────────────────────────────────────────────────────

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface StructuredDataProps {
  /** Raw JSON-LD object to inject */
  data: Record<string, unknown>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

// ─── Generic JSON-LD Injector ─────────────────────────────────────────

/**
 * Renders a <script type="application/ld+json"> tag.
 * Use this for any arbitrary schema.org structured data.
 */
export const StructuredData = ({ data }: StructuredDataProps) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

// ─── Breadcrumb Schema ────────────────────────────────────────────────

/**
 * Generates BreadcrumbList structured data from an ordered list of
 * navigation items.  Google uses this to display breadcrumbs directly
 * in search results.
 *
 * Usage:
 *   <BreadcrumbSchema items={[
 *     { name: 'Home', path: '/' },
 *     { name: 'Dashboard', path: '/dashboard' },
 *   ]} />
 */
export const BreadcrumbSchema = ({ items }: BreadcrumbProps) => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${SITE_CONFIG.url}${item.path}`,
    })),
  };

  return <StructuredData data={data} />;
};

// ─── Organization Schema ──────────────────────────────────────────────

/**
 * Emits Organization structured data so Google can display a knowledge
 * panel with the project logo, social profiles, and contact info.
 */
export const OrganizationSchema = () => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/icon-512x512.png`,
    description:
      'Open-source blockchain event monitoring platform for the Stacks network.',
    sameAs: [
      `https://twitter.com/${SITE_CONFIG.twitterHandle.replace('@', '')}`,
      'https://github.com/ewatch',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'technical support',
      url: `${SITE_CONFIG.url}/docs`,
    },
  };

  return <StructuredData data={data} />;
};

// ─── WebApplication Schema ────────────────────────────────────────────

/**
 * Marks the page as a WebApplication in schema.org.
 * Improves rich-result eligibility for software listings.
 */
export const WebAppSchema = () => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_CONFIG.name,
    description:
      'Blockchain event monitoring platform for the Stacks network. Register, track, and manage on-chain events in real time.',
    url: SITE_CONFIG.url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript. Works in all modern browsers.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'E-Watch Team',
      url: SITE_CONFIG.url,
    },
    screenshot: `${SITE_CONFIG.url}/screenshots/dashboard.png`,
  };

  return <StructuredData data={data} />;
};

// ─── FAQ Schema ───────────────────────────────────────────────────────

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

/**
 * Generates FAQPage structured data.  Google may render these directly
 * in search results as expandable answer cards.
 */
export const FAQSchema = ({ items }: FAQSchemaProps) => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return <StructuredData data={data} />;
};

// ─── Software Source Code Schema ──────────────────────────────────────

/**
 * Marks the project as open-source software with a link to the repo.
 * Helps Google understand the project's codebase and license.
 */
export const SoftwareSourceCodeSchema = () => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: SITE_CONFIG.name,
    description: 'Blockchain event monitoring smart contracts and web application.',
    codeRepository: 'https://github.com/ewatch/E-Watch',
    programmingLanguage: ['TypeScript', 'Clarity'],
    runtimePlatform: 'Stacks Blockchain',
    license: 'https://opensource.org/licenses/MIT',
    author: {
      '@type': 'Organization',
      name: 'E-Watch Team',
    },
  };

  return <StructuredData data={data} />;
};
