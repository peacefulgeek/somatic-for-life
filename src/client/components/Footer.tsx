import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand-name">Somatic For Life</div>
          <p className="footer-brand-desc">
            The research-grounded resource for somatic healing for life. What the body does with unprocessed experience, why talk therapy alone often doesn't resolve it, and what somatic approaches actually involve.
          </p>
          <p className="footer-disclosure">
            As an Amazon Associate I earn from qualifying purchases.
          </p>
        </div>

        <div>
          <div className="footer-col-title">Explore</div>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/articles">All Articles</Link></li>
            <li><Link to="/assessments">Assessments</Link></li>
            <li><Link to="/recommended">Recommended</Link></li>
          </ul>
        </div>

        <div>
          <div className="footer-col-title">Topics</div>
          <ul className="footer-links">
            <li><Link to="/articles?category=somatic-healing">Somatic Healing</Link></li>
            <li><Link to="/articles?category=nervous-system">Nervous System</Link></li>
            <li><Link to="/articles?category=trauma-therapy">Trauma Therapy</Link></li>
            <li><Link to="/articles?category=polyvagal-theory">Polyvagal Theory</Link></li>
            <li><Link to="/articles?category=emdr-therapy">EMDR</Link></li>
          </ul>
        </div>

        <div>
          <div className="footer-col-title">Connect</div>
          <ul className="footer-links">
            <li><Link to="/about">About</Link></li>
            <li>
              <a href="https://theoraclelover.com" target="_blank" rel="noopener noreferrer">
                The Oracle Lover
              </a>
            </li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
          <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.4)' }}>
            Somatic trauma healing for the body that remembers.
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} Somatic For Life. All rights reserved.</span>
        <span>
          Written by{' '}
          <a href="https://theoraclelover.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.6)' }}>
            The Oracle Lover
          </a>
        </span>
      </div>
    </footer>
  );
}
