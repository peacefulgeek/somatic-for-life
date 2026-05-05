import React from 'react';

interface Product {
  asin: string;
  name: string;
  category: string;
  tags: string[];
  type?: string;
}

interface AutoAffiliatesProps {
  products: Product[];
  bottomSectionName?: string;
}

const AMAZON_TAG = 'spankyspinola-20';

function buildAmazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;
}

const SOFT_INTROS = [
  'One option that many people like is',
  'A tool that often helps with this is',
  'Something worth considering might be',
  'For those looking for a simple solution, this works well:',
  'You could also try',
  'A popular choice for situations like this is',
];

export function AutoAffiliates({ products, bottomSectionName = 'Body-Based Healing Library' }: AutoAffiliatesProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="auto-affiliates" aria-label={bottomSectionName}>
      <h3>{bottomSectionName}</h3>
      <ul>
        {products.map((p, i) => (
          <li key={p.asin}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              {SOFT_INTROS[i % SOFT_INTROS.length]}{' '}
            </span>
            <a
              href={buildAmazonUrl(p.asin)}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
            >
              {p.name}
            </a>
            <span className="disclosure"> (paid link)</span>
          </li>
        ))}
      </ul>
      <p className="affiliate-disclosure">
        As an Amazon Associate, I earn from qualifying purchases.
      </p>
    </section>
  );
}
