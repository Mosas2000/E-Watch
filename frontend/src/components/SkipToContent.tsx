/**
 * SkipToContent
 *
 * An accessibility-first component that provides a hidden link
 * allowing keyboard users to jump straight to the main content,
 * bypassing the header navigation.
 *
 * It becomes visible only when focused (tab key), following WCAG 2.1
 * Success Criterion 2.4.1 (Bypass Blocks).
 *
 * Place this as the very first child of <body> or the root component.
 */

interface SkipToContentProps {
  targetId?: string;
  label?: string;
}

export const SkipToContent = ({
  targetId = 'main-content',
  label = 'Skip to main content',
}: SkipToContentProps) => (
  <a
    href={`#${targetId}`}
    className="skip-to-content"
    aria-label={label}
  >
    {label}
  </a>
);
