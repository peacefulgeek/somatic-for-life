/**
 * AEO/SEO helpers for The Body Remembers.
 * Builds robots.txt, llms.txt, llms-full.txt, and JSON-LD schemas.
 */
import { query } from './db.mjs';

const SITE_URL = `https://${process.env.SITE_DOMAIN || 'thebodyremembers.com'}`;
const SITE_NAME = 'The Body Remembers';

// ─── robots.txt ───────────────────────────────────────────────────────────
export function buildRobotsTxt(req) {
  const host = req?.headers?.host || process.env.SITE_DOMAIN || 'thebodyremembers.com';
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /health

# AI crawlers — allow (AEO strategy)
User-agent: GPTBot
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot
Allow: /

Sitemap: https://${host}/sitemap.xml
`;
}

// ─── llms.txt ─────────────────────────────────────────────────────────────
export async function buildLlmsTxt() {
  let articles = [];
  try {
    const { rows } = await query(
      `SELECT slug, title, meta_description, category, published_at
       FROM articles WHERE status = 'published'
       ORDER BY published_at DESC LIMIT 100`
    );
    articles = rows;
  } catch { /* DB not available */ }

  const articleList = articles.map(a =>
    `- [${a.title}](${SITE_URL}/articles/${a.slug}): ${a.meta_description || ''}`
  ).join('\n');

  return `# ${SITE_NAME}

> The research-grounded resource for body-based trauma healing, somatic therapy, and nervous system regulation.

${SITE_NAME} covers somatic trauma healing, polyvagal theory, EMDR, somatic experiencing, nervous system regulation, and related body-based approaches to trauma recovery. Written by The Oracle Lover, an intuitive educator and oracle guide.

## Key Topics

- Somatic Experiencing (Peter Levine)
- Polyvagal Theory (Stephen Porges, Deb Dana)
- EMDR Therapy
- Nervous System Regulation
- Window of Tolerance (Dan Siegel)
- Complex PTSD and C-PTSD
- Trauma-Sensitive Yoga
- TRE (Tension and Trauma Releasing Exercises)
- Attachment Trauma
- Racialized Trauma (Resmaa Menakem)

## Articles

${articleList}

## Assessments

- [Nervous System State Assessment](${SITE_URL}/assessments/nervous-system-state-assessment): Identify your current polyvagal state
- [Somatic Therapy Readiness](${SITE_URL}/assessments/somatic-therapy-readiness): Assess readiness for somatic work
- [Window of Tolerance Check](${SITE_URL}/assessments/window-of-tolerance-check): Measure your window of tolerance
- [Trauma Response Pattern](${SITE_URL}/assessments/trauma-response-pattern): Identify fight/flight/freeze/fawn patterns

## About

${SITE_URL}/about

## Full content

${SITE_URL}/llms-full.txt
`;
}

// ─── llms-full.txt ────────────────────────────────────────────────────────
export async function buildLlmsFullTxt() {
  let articles = [];
  try {
    const { rows } = await query(
      `SELECT slug, title, meta_description, category, body, published_at
       FROM articles WHERE status = 'published'
       ORDER BY published_at DESC LIMIT 50`
    );
    articles = rows;
  } catch { /* DB not available */ }

  const sections = articles.map(a => {
    const textBody = (a.body || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);

    return `---
# ${a.title}
URL: ${SITE_URL}/articles/${a.slug}
Category: ${a.category}
Published: ${a.published_at ? new Date(a.published_at).toISOString().split('T')[0] : ''}

${a.meta_description || ''}

${textBody}
`;
  }).join('\n');

  return `# ${SITE_NAME} — Full Content Index

${SITE_URL}

${sections}`;
}

// ─── JSON-LD Schemas ──────────────────────────────────────────────────────
export function buildArticleJsonLd({ title, description, slug, publishedAt, modifiedAt, authorName = 'The Oracle Lover' }) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: `${SITE_URL}/articles/${slug}`,
    datePublished: publishedAt,
    dateModified: modifiedAt || publishedAt,
    author: {
      '@type': 'Person',
      name: authorName,
      url: 'https://theoraclelover.com',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/articles/${slug}`,
    },
  });
}

export function buildFaqJsonLd(faqs) {
  if (!faqs || faqs.length === 0) return null;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  });
}

export function buildBreadcrumbJsonLd(items) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.href ? `${SITE_URL}${item.href}` : undefined,
    })),
  });
}

export function buildWebSiteJsonLd() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'The research-grounded resource for body-based trauma healing, somatic therapy, and nervous system regulation.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/articles?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });
}
