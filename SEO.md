# SEO Optimization Documentation

## Overview

This document details the comprehensive SEO (Search Engine Optimization) implementation for the E-Watch blockchain event monitoring platform. The optimizations cover technical SEO, structured data, accessibility, and performance to maximize discoverability, improve search rankings, and ensure an inclusive user experience.

## Last Updated

2026-02-15

---

## Architecture

```
frontend/
├── public/
│   ├── robots.txt            # Crawler access rules
│   ├── sitemap.xml           # URL index for search engines
│   ├── site.webmanifest      # PWA & mobile SEO metadata
│   ├── opensearch.xml        # Browser search-bar integration
│   └── humans.txt            # Team & tech-stack attribution
├── index.html                # Static meta tags, resource hints, noscript
└── src/
    ├── config/
    │   └── seo.config.ts     # Centralized SEO constants
    ├── hooks/
    │   └── usePageSEO.ts     # React hook for dynamic meta management
    └── components/
        ├── SEO.tsx            # Legacy imperative meta component
        ├── SEOFooter.tsx      # Internal-link-rich footer
        ├── SEOImage.tsx       # Image wrapper enforcing alt text
        ├── SkipToContent.tsx  # Keyboard bypass block (WCAG 2.4.1)
        └── StructuredData.tsx # JSON-LD schema.org components
```

---

## 1. Crawl & Indexing Layer

### robots.txt

| Directive | Purpose |
|-----------|---------|
| `Allow: /` for major engines | Ensures Google, Bing, DuckDuckGo, Yandex, Baidu can index all pages |
| Per-engine crawl-delay | Prevents overloading: Googlebot 0 s, Bingbot 2 s, Yandex 5 s |
| `Disallow: /` for AI scrapers | Blocks GPTBot, CCBot, anthropic-ai, Google-Extended |
| Path restrictions | Blocks `/api/internal/`, `/admin/`, `/_debug/`, `*.json` |

### sitemap.xml

12 URLs with priority weighting:

| URL | Priority | Frequency |
|-----|----------|-----------|
| `/` | 1.0 | daily |
| `/dashboard` | 0.9 | daily |
| `/register` | 0.8 | weekly |
| `/explorer` | 0.8 | daily |
| `/getting-started` | 0.7 | monthly |
| `/docs` | 0.7 | weekly |
| `/docs/api` | 0.6 | monthly |
| `/docs/smart-contracts` | 0.6 | monthly |
| `/faq` | 0.5 | monthly |
| `/about` | 0.5 | monthly |
| `/privacy` | 0.3 | yearly |
| `/terms` | 0.3 | yearly |

---

## 2. Meta Tags & Head Configuration

### Static tags in `index.html`

- **Title:** 56 chars — `E-Watch - Blockchain Event Monitoring for Stacks Network`
- **Description:** 156 chars — includes primary keywords
- **Keywords:** 9 terms covering blockchain, stacks, web3, dapp
- **Canonical URL:** `https://ewatch.io/`
- **Robots:** `index, follow`
- **Open Graph:** type, url, title, description, image (1200×630), locale
- **Twitter Card:** `summary_large_image` with dedicated image
- **Schema.org JSON-LD:** WebApplication with free pricing, FinanceApplication category

### Dynamic tags via `usePageSEO` hook

The hook runs in any component and:
1. Sets `document.title`
2. Upserts `<meta>` tags (description, keywords, robots, OG, Twitter)
3. Updates `<link rel="canonical">`
4. **Cleans up on unmount** — removes any elements it created

```tsx
usePageSEO({
  title: PAGE_META.dashboard.title,
  description: PAGE_META.dashboard.description,
  keywords: PAGE_META.dashboard.keywords,
  canonical: PAGE_META.dashboard.canonical,
});
```

### Resource Hints

```html
<link rel="preconnect" href="https://stacks-node-api.mainnet.stacks.co" />
<link rel="dns-prefetch" href="https://stacks-node-api.mainnet.stacks.co" />
```

### PWA Manifest (`site.webmanifest`)

