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
    title: 'E-Watch | Stacks Blockchain Event Monitor',
    description:
      'Track, register, and manage blockchain events on Stacks. Real-time dashboards with smart contract integration and Hiro wallet support.',
    keywords:
      'blockchain event monitoring, stacks network, smart contracts, clarity, web3 dapp, on-chain events, decentralized, hiro wallet',
    canonical: '/',
  },
  dashboard: {
    title: 'Event Dashboard | E-Watch',
    description:
      'Search blockchain events on Stacks by ID or status. View owner details, timestamps, and transaction data in a filterable dashboard.',
    keywords:
      'blockchain dashboard, event search, stacks explorer, on-chain data, event filter, transaction history',
    canonical: '/dashboard',
  },
  register: {
    title: 'Register Event | E-Watch',
    description:
      'Submit events to the Stacks blockchain for permanent on-chain storage. Supports custom event types and JSON payloads up to 500 bytes.',
    keywords:
      'register blockchain event, stacks transaction, on-chain registration, smart contract call, clarity contract',
    canonical: '/register',
  },
  docs: {
    title: 'Developer Docs | E-Watch',
    description:
      'API reference, Clarity contract docs, and integration guides for E-Watch. Build custom monitors on the Stacks blockchain.',
    keywords:
      'ewatch docs, blockchain documentation, stacks developer guide, clarity smart contracts, api reference',
    canonical: '/docs',
  },
  faq: {
    title: 'FAQ | E-Watch',
    description:
      'Common questions about E-Watch event monitoring, Hiro wallet setup, on-chain registration costs, and Stacks network compatibility.',
    keywords:
      'ewatch faq, blockchain questions, stacks help, event monitoring support, wallet setup',
    canonical: '/faq',
  },
  about: {
    title: 'About | E-Watch',
    description:
      'E-Watch is an open-source blockchain event monitor built on Stacks. Learn about the project mission, team, and development roadmap.',
    keywords:
      'about ewatch, blockchain team, stacks project, open source monitoring, roadmap',
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
      {
        '@type': 'Question',
        name: 'What data can I store in an event?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Each event has a type field (up to 50 characters) and a data field (up to 500 characters). You can store JSON, plain text, or any string payload that fits within the size limits.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I update or deactivate an event after registration?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The event owner can update the data field or deactivate an event through the smart contract. Only the original registrant wallet address has permission to modify their events.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I search for an event?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use the Event Dashboard to search by numeric event ID. You can also filter results by active or inactive status to narrow down your search.',
        },
      },
    ],
  },
} as const;
