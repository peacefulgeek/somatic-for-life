import React, { useState, useEffect } from 'react';

interface SupplementItem {
  id: string;
  name: string;
  category: string;
  asin: string;
  tag: string;
  description: string;
  benefits: string[];
  dosage?: string;
  cautions?: string;
  usage?: string;
  evidence: 'strong' | 'moderate' | 'emerging' | 'traditional' | 'applied' | 'foundational' | 'limited';
  related_article?: string;
  author?: string;
  year?: number;
}

interface SupplementCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface SupplementsData {
  categories: SupplementCategory[];
  items: SupplementItem[];
}

const EVIDENCE_LABELS: Record<string, { label: string; color: string }> = {
  strong: { label: 'Strong Evidence', color: '#2d7a4f' },
  moderate: { label: 'Moderate Evidence', color: '#5a7a2d' },
  emerging: { label: 'Emerging Evidence', color: '#7a6a2d' },
  traditional: { label: 'Traditional Use', color: '#6a5a90' },
  applied: { label: 'Applied Practice', color: '#2d5a7a' },
  foundational: { label: 'Foundational Text', color: '#7a2d5a' },
  limited: { label: 'Limited Evidence', color: '#7a4a2d' },
};

const CATEGORY_ICONS: Record<string, string> = {
  adaptogens: '🍄',
  tcm: '☯️',
  ayurvedic: '🌿',
  nervines: '🌸',
  supplements: '💊',
  books: '📚',
  tools: '🔧',
};

