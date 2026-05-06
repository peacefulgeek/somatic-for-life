import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface Article {
  slug: string;
  title: string;
  category: string;
  reading_time: number;
  published_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'somatic-healing': 'Somatic Healing',
  'nervous-system': 'Nervous System',
  'trauma-therapy': 'Trauma Therapy',
  'emdr-therapy': 'EMDR',
  'polyvagal-theory': 'Polyvagal Theory',
  'somatic-practices': 'Somatic Practices',
  'trauma-research': 'Research & Science',
  'body-mind': 'Body-Mind Connection',
  'self-directed': 'Self-Directed Work',
  'recommended-tools': 'Recommended Tools',
};

const CATEGORY_ICONS: Record<string, string> = {
  'somatic-healing': '🌿',
  'nervous-system': '⚡',
  'trauma-therapy': '💜',
  'emdr-therapy': '👁',
  'polyvagal-theory': '🧠',
  'somatic-practices': '🧘',
  'trauma-research': '📚',
  'body-mind': '🫀',
  'self-directed': '🌱',
  'recommended-tools': '🛠',
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [popular, setPopular] = useState<Article[]>([]);
  const [recent, setRecent] = useState<Article[]>([]);
  const location = useLocation();

  useEffect(() => {
    fetch('/api/articles/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});

    fetch('/api/articles/popular')
      .then(r => r.json())
      .then(setPopular)
      .catch(() => {});

    fetch('/api/articles/recent')
      .then(r => r.json())
      .then(setRecent)
      .catch(() => {});
  }, []);

  const totalArticles = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <aside className={`sidebar${isOpen ? ' mobile-open' : ''}`} role="navigation" aria-label="Site navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link to="/" onClick={onClose}>
          <span className="sidebar-logo-name">Somatic For Life</span>
          <span className="sidebar-logo-tagline">Somatic Healing For Life</span>
        </Link>
      </div>

      {/* Author */}
      <div className="sidebar-author">
        <div className="sidebar-author-photo">
          <span className="sidebar-author-photo-placeholder">OL</span>
        </div>
        <div className="sidebar-author-name">The Oracle Lover</div>
        <div className="sidebar-author-title">Intuitive Educator & Oracle Guide</div>
        <p className="sidebar-author-bio">
          Demystifying somatic healing for life with science, directness, and zero fluff. The body doesn't lie. Let's work with what it's telling you.
        </p>
        <a
          href="https://theoraclelover.com"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-author-link"
        >
          theoraclelover.com →
        </a>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-title">Navigate</div>
        <NavLink to="/" end className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span>🏠 Home</span>
        </NavLink>
        <NavLink to="/articles" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span>📖 All Articles</span>
          {totalArticles > 0 && <span className="sidebar-nav-badge">{totalArticles}</span>}
        </NavLink>
        <NavLink to="/assessments" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span>✅ Assessments</span>
          <span className="sidebar-nav-badge">9</span>
        </NavLink>
        <NavLink to="/supplements" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span>🌿 Herbs & Supplements</span>
          <span className="sidebar-nav-badge">200+</span>
        </NavLink>
        <NavLink to="/recommended" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span>📦 Recommended</span>
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}>
          <span>👤 About</span>
        </NavLink>

        {/* Categories */}
        {categories.length > 0 && (
          <>
            <div className="sidebar-nav-title" style={{ marginTop: 'var(--space-5)' }}>Topics</div>
            {categories.map(cat => (
              <NavLink
                key={cat.category}
                to={`/articles?category=${cat.category}`}
                className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
              >
                <span>
                  {CATEGORY_ICONS[cat.category] || '📄'}{' '}
                  {CATEGORY_LABELS[cat.category] || cat.category}
                </span>
                <span className="sidebar-nav-badge">{cat.count}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Popular Articles */}
      {popular.length > 0 && (
        <div className="sidebar-module">
          <div className="sidebar-module-title">Popular</div>
          {popular.slice(0, 4).map(article => (
            <Link
              key={article.slug}
              to={`/articles/${article.slug}`}
              className="sidebar-module-item"
              onClick={onClose}
            >
              <span className="sidebar-module-item-title">{article.title}</span>
              <span className="sidebar-module-item-meta">{article.reading_time} min read</span>
            </Link>
          ))}
        </div>
      )}

      {/* Recent Articles */}
      {recent.length > 0 && (
        <div className="sidebar-module">
          <div className="sidebar-module-title">Recent</div>
          {recent.slice(0, 4).map(article => (
            <Link
              key={article.slug}
              to={`/articles/${article.slug}`}
              className="sidebar-module-item"
              onClick={onClose}
            >
              <span className="sidebar-module-item-title">{article.title}</span>
              <span className="sidebar-module-item-meta">
                {article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              </span>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}
