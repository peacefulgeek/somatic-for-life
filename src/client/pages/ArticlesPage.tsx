import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CategoryCount {
  category: string;
  count: number;
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

export function ArticlesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';

  const fetchArticles = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '12');
    if (category) params.set('category', category);
    if (search) params.set('search', search);

    fetch(`/api/articles?${params}`)
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles || []);
        setPagination(data.pagination || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, page, search]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    fetch('/api/articles/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleCategoryClick = (cat: string) => {
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput) params.set('search', searchInput);
    else params.delete('search');
    params.delete('page');
    setSearchParams(params);
  };

  const handlePage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCategory = CATEGORY_LABELS[category] || category;

  return (
    <div>
      <div className="page-content">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Articles' },
        ]} />

        <div className="page-header">
          <div className="page-header-eyebrow">
            {category ? `Topic: ${activeCategory}` : 'All Articles'}
          </div>
          <h1 className="page-header-title">
            {category ? activeCategory : 'The Body Remembers Library'}
          </h1>
          <p className="page-header-description">
            {category
              ? `Articles on ${activeCategory.toLowerCase()} — research-grounded, direct, and practical.`
              : 'Research-grounded writing on somatic trauma healing, nervous system regulation, and body-based approaches to recovery.'}
          </p>
        </div>

        {/* Search + View Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <form onSubmit={handleSearch} className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Search articles..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              aria-label="Search articles"
            />
          </form>

          <div className="view-toggle">
            <button
              className={`view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
              Grid
            </button>
            <button
              className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              List
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          <button
            className={`category-filter-btn${!category ? ' active' : ''}`}
            onClick={() => handleCategoryClick('')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.category}
              className={`category-filter-btn${category === cat.category ? ' active' : ''}`}
              onClick={() => handleCategoryClick(cat.category)}
            >
              {CATEGORY_LABELS[cat.category] || cat.category}
              <span style={{ marginLeft: '6px', opacity: 0.7 }}>({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Results count */}
        {pagination && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
            {pagination.total} article{pagination.total !== 1 ? 's' : ''}
            {category ? ` in ${activeCategory}` : ''}
            {search ? ` matching "${search}"` : ''}
          </p>
        )}

        {/* Articles Grid/List */}
        {loading ? (
          <div className={`cards-grid${viewMode === 'list' ? ' list-view' : ''}`}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
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
          <div className={`cards-grid${viewMode === 'list' ? ' list-view' : ''}`}>
            {articles.map(article => (
              <ArticleCard key={article.slug} article={article} listView={viewMode === 'list'} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>No articles found.</p>
            <p>Try a different search or category.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePage(page - 1)}
              disabled={!pagination.hasPrev}
              aria-label="Previous page"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(7, pagination.pages) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={`pagination-btn${page === p ? ' active' : ''}`}
                  onClick={() => handlePage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={page === p ? 'page' : undefined}
                >
                  {p}
                </button>
              );
            })}
            {pagination.pages > 7 && <span style={{ color: 'var(--text-muted)', padding: '0 var(--space-2)' }}>...</span>}
            <button
              className="pagination-btn"
              onClick={() => handlePage(page + 1)}
              disabled={!pagination.hasNext}
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
