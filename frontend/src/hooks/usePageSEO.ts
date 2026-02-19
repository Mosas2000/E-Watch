import { useEffect, useRef } from 'react';
import { SITE_CONFIG } from '../config/seo.config';

interface PageSEOOptions {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

/**
 * Custom hook that manages document-level SEO meta tags.
 *
 * Preferred over the imperative SEO component because it:
 *  - Follows React hook conventions (composable, testable)
 *  - Cleans up meta tags on unmount to avoid stale data
 *  - Tracks which tags it owns so it never clobbers unrelated meta
 *
 * Usage:
 *   usePageSEO({
 *     title: 'Dashboard – E-Watch',
 *     description: 'Browse blockchain events…',
 *   });
 */
export function usePageSEO({
  title,
  description,
  keywords,
  canonical,
  ogImage = SITE_CONFIG.ogImage,
  ogType = 'website',
  noindex = false,
}: PageSEOOptions): void {
  const createdElements = useRef<HTMLElement[]>([]);

  useEffect(() => {
    // Keep track of elements we create so we can remove them on cleanup
    const created: HTMLElement[] = [];

    // --- Title -----------------------------------------------------------
    const prevTitle = document.title;
    document.title = title;

    // --- Helper ----------------------------------------------------------
    const upsertMeta = (
      attr: 'name' | 'property',
      key: string,
      content: string,
    ) => {
      let el = document.querySelector<HTMLMetaElement>(
        `meta[${attr}="${key}"]`,
      );
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        created.push(el);
      }
      el.setAttribute('content', content);
    };

    // --- Standard meta ---------------------------------------------------
    upsertMeta('name', 'description', description);
    if (keywords) upsertMeta('name', 'keywords', keywords);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // --- Open Graph ------------------------------------------------------
    const fullUrl = `${SITE_CONFIG.url}${canonical ?? '/'}`;
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:url', fullUrl);
    upsertMeta('property', 'og:site_name', SITE_CONFIG.name);
    upsertMeta('property', 'og:locale', SITE_CONFIG.locale);

    // --- Twitter Card ----------------------------------------------------
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);
    upsertMeta('name', 'twitter:image:alt', title);
    upsertMeta('name', 'twitter:creator', SITE_CONFIG.twitterHandle);
    upsertMeta('name', 'twitter:site', SITE_CONFIG.twitterHandle);

    // --- Canonical -------------------------------------------------------
    let link = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
      created.push(link);
    }
    link.setAttribute('href', fullUrl);

    createdElements.current = created;

    // --- Cleanup on unmount / dependency change --------------------------
    return () => {
      document.title = prevTitle;
      created.forEach((el) => el.parentNode?.removeChild(el));
    };
  }, [title, description, keywords, canonical, ogImage, ogType, noindex]);
}
