/**
 * SEO Configuration Constants
 *
 * Centralizes all SEO-related metadata so that page titles, descriptions,
 * Open Graph values, and structured data stay consistent across the
 * entire application.  Import from here instead of hardcoding strings
 * in individual components.
 */

export const SITE_CONFIG = {
  name: 'E-Watch',
  tagline: 'Blockchain Event Monitoring',
  url: 'https://ewatch.io',
  locale: 'en_US',
  themeColor: '#5546ff',
  twitterHandle: '@ewatch_io',
  ogImage: 'https://ewatch.io/og-image.png',
  twitterImage: 'https://ewatch.io/twitter-image.png',
} as const;

/**
 * Per-page meta definitions.
 * Each key maps to a logical "page" in the SPA.
 */
export const PAGE_META = {
  home: {
    title: 'E-Watch – Blockchain Event Monitoring on Stacks',
    description:
      'Monitor, register, and manage blockchain events on the Stacks network. Real-time dashboards, smart-contract integration, and secure wallet connectivity.',
    keywords:
      'blockchain event monitoring, stacks network, smart contracts, clarity, web3 dapp, on-chain events, decentralized',
    canonical: '/',
  },
  dashboard: {
    title: 'Event Dashboard – E-Watch',
    description:
      'Browse and search blockchain events stored on the Stacks network. Filter by status, view transaction history, and export event data.',
    keywords:
      'blockchain dashboard, event search, stacks explorer, on-chain data, event filter',
    canonical: '/dashboard',
  },
  register: {
    title: 'Register Event – E-Watch',
    description:
      'Submit new events to the Stacks blockchain for permanent, immutable storage and real-time tracking through the E-Watch platform.',
    keywords:
      'register blockchain event, stacks transaction, on-chain registration, smart contract call',
    canonical: '/register',
  },
  docs: {
    title: 'Documentation – E-Watch',
    description:
      'Complete developer documentation for E-Watch. Learn how to integrate with the Stacks blockchain, use the smart contract API, and build custom event monitors.',
    keywords:
      'ewatch docs, blockchain documentation, stacks developer guide, clarity smart contracts',
    canonical: '/docs',
  },
  faq: {
    title: 'Frequently Asked Questions – E-Watch',
    description:
      'Answers to common questions about E-Watch blockchain event monitoring, wallet setup, event registration, and Stacks network integration.',
    keywords:
      'ewatch faq, blockchain questions, stacks help, event monitoring support',
    canonical: '/faq',
  },
  about: {
    title: 'About – E-Watch',
    description:
      'Learn about E-Watch, the open-source blockchain event monitoring platform built on Stacks. Our mission, team, and roadmap.',
    keywords:
      'about ewatch, blockchain team, stacks project, open source monitoring',
    canonical: '/about',
  },
} as const;

/**
 * Schema.org structured data templates.
 * Used by the StructuredData component.
 */
export const SCHEMA_ORG = {
  webApplication: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_CONFIG.name,
    description: PAGE_META.home.description,
    url: SITE_CONFIG.url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
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
  },

  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'E-Watch',
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/icon-512x512.png`,
    description: 'Open-source blockchain event monitoring platform for the Stacks network.',
    sameAs: [
      'https://twitter.com/ewatch_io',
      'https://github.com/ewatch',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'technical support',
      url: `${SITE_CONFIG.url}/docs`,
    },
  },

  breadcrumbBase: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [] as Array<{
      '@type': 'ListItem';
      position: number;
      name: string;
      item: string;
    }>,
  },

  faq: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is E-Watch?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'E-Watch is an open-source blockchain event monitoring platform built on the Stacks network. It allows users to register, query, and manage on-chain events in real time.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I connect my wallet?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Click the "Connect Wallet" button in the header. E-Watch supports Hiro Wallet and other Stacks-compatible wallets. You will be prompted to approve the connection.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is E-Watch free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. E-Watch is completely free and open-source. The only costs are standard Stacks network transaction fees when registering events on-chain.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which blockchain does E-Watch support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'E-Watch is built on the Stacks blockchain, which settles on Bitcoin. It uses Clarity smart contracts for event management.',
        },
      },
    ],
  },
} as const;