export default function SupplementsPage() {
  const [data, setData] = useState<SupplementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [evidenceFilter, setEvidenceFilter] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/supplements')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = data?.items.filter(item => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.benefits.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchEvidence = evidenceFilter === 'all' || item.evidence === evidenceFilter;
    return matchCat && matchSearch && matchEvidence;
  }) ?? [];

  const amazonUrl = (asin: string, tag: string) =>
    `https://www.amazon.com/dp/${asin}?tag=${tag}`;

  if (loading) {
    return (
      <div className="supplements-loading">
        <div className="loading-spinner" />
        <p>Loading resources...</p>
      </div>
    );
  }

  return (
    <div className="supplements-page">
      <div className="supplements-hero">
        <div className="supplements-hero-content">
          <span className="supplements-hero-eyebrow">Curated Resources</span>
          <h1 className="supplements-hero-title">Herbs, Supplements & Tools</h1>
          <p className="supplements-hero-subtitle">
            A comprehensive guide to evidence-informed herbs, adaptogens, TCM formulas, Ayurvedic medicines,
            supplements, books, and somatic tools for nervous system healing and trauma recovery.
          </p>
          <div className="supplements-disclaimer">
            <strong>Important:</strong> This information is educational only. Always consult a qualified healthcare
            provider before starting any supplement, especially if you take medications or have health conditions.
            Evidence ratings reflect the current state of research and traditional use — not medical endorsement.
          </div>
        </div>
      </div>

      <div className="supplements-controls">
        <div className="supplements-search-wrap">
          <input
            type="search"
            className="supplements-search"
            placeholder="Search herbs, supplements, books, tools..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="supplements-filters">
          <select
            className="supplements-filter-select"
            value={evidenceFilter}
            onChange={e => setEvidenceFilter(e.target.value)}
          >
            <option value="all">All Evidence Levels</option>
            <option value="strong">Strong Evidence</option>
            <option value="moderate">Moderate Evidence</option>
            <option value="emerging">Emerging Evidence</option>
            <option value="traditional">Traditional Use</option>
            <option value="applied">Applied Practice</option>
            <option value="foundational">Foundational Text</option>
          </select>
        </div>
      </div>

      <div className="supplements-layout">
        <aside className="supplements-sidebar">
          <div className="supplements-category-list">
            <button
              className={`supplements-cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <span className="cat-icon">🌱</span>
              <span className="cat-name">All Resources</span>
              <span className="cat-count">{data?.items.length ?? 0}</span>
            </button>
            {data?.categories.map(cat => {
              const count = data.items.filter(i => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  className={`supplements-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className="cat-icon">{CATEGORY_ICONS[cat.id] ?? '🌿'}</span>
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="supplements-sidebar-note">
            <h4>About Evidence Ratings</h4>
            <div className="evidence-legend">
              {Object.entries(EVIDENCE_LABELS).map(([key, val]) => (
                <div key={key} className="evidence-legend-item">
                  <span className="evidence-dot" style={{ background: val.color }} />
                  <span>{val.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="supplements-main">
          {activeCategory !== 'all' && data?.categories.find(c => c.id === activeCategory) && (
            <div className="supplements-category-header">
              <span className="cat-header-icon">{CATEGORY_ICONS[activeCategory] ?? '🌿'}</span>
              <div>
                <h2>{data.categories.find(c => c.id === activeCategory)?.name}</h2>
                <p>{data.categories.find(c => c.id === activeCategory)?.description}</p>
              </div>
            </div>
          )}

          <div className="supplements-results-count">
            Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'resource' : 'resources'}
            {searchQuery && <> matching "<em>{searchQuery}</em>"</>}
          </div>

          {filtered.length === 0 ? (
            <div className="supplements-empty">
              <p>No resources found matching your criteria. Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="supplements-grid">
              {filtered.map(item => {
                const ev = EVIDENCE_LABELS[item.evidence] ?? EVIDENCE_LABELS.traditional;
                const isExpanded = expandedItem === item.id;
                const isBook = item.category === 'books';
                const isTool = item.category === 'tools';

                return (
                  <div key={item.id} className={`supplement-card ${isExpanded ? 'expanded' : ''}`}>
                    <div className="supplement-card-header">
                      <div className="supplement-card-meta">
                        <span
                          className="evidence-badge"
                          style={{ background: ev.color + '20', color: ev.color, borderColor: ev.color + '40' }}
                        >
                          {ev.label}
                        </span>
                        <span className="supplement-category-tag">
                          {CATEGORY_ICONS[item.category]} {data?.categories.find(c => c.id === item.category)?.name}
                        </span>
                      </div>
                      <h3 className="supplement-name">{item.name}</h3>
                      {isBook && item.author && (
                        <p className="supplement-author">by {item.author}{item.year ? ` (${item.year})` : ''}</p>
                      )}
                    </div>

                    <p className="supplement-description">{item.description}</p>

                    <div className="supplement-benefits">
                      {item.benefits.map((b, i) => (
                        <span key={i} className="benefit-tag">{b}</span>
                      ))}
                    </div>

                    {isExpanded && (
                      <div className="supplement-details">
                        {item.dosage && (
                          <div className="supplement-detail-row">
                            <span className="detail-label">💊 Dosage</span>
                            <span className="detail-value">{item.dosage}</span>
                          </div>
                        )}
                        {item.usage && (
                          <div className="supplement-detail-row">
                            <span className="detail-label">📋 How to Use</span>
                            <span className="detail-value">{item.usage}</span>
                          </div>
                        )}
                        {item.cautions && (
                          <div className="supplement-detail-row caution">
                            <span className="detail-label">⚠️ Cautions</span>
                            <span className="detail-value">{item.cautions}</span>
                          </div>
                        )}
                        {item.related_article && (
                          <div className="supplement-detail-row">
                            <span className="detail-label">📖 Related Article</span>
                            <a
                              href={`/articles/${item.related_article}`}
                              className="detail-link"
                            >
                              Read the full article →
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="supplement-card-actions">
                      <button
                        className="supplement-expand-btn"
                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                      >
                        {isExpanded ? 'Show Less ↑' : 'Show Details ↓'}
                      </button>
                      <a
                        href={amazonUrl(item.asin, item.tag)}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="supplement-amazon-btn"
                      >
                        {isBook ? '📚 View on Amazon' : isTool ? '🛒 View on Amazon' : '🛒 View on Amazon'}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
