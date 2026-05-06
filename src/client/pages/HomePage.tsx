import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { Footer } from '../components/Footer';

interface Article {
  slug: string;
  title: string;
  meta_description: string;
  category: string;
  hero_url?: string;
  image_alt?: string;
  reading_time?: number;
  published_at?: string;
}

const FEATURED_TOPICS = [
  { icon: '🧠', label: 'Polyvagal Theory', href: '/articles?category=polyvagal-theory', desc: 'How your nervous system decides safe vs. threat' },
  { icon: '🌿', label: 'Somatic Experiencing', href: '/articles?category=somatic-healing', desc: 'Peter Levine\'s approach to releasing stored trauma' },
  { icon: '👁', label: 'EMDR', href: '/articles?category=emdr-therapy', desc: 'Bilateral stimulation and what the research shows' },
  { icon: '⚡', label: 'Nervous System', href: '/articles?category=nervous-system', desc: 'Dorsal vagal, ventral vagal, sympathetic states' },
  { icon: '💜', label: 'Trauma Therapy', href: '/articles?category=trauma-therapy', desc: 'When talk therapy isn\'t enough' },
  { icon: '🧘', label: 'Somatic Practices', href: '/articles?category=somatic-practices', desc: 'Body-based practices you can do today' },
];

export function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles?limit=6')
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-eyebrow">Somatic Healing For Life</div>
          <h1 className="hero-title">
            Somatic<br />For Life
          </h1>
          <p className="hero-subtitle">
            The research-grounded guide to somatic healing, nervous system regulation, and body-based trauma recovery. Science, practice, and zero fluff.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link to="/articles" className="hero-cta">
              Read the Articles →
            </Link>
            <Link to="/assessments" className="hero-cta" style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.4)', color: 'white' }}>
              Take an Assessment
            </Link>
          </div>
        </div>
      </section>

      <div className="page-content">
        {/* Featured Topics */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div className="page-header-eyebrow">Explore by Topic</div>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
              What's Stored in Your Body
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            {FEATURED_TOPICS.map(topic => (
              <Link
                key={topic.href}
                to={topic.href}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius)',
                  padding: 'var(--space-5)',
                  textDecoration: 'none',
                  transition: 'all var(--transition)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  boxShadow: 'var(--shadow-card)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <span style={{ fontSize: '1.75rem' }}>{topic.icon}</span>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{topic.label}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{topic.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Assessments Banner */}
        <section style={{
          background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          marginBottom: 'var(--space-12)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-6)',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7, marginBottom: 'var(--space-2)' }}>
              Free Assessments
            </div>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'white' }}>
              Where Is Your Nervous System Right Now?
            </h2>
            <p style={{ opacity: 0.85, maxWidth: '480px', lineHeight: 1.6 }}>
              Four research-based assessments to understand your nervous system state, trauma response patterns, and readiness for somatic work.
            </p>
          </div>
          <Link
            to="/assessments"
            style={{
              background: 'white',
              color: 'var(--accent-dark)',
              fontWeight: 700,
              padding: 'var(--space-4) var(--space-8)',
              borderRadius: 'var(--radius-full)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Take an Assessment →
          </Link>
        </section>

        {/* Latest Articles */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <div className="page-header-eyebrow">Latest</div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Articles
              </h2>
            </div>
            <Link to="/articles" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
              View all articles →
            </Link>
          </div>

          {loading ? (
            <div className="cards-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border-card)' }}>
                  <div className="skeleton" style={{ aspectRatio: '16/9' }} />
                  <div style={{ padding: 'var(--space-5)' }}>
                    <div className="skeleton" style={{ height: '12px', width: '60px', marginBottom: 'var(--space-3)' }} />
                    <div className="skeleton" style={{ height: '20px', marginBottom: 'var(--space-2)' }} />
                    <div className="skeleton" style={{ height: '20px', width: '80%', marginBottom: 'var(--space-4)' }} />
                    <div className="skeleton" style={{ height: '14px', width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="cards-grid">
              {articles.map(article => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Articles coming soon.</p>
              <p>The body's wisdom takes time to articulate well.</p>
            </div>
          )}
        </section>

        {/* Quote Banner */}
        <section style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-10)',
          textAlign: 'center',
          marginTop: 'var(--space-12)',
          marginBottom: 'var(--space-4)',
        }}>
          <blockquote style={{
            fontSize: 'var(--text-xl)',
            fontStyle: 'italic',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            maxWidth: '640px',
            margin: '0 auto var(--space-4)',
          }}>
            "The body doesn't lie. The mind does. Constantly."
          </blockquote>
          <cite style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', fontWeight: 600, fontStyle: 'normal' }}>
            — The Oracle Lover
          </cite>
        </section>
      </div>

      <Footer />
    </div>
  );
}
