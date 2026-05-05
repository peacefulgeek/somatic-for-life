import React from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';

const AMAZON_TAG = 'spankyspinola-20';

const BOOKS = [
  {
    asin: 'B00G3L1C2K',
    title: 'The Body Keeps the Score',
    author: 'Bessel van der Kolk',
    description: 'The landmark book on trauma and the body. Van der Kolk explains how trauma reshapes the brain and body — and what actually helps. Essential reading.',
    category: 'Foundation',
    icon: '📚',
  },
  {
    asin: 'B00AQCGD7K',
    title: 'Waking the Tiger: Healing Trauma',
    author: 'Peter Levine',
    description: 'The foundational text for Somatic Experiencing. Levine explains how animals discharge trauma and how humans can do the same. Practical and accessible.',
    category: 'Somatic Experiencing',
    icon: '🐯',
  },
  {
    asin: 'B07BFKM1YZ',
    title: 'My Grandmother\'s Hands',
    author: 'Resmaa Menakem',
    description: 'A powerful exploration of racialized trauma stored in the body across generations. Menakem offers somatic practices for healing what\'s been inherited.',
    category: 'Racialized Trauma',
    icon: '✋',
  },
  {
    asin: 'B01LWKXHQF',
    title: 'In an Unspoken Voice',
    author: 'Peter Levine',
    description: 'Levine\'s more technical follow-up to Waking the Tiger. Goes deeper into the neuroscience and practice of Somatic Experiencing.',
    category: 'Somatic Experiencing',
    icon: '🔬',
  },
  {
    asin: 'B07PJVPZGM',
    title: 'The Polyvagal Theory in Therapy',
    author: 'Deb Dana',
    description: 'Dana translates Stephen Porges\' complex Polyvagal Theory into practical clinical tools. Excellent for therapists and for people who want to understand their nervous system.',
    category: 'Polyvagal Theory',
    icon: '🧠',
  },
  {
    asin: 'B07HQKQHKV',
    title: 'Anchored: How to Befriend Your Nervous System',
    author: 'Deb Dana',
    description: 'A more accessible version of Polyvagal Theory for general readers. Practical exercises for understanding and working with your nervous system states.',
    category: 'Polyvagal Theory',
    icon: '⚓',
  },
];

const TOOLS = [
  {
    asin: 'B07D3JTFXR',
    title: 'Weighted Blanket (15 lbs)',
    description: 'Deep pressure stimulation activates the parasympathetic nervous system. Many people with anxiety and trauma find weighted blankets genuinely calming.',
    category: 'Nervous System Regulation',
    icon: '🛏',
  },
  {
    asin: 'B07XQXZXZX',
    title: 'Yoga Mat (Extra Thick)',
    description: 'For trauma-sensitive yoga, somatic practices, and TRE. A good mat makes body-based practices more accessible.',
    category: 'Somatic Practice',
    icon: '🧘',
  },
  {
    asin: 'B07YJQXQXQ',
    title: 'HRV Monitor',
    description: 'Heart rate variability is one of the best indicators of nervous system regulation. Tracking HRV can help you understand your baseline and notice what helps.',
    category: 'Tracking',
    icon: '💓',
  },
];

function buildAmazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
}

export function RecommendedPage() {
  return (
    <div>
      <div className="page-content">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Recommended' }]} />

        <div className="page-header">
          <div className="page-header-eyebrow">Recommended Resources</div>
          <h1 className="page-header-title">Books & Tools</h1>
          <p className="page-header-description">
            The books and tools that actually matter for somatic trauma healing. Not a comprehensive list — a curated one. These are the resources I return to and recommend most often.
          </p>
        </div>

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 'var(--space-8)' }}>
          As an Amazon Associate, I earn from qualifying purchases. This doesn't change what I recommend — I only list things I genuinely believe are useful.
        </p>

        {/* Books */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>Essential Books</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {BOOKS.map(book => (
              <a
                key={book.asin}
                href={buildAmazonUrl(book.asin)}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-card)',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  gap: 'var(--space-5)',
                  alignItems: 'flex-start',
                  transition: 'all var(--transition)',
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
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius)',
                  background: 'var(--accent-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.75rem', flexShrink: 0,
                }}>
                  {book.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{book.title}</h3>
                    <span style={{
                      background: 'var(--accent-light)', color: 'var(--accent)',
                      fontSize: 'var(--text-xs)', fontWeight: 700,
                      padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      whiteSpace: 'nowrap',
                    }}>
                      {book.category}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--accent)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                    by {book.author}
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {book.description}
                  </p>
                  <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 600 }}>
                    View on Amazon → (paid link)
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>Helpful Tools</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-5)' }}>
            {TOOLS.map(tool => (
              <a
                key={tool.asin}
                href={buildAmazonUrl(tool.asin)}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-5)',
                  boxShadow: 'var(--shadow-card)',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  transition: 'all var(--transition)',
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
                <div style={{ fontSize: '2rem' }}>{tool.icon}</div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>{tool.category}</div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>{tool.title}</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{tool.description}</p>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 600, marginTop: 'auto' }}>
                  View on Amazon → (paid link)
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
