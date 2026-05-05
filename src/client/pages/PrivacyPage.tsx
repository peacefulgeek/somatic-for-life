import React from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';

export function PrivacyPage() {
  return (
    <div>
      <div className="page-content">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]} />
        <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
          <div className="page-header">
            <h1 className="page-header-title">Privacy Policy</h1>
            <p className="page-header-description">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="article-body">
            <h2>What We Collect</h2>
            <p>This site does not collect personal information beyond what is standard for web analytics (IP addresses, page views, browser type). We do not require account creation or email addresses to access content.</p>
            <h2>Assessments</h2>
            <p>Assessment results are processed entirely in your browser. We do not store, transmit, or retain your assessment answers or results.</p>
            <h2>Amazon Affiliate Links</h2>
            <p>This site participates in the Amazon Services LLC Associates Program. When you click an Amazon link, Amazon may set cookies to track your purchase. Please refer to Amazon's privacy policy for details on their data practices.</p>
            <h2>Cookies</h2>
            <p>We may use minimal cookies for site functionality. We do not use advertising cookies or sell your data to third parties.</p>
            <h2>Contact</h2>
            <p>For privacy-related questions, please contact us through <a href="https://theoraclelover.com" target="_blank" rel="noopener noreferrer">theoraclelover.com</a>.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
