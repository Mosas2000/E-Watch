/**
 * SEO Image Utility
 *
 * Provides a type-safe wrapper around <img> that enforces alt text
 * and adds loading="lazy" by default. Missing alt text is the #1
 * accessibility and SEO audit failure on most sites — this component
 * makes it impossible to forget.
 */

import { ImgHTMLAttributes } from 'react';

interface SEOImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Alt text is required — set to "" for decorative images */
  alt: string;
  /** Optional caption shown below the image */
  caption?: string;
}

/**
 * Drop-in replacement for <img> that enforces alt text and enables
 * lazy loading by default for better Core Web Vitals.
 *
 * Usage:
 *   <SEOImage
 *     src="/screenshots/dashboard.png"
 *     alt="E-Watch event dashboard showing real-time blockchain events"
 *     width={800}
 *     height={450}
 *   />
 */
export const SEOImage = ({
  alt,
  caption,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: SEOImageProps) => {
  if (caption) {
    return (
      <figure className="seo-image-figure">
        <img
          alt={alt}
          loading={loading}
          decoding={decoding}
          {...props}
        />
        <figcaption>{caption}</figcaption>
      </figure>
    );
  }

  return (
    <img
      alt={alt}
      loading={loading}
      decoding={decoding}
      {...props}
    />
  );
};
