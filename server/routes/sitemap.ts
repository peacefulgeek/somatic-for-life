import express from 'express';
import { query } from '../../src/lib/db.mjs';

export const sitemapRouter = express.Router();

const SITE_URL = `https://${process.env.SITE_DOMAIN || 'thebodyremembers.com'}`;

sitemapRouter.get('/', async (req, res) => {
  try {
    const { rows: articles } = await query(
      `SELECT slug, last_modified_at, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC`
    );

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/articles', priority: '0.9', changefreq: 'daily' },
      { url: '/about', priority: '0.7', changefreq: 'monthly' },
      { url: '/recommended', priority: '0.8', changefreq: 'weekly' },
      { url: '/assessments', priority: '0.8', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    ];

    const now = new Date().toISOString().split('T')[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${articles.map(a => `  <url>
    <loc>${SITE_URL}/articles/${a.slug}</loc>
    <lastmod>${(a.last_modified_at || a.published_at || now).split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

    res.type('application/xml').send(xml);
  } catch (err) {
    res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});
