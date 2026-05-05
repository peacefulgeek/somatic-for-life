import React from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';

export function NotFoundPage() {
  return (
    <div>
      <div className="page-content" style={{ textAlign: 'center', padding: 'var(--space-20) var(--space-8)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-6)' }}>🌿</div>
        <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>Page Not Found</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-8)', maxWidth: '400px', margin: '0 auto var(--space-8)' }}>
          This page doesn't exist. The body remembers, but this URL doesn't.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{
            background: 'var(--accent)', color: 'white',
            padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-full)',
            fontWeight: 600, textDecoration: 'none',
          }}>
            Go Home
          </Link>
          <Link to="/articles" style={{
            background: 'var(--bg-card)', color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-full)',
            fontWeight: 600, textDecoration: 'none',
          }}>
            Browse Articles
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
