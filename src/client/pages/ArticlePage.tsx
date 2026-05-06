import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ArticleCard } from '../components/ArticleCard';
import { Footer } from '../components/Footer';

interface Article {
  id: number;
  slug: string;
  title: string;
  meta_description: string;
  og_title?: string;
  og_description?: string;
  category: string;
  tags?: string[];
  body: string;
  hero_url?: string;
  image_alt?: string;
  reading_time?: number;
  published_at?: string;
  last_modified_at?: string;
  word_count?: number;
}

interface RelatedArticle {
  slug: string;
  title: string;
  meta_description: string;
  category: string;
  hero_url?: string;
  reading_time?: number;
  published_at?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'somatic-healing': 'Somatic Healing',
  'nervous-system': 'Nervous System',
  'trauma-therapy': 'Trauma Therapy',
  'emdr-therapy': 'EMDR',
  'polyvagal-theory': 'Polyvagal Theory',
  'somatic-practices': 'Somatic Practices',
  'trauma-research': 'Research',
  'body-mind': 'Body-Mind',
  'self-directed': 'Self-Directed',
  'recommended-tools': 'Tools',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    fetch(`/api/articles/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(data => {
        setArticle(data.article);
        setRelated(data.related || []);
        setLoading(false);
        // Update document title
        if (data.article?.title) {
          document.title = `${data.article.title} | Somatic For Life`;
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  if (loading) {
    return (
      <div className="page-content">
        <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto' }}>
          <div className="skeleton" style={{ height: '14px', width: '200px', marginBottom: 'var(--space-8)' }} />
          <div className="skeleton" style={{ aspectRatio: '16/7', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-8)' }} />
          <div className="skeleton" style={{ height: '36px', marginBottom: 'var(--space-3)' }} />
          <div className="skeleton" style={{ height: '36px', width: '70%', marginBottom: 'var(--space-6)' }} />
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton" style={{ height: '18px', marginBottom: 'var(--space-3)', width: i % 2 === 0 ? '90%' : '100%' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="page-content">
        <div style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', textAlign: 'center', padding: 'var(--space-16)' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)' }}>Article Not Found</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
            This article doesn't exist or hasn't been published yet.
          </p>
          <Link to="/articles" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            ← Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabel = CATEGORY_LABELS[article.category] || article.category;

  return (
    <div>
      <div className="page-content">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Articles', href: '/articles' },
          { label: categoryLabel, href: `/articles?category=${article.category}` },
          { label: article.title },
        ]} />

        <article className="article-page" ref={articleRef}>
          {/* Hero Image */}
          {article.hero_url ? (
            <img
              src={article.hero_url}
              alt={article.image_alt || article.title}
              className="article-hero"
              width="740"
              height="320"
              loading="eager"
            />
          ) : (
            <div className="article-hero-placeholder" aria-hidden="true">
              {article.category === 'nervous-system' ? '⚡' :
               article.category === 'somatic-healing' ? '🌿' :
               article.category === 'trauma-therapy' ? '💜' :
               article.category === 'emdr-therapy' ? '👁' :
               article.category === 'polyvagal-theory' ? '🧠' :
               article.category === 'somatic-practices' ? '🧘' : '📖'}
            </div>
          )}

          {/* Article Header */}
          <header className="article-header">
            <Link to={`/articles?category=${article.category}`} className="article-category-badge">
              {categoryLabel}
            </Link>
            <h1 className="article-title">{article.title}</h1>
            <div className="article-meta">
              <span className="article-meta-author">
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>OL</span>
                The Oracle Lover
              </span>
              {article.reading_time && (
                <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span>{article.reading_time} min read</span>
                </>
              )}
              {article.word_count && (
                <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span>{article.word_count.toLocaleString()} words</span>
                </>
              )}
              {article.published_at && (
                <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
                </>
              )}
              {article.last_modified_at && article.last_modified_at !== article.published_at && (
                <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span>Updated <time dateTime={article.last_modified_at}>{formatDate(article.last_modified_at)}</time></span>
                </>
              )}
            </div>
          </header>

          {/* Article Body */}
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {article.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Share */}
          <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>Share:</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)', fontWeight: 600 }}
            >
              Twitter/X
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)', fontSize: 'var(--text-sm)', fontWeight: 600 }}
            >
              Facebook
            </a>
          </div>
        </article>

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="related-articles" style={{ maxWidth: 'var(--max-content-width)', margin: 'var(--space-12) auto 0' }}>
            <h2>Related Articles</h2>
            <div className="related-grid">
              {related.slice(0, 4).map(a => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}