- Standalone display mode for "Add to Home Screen"
- Icons at 16, 32, 192, 512 px
- Shortcuts: Dashboard, Register Event
- Categories: finance, utilities, developer tools

### OpenSearch (`opensearch.xml`)

Allows browsers to register E-Watch as a search provider, routing queries to `/explorer?q={searchTerms}`.

---

## 3. Structured Data (schema.org)

All emitted via `<script type="application/ld+json">` components in `StructuredData.tsx`:

| Schema | Component | Purpose |
|--------|-----------|---------|
| Organization | `<OrganizationSchema />` | Knowledge panel, logo, social profiles |
| WebApplication | `<WebAppSchema />` | Software rich results, free pricing |
| BreadcrumbList | `<BreadcrumbSchema />` | Breadcrumb trail in SERPs |
| FAQPage | `<FAQSchema />` | Expandable FAQ cards in search |
| SoftwareSourceCode | `<SoftwareSourceCodeSchema />` | Open-source repo metadata |

---

## 4. Accessibility (WCAG 2.1 AA)

### Skip-to-content

`<SkipToContent />` is the first rendered element. Hidden until focused — keyboard users press Tab → Enter to bypass the header.

### ARIA Landmarks

| Element | Role | Identifier |
|---------|------|------------|
| `<header>` | banner | — |
| `<main>` | main | `#main-content` |
| `<footer>` | contentinfo | — |
| Search section | search | `aria-label="Event search"` |

### Form Accessibility

- `aria-required`, `aria-invalid`, `aria-describedby` on all inputs
- Required-field indicators with `<span class="required">`
- Character counters in `aria-describedby` help text
- `aria-live="polite"` on error/success messages
- `aria-busy` on loading buttons

### Wallet Connect

- `<nav>` landmark with `aria-label="Wallet connection"`
- `<abbr>` for truncated addresses (full address in `title`)
- `role="status"` announces connection changes

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. Component Inventory

### SEOFooter

Four-column footer with 12+ internal navigation links organized by:
- **Product:** Dashboard, Register, Explorer, Getting Started
- **Resources:** Docs, API, Smart Contracts, FAQ
- **Company:** About, Privacy, Terms, GitHub

Internal links distribute page authority (PageRank) across the site.

### SEOImage

Drop-in `<img>` replacement:
- `alt` is **required** (TypeScript enforced)
- `loading="lazy"` default for better LCP
- `decoding="async"` for non-blocking decode
- Optional `caption` renders `<figure>` + `<figcaption>`

### SEO Config (`seo.config.ts`)

Single source of truth for `SITE_CONFIG`, `PAGE_META`, and `SCHEMA_ORG`. No hardcoded SEO strings in components.

---

## 6. Performance Considerations

- **Code splitting:** Vite splits vendor (React) and stacks libraries into separate chunks
- **Console stripping:** `drop_console: true` in production builds
- **Lazy images:** `loading="lazy"` on all images via SEOImage
- **Preconnect:** Eliminates DNS + TLS round-trips to Stacks API
- **Minimal CSS:** No unused dark-mode styles, no Vite boilerplate

---

## 7. Testing Checklist

### SEO Validation
- [ ] `curl -s https://ewatch.io/robots.txt` returns valid rules
- [ ] `curl -s https://ewatch.io/sitemap.xml` returns valid XML
- [ ] Google Rich Results Test passes for all structured data
- [ ] Facebook Sharing Debugger shows correct OG image/title
- [ ] Twitter Card Validator shows `summary_large_image`
- [ ] Lighthouse SEO score ≥ 95

### Accessibility Validation
- [ ] Tab through entire page — skip link works on first press
- [ ] VoiceOver reads all form labels and error messages
- [ ] Color contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] No heading-level skips (H1 → H2 → H3 → H4)
- [ ] `prefers-reduced-motion` disables animations

---

## References

- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)
- [Schema.org](https://schema.org/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [web.dev Core Web Vitals](https://web.dev/vitals/)
- [OpenSearch](https://github.com/dewitt/opensearch)
- [humanstxt.org](https://humanstxt.org/)

---

**Maintained by:** E-Watch Development Team
**Version:** 2.0.0
