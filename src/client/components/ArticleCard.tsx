import React from 'react';
import { Link } from 'react-router-dom';

interface Article {
  slug: string;
  title: string;
  meta_description: string;
  category: string;
  hero_url?: string;
  image_alt?: string;
  reading_time?: number | string;
  published_at?: string;
}

interface ArticleCardProps {
  article: Article;
  listView?: boolean;
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

const CATEGORY_EMOJIS: Record<string, string> = {
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ArticleCard({ article, listView = false }: ArticleCardProps) {
  const categoryLabel = CATEGORY_LABELS[article.category] || article.category;
  const categoryEmoji = CATEGORY_EMOJIS[article.category] || '📄';

  return (
    <Link to={`/articles/${article.slug}`} className="article-card" aria-label={article.title}>
      {/* Hero Image */}
      {article.hero_url ? (
        <img
          src={article.hero_url}
          alt={article.image_alt || article.title}
          className="article-card-image"
          loading="lazy"
          width="400"
          height="225"
        />
      ) : (
        <div className="article-card-image-placeholder" aria-hidden="true">
          {categoryEmoji}
        </div>
      )}

      {/* Card Body */}
      <div className="article-card-body">
        <div className="article-card-category">{categoryLabel}</div>
        <h2 className="article-card-title">{article.title}</h2>
        {article.meta_description && (
          <p className="article-card-excerpt">{article.meta_description}</p>
        )}
        <div className="article-card-meta">
          <span>The Oracle Lover</span>
          {article.reading_time && (
            <>
              <span className="article-card-meta-dot" />
              <span>{typeof article.reading_time === 'string' && String(article.reading_time).includes('min') ? article.reading_time : `${article.reading_time} min read`}</span>
            </>
          )}
          {article.published_at && (
            <>
              <span className="article-card-meta-dot" />
              <span>{formatDate(article.published_at)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
