import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const isProd = process.env.NODE_ENV === 'production';

const SITE_NAME = 'Somatic For Life';
const SITE_URL = `https://${process.env.SITE_DOMAIN || 'somaticforlife.com'}`;
const SITE_DESCRIPTION = 'Somatic For Life — the research-grounded guide to somatic healing, nervous system regulation, and body-based trauma recovery. Science, practice, and zero fluff.';
const CDN_URL = process.env.BUNNY_CDN_URL || 'https://somatic-forlife.b-cdn.net';
const DEFAULT_OG_IMAGE = `${CDN_URL}/images/hero-somatic-healing.webp`;
const TWITTER_HANDLE = '@theoraclelover';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getArticles(): any[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'articles.json'), 'utf8'));
  } catch { return []; }
}

function getAssessments(): any[] {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'assessments.json'), 'utf8'));
    return data.assessments || data || [];
  } catch { return []; }
}

// ─── JSON-LD builders ─────────────────────────────────────────────────────────

function websiteSchema() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: {
      '@type': 'Person',
      name: 'The Oracle Lover',
      url: 'https://theoraclelover.com',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/articles?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
}

function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

function articleSchema(article: any) {
  const pub = article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString();
  const mod = article.last_modified_at ? new Date(article.last_modified_at).toISOString() : pub;
  const faqs = (article.faqs || []).map((f: any) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  }));

  const schemas: any[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.excerpt || '',
      url: `${SITE_URL}/articles/${article.slug}`,
      datePublished: pub,
      dateModified: mod,
      image: article.hero_url || DEFAULT_OG_IMAGE,
      author: {
        '@type': 'Person',
        name: article.author || 'The Oracle Lover',
        url: 'https://theoraclelover.com',
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/articles/${article.slug}` },
    },
    breadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Articles', url: `${SITE_URL}/articles` },
      { name: article.title, url: `${SITE_URL}/articles/${article.slug}` },
    ]),
  ];

  if (faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs,
    });
  }

  return schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n  ');
}

function assessmentSchema(assessment: any) {
  return [
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      name: assessment.title,
      description: assessment.description || '',
      url: `${SITE_URL}/assessments/${assessment.slug || assessment.id}`,
      author: { '@type': 'Person', name: 'The Oracle Lover', url: 'https://theoraclelover.com' },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    }),
    breadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Assessments', url: `${SITE_URL}/assessments` },
      { name: assessment.title, url: `${SITE_URL}/assessments/${assessment.slug || assessment.id}` },
    ]),
  ].map(s => `<script type="application/ld+json">${s}</script>`).join('\n  ');
}

// ─── Head builder ─────────────────────────────────────────────────────────────

function buildHead({
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  canonical = '',
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  jsonLdBlocks = '',
  datePublished = '',
  dateModified = '',
}: {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  jsonLdBlocks?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical || SITE_URL;
  const imageUrl = ogImage || DEFAULT_OG_IMAGE;

  return `
    <title>${esc(fullTitle)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph -->
    <meta property="og:site_name" content="${esc(SITE_NAME)}" />
    <meta property="og:title" content="${esc(fullTitle)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter / X Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="${TWITTER_HANDLE}" />
    <meta name="twitter:creator" content="${TWITTER_HANDLE}" />
    <meta name="twitter:title" content="${esc(fullTitle)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <!-- Article dates -->
    ${datePublished ? `<meta property="article:published_time" content="${datePublished}" />` : ''}
    ${dateModified ? `<meta property="article:modified_time" content="${dateModified}" />` : ''}

    <!-- AI crawler hints -->
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

    <!-- JSON-LD -->
    <script type="application/ld+json">${websiteSchema()}</script>
    ${jsonLdBlocks}
  `.trim();
}

// ─── Manifest / asset injection ───────────────────────────────────────────────

let _manifestCache: Record<string, any> | null = null;

function getManifest(): Record<string, any> | null {
  if (_manifestCache) return _manifestCache;
  const candidates = [
    path.resolve(process.cwd(), 'dist/client/.vite/manifest.json'),
    path.resolve(process.cwd(), 'dist/client/manifest.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        _manifestCache = JSON.parse(fs.readFileSync(p, 'utf8'));
        return _manifestCache;
      } catch { /* continue */ }
    }
  }
  return null;
}

function getViteAssets(): { scripts: string; styles: string } {
  if (!isProd) {
    return {
      scripts: `<script type="module" src="http://localhost:5173/@vite/client"></script>
                <script type="module" src="http://localhost:5173/src/client/entry-client.tsx"></script>`,
      styles: '',
    };
  }

  const manifest = getManifest();
  if (!manifest) {
    const assetsDir = path.resolve(process.cwd(), 'dist/client/assets');
    try {
      const files = fs.readdirSync(assetsDir);
      const jsFile = files.find(f => f.startsWith('entry-client') && f.endsWith('.js'));
      const cssFile = files.find(f => f.startsWith('entry-client') && f.endsWith('.css'));
      const vendorFile = files.find(f => f.startsWith('vendor') && f.endsWith('.js'));
      const runtimeFile = files.find(f => f.startsWith('rolldown-runtime') && f.endsWith('.js'));
      const scripts = [
        runtimeFile ? `<script type="module" src="/assets/${runtimeFile}"></script>` : '',
        vendorFile ? `<script type="module" src="/assets/${vendorFile}"></script>` : '',
        jsFile ? `<script type="module" src="/assets/${jsFile}"></script>` : '',
      ].filter(Boolean).join('\n  ');
      const styles = cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : '';
      return { scripts, styles };
    } catch {
      return { scripts: '', styles: '' };
    }
  }

  const entry = manifest['src/client/entry-client.tsx'];
  if (!entry) return { scripts: '', styles: '' };

  const allImports: string[] = [];
  function collectImports(key: string) {
    const m = manifest[key];
    if (!m) return;
    if (m.imports) {
      for (const imp of m.imports) {
        if (!allImports.includes(imp)) {
          allImports.push(imp);
          collectImports(imp);
        }
      }
    }
  }
  collectImports('src/client/entry-client.tsx');

  const scripts = [
    ...allImports.map(k => manifest[k]?.file ? `<script type="module" src="/${manifest[k].file}"></script>` : ''),
    `<script type="module" src="/${entry.file}"></script>`,
  ].filter(Boolean).join('\n  ');

  const styles = (entry.css || []).map((c: string) => `<link rel="stylesheet" href="/${c}" />`).join('\n  ');

  return { scripts, styles };
}

// ─── Route-aware SSR handler ──────────────────────────────────────────────────

export function ssrHandler(req: Request, res: Response) {
  const { scripts, styles } = getViteAssets();
  const urlPath = req.path;
  const canonical = `${SITE_URL}${urlPath}`;

  let headProps: Parameters<typeof buildHead>[0] = { canonical };

  // Article page — inject article-specific meta
  if (urlPath.startsWith('/articles/') && urlPath.length > 10) {
    const slug = urlPath.replace('/articles/', '').split('/')[0];
    const articles = getArticles();
    const article = articles.find((a: any) => a.slug === slug);
    if (article) {
      headProps = {
        title: article.title,
        description: article.excerpt || SITE_DESCRIPTION,
        canonical,
        ogImage: article.hero_url || DEFAULT_OG_IMAGE,
        ogType: 'article',
        jsonLdBlocks: articleSchema(article),
        datePublished: article.published_at,
        dateModified: article.last_modified_at || article.published_at,
      };
    }
  }

  // Assessments listing
  else if (urlPath === '/assessments') {
    headProps = {
      title: 'Somatic Healing Assessments',
      description: 'Take a free somatic healing assessment. Understand your nervous system state, trauma patterns, window of tolerance, and readiness for somatic work.',
      canonical,
      jsonLdBlocks: `<script type="application/ld+json">${breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Assessments', url: `${SITE_URL}/assessments` },
      ])}</script>`,
    };
  }

  // Individual assessment
  else if (urlPath.startsWith('/assessments/') && urlPath.length > 14) {
    const slug = urlPath.replace('/assessments/', '').split('/')[0];
    const assessments = getAssessments();
    const assessment = assessments.find((a: any) => (a.slug || a.id) === slug);
    if (assessment) {
      headProps = {
        title: assessment.title,
        description: assessment.description || `Take the ${assessment.title} assessment to understand your somatic healing journey.`,
        canonical,
        jsonLdBlocks: assessmentSchema(assessment),
      };
    }
  }

  // Supplements page
  else if (urlPath === '/supplements') {
    headProps = {
      title: 'Herbs, Supplements & Tools for Somatic Healing',
      description: 'A comprehensive guide to 200+ evidence-informed herbs, adaptogens, TCM formulas, Ayurvedic medicines, supplements, books, and somatic tools for nervous system healing.',
      canonical,
      jsonLdBlocks: `<script type="application/ld+json">${breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Herbs & Supplements', url: `${SITE_URL}/supplements` },
      ])}</script>`,
    };
  }

  // Articles listing
  else if (urlPath === '/articles') {
    headProps = {
      title: 'Somatic Healing Articles',
      description: 'In-depth articles on somatic therapy, nervous system regulation, trauma recovery, polyvagal theory, EMDR, and body-based healing practices.',
      canonical,
      jsonLdBlocks: `<script type="application/ld+json">${breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Articles', url: `${SITE_URL}/articles` },
      ])}</script>`,
    };
  }

  // About page
  else if (urlPath === '/about') {
    headProps = {
      title: 'About The Oracle Lover',
      description: 'About The Oracle Lover — the intuitive educator behind Somatic For Life. Science-grounded, direct, and zero fluff.',
      canonical,
    };
  }

  const headMeta = buildHead(headProps);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${headMeta}
  ${styles}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="preconnect" href="${CDN_URL}" />
</head>
<body>
  <div id="root"></div>
  ${scripts}
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
