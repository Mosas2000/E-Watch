import { SITE_CONFIG } from '../config/seo.config';

/**
 * SEOFooter
 *
 * A semantically rich footer with internal navigation links, social
 * profiles, and structured content. Internal links create a strong
 * internal linking structure which is a key SEO signal, and the
 * nav elements provide additional crawlable pathways for search
 * engine bots.
 */
export const SEOFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer" role="contentinfo">
      <div className="container">
        <div className="footer-content">
          {/* Brand & Description */}
          <section className="footer-section" aria-label="About E-Watch">
            <h3>{SITE_CONFIG.name}</h3>
            <p>
              Open-source blockchain event monitoring platform built on the
              Stacks network. Track, register, and manage on-chain events with
              real-time dashboards and secure wallet integration.
            </p>
          </section>

          {/* Product Links - internal linking for SEO */}
          <nav className="footer-section" aria-label="Product navigation">
            <h3>Product</h3>
            <ul>
              <li><a href="/dashboard" title="Search and browse blockchain events">Event Dashboard</a></li>
              <li><a href="/register" title="Submit a new event to the Stacks blockchain">Register Event</a></li>
              <li><a href="/explorer" title="Explore all registered on-chain events">Event Explorer</a></li>
              <li><a href="/getting-started" title="Setup guide for new users">Getting Started</a></li>
            </ul>
          </nav>

          {/* Resources Links */}
          <nav className="footer-section" aria-label="Resources navigation">
            <h3>Resources</h3>
            <ul>
              <li><a href="/docs" title="Full developer documentation and guides">Documentation</a></li>
              <li><a href="/docs/api" title="REST API endpoints and usage">API Reference</a></li>
              <li><a href="/docs/smart-contracts" title="Clarity contract interface and functions">Smart Contracts</a></li>
              <li><a href="/faq" title="Common questions about E-Watch">FAQ</a></li>
            </ul>
          </nav>

          {/* Company / Legal */}
          <nav className="footer-section" aria-label="Company navigation">
            <h3>Company</h3>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
              <li>
                <a
                  href="https://github.com/ewatch/E-Watch"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="E-Watch on GitHub (opens in new tab)"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Social links and copyright */}
        <div className="footer-bottom">
          <div className="footer-social" aria-label="Social media links">
            <a
              href="https://twitter.com/ewatch_io"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow E-Watch on Twitter"
            >
              Twitter
            </a>
            <a
              href="https://github.com/ewatch"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="E-Watch GitHub organization"
            >
              GitHub
            </a>
            <a
              href="https://discord.gg/ewatch"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join E-Watch Discord community"
            >
              Discord
            </a>
          </div>
          <p>
            &copy; {currentYear} {SITE_CONFIG.name}. Built on{' '}
            <a
              href="https://www.stacks.co"
              target="_blank"
              rel="noopener noreferrer"
            >
              Stacks
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
