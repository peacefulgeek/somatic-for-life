import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';

export const sitemapRouter = express.Router();

const SITE_URL = `https://${process.env.SITE_DOMAIN || 'somaticforlife.com'}`;
const CDN_URL = process.env.BUNNY_CDN_URL || 'https://somatic-forlife.b-cdn.net';

function getArticles() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'articles.json');
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch { return []; }
}

function getAssessments() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'assessments.json');
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    return data.assessments || data || [];
  } catch { return []; }
}

sitemapRouter.get('/', (req, res) => {
  try {
    const articles = getArticles().filter((a: any) => {
      const pub = new Date(a.published_at);
      return pub <= new Date();
    });
    const assessments = getAssessments();
    const now = new Date().toISOString().split('T')[0];

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/articles', priority: '0.9', changefreq: 'daily' },
      { url: '/assessments', priority: '0.8', changefreq: 'monthly' },
      { url: '/supplements', priority: '0.8', changefreq: 'weekly' },
      { url: '/recommended', priority: '0.7', changefreq: 'weekly' },
      { url: '/about', priority: '0.6', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">

${staticPages.map(p => `  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}

${articles.map((a: any) => {
  const lastmod = (a.last_modified_at || a.published_at || now).split('T')[0];
  const heroUrl = a.hero_url || `${CDN_URL}/images/hero-somatic-healing.webp`;
  const imageBlock = heroUrl ? `
    <image:image>
      <image:loc>${heroUrl}</image:loc>
      <image:title>${(a.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>
    </image:image>` : '';
  return `  <url>
    <loc>${SITE_URL}/articles/${a.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>${imageBlock}
  </url>`;
}).join('\n')}

${assessments.map((a: any) => `  <url>
    <loc>${SITE_URL}/assessments/${a.slug || a.id}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}

</urlset>`;

    res.type('application/xml').send(xml);
  } catch (err) {
    res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});
