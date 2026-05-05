/**
 * Cron #2 — Product spotlight (Saturday 08:00 UTC).
 * Generates a product-focused article highlighting somatic healing tools.
 */
import { generateArticle } from '../lib/deepseek-generate.mjs';
import { runQualityGate } from '../lib/article-quality-gate.mjs';
import { query } from '../lib/db.mjs';
import { assignHeroImage } from '../lib/bunny.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

const SPOTLIGHT_TOPICS = [
  'The Best Books on Somatic Trauma Healing (Reviewed)',
  'Tools That Support Nervous System Regulation at Home',
  'Weighted Blankets and the Nervous System: What the Research Shows',
  'Yoga Mats for Trauma-Sensitive Practice: What to Look For',
  'HRV Tracking for Trauma Recovery: Does It Help?',
];

export async function generateProductSpotlight() {
  const topic = SPOTLIGHT_TOPICS[Math.floor(Math.random() * SPOTLIGHT_TOPICS.length)];
  const slug = slugify(topic);

  // Check if already exists
  const { rows } = await query(`SELECT id FROM articles WHERE slug = $1`, [slug]);
  if (rows.length > 0) {
    console.log(`[product-spotlight] ${slug} already exists — skipping`);
    return;
  }

  let catalog = [];
  try {
    const raw = await fs.readFile(path.resolve(__dirname, '../data/product-catalog.json'), 'utf8');
    catalog = JSON.parse(raw);
  } catch { /* no catalog */ }

  const { rows: pool } = await query(
    `SELECT slug, title, category, tags FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 50`
  );

  for (let attempt = 1; attempt <= 4; attempt++) {
    const article = await generateArticle({
      topic, category: 'recommended-tools', tags: ['products', 'tools', 'healing'],
      catalog, relatedArticles: pool, authorName: 'The Oracle Lover',
      niche: 'somatic trauma healing',
    });

    const gate = runQualityGate(article.body);
    if (gate.passed) {
      const heroUrl = await assignHeroImage(slug);
      await query(
        `INSERT INTO articles (slug, title, meta_description, category, tags, body, status, published_at, last_modified_at, hero_url, asins_used, word_count, reading_time)
         VALUES ($1, $2, $3, $4, $5, $6, 'published', NOW(), NOW(), $7, $8, $9, $10)
         ON CONFLICT (slug) DO NOTHING`,
        [slug, topic, article.metaDescription, 'recommended-tools', ['products', 'tools'],
         article.body, heroUrl, article.productsUsed || [], gate.wordCount, Math.ceil(gate.wordCount / 200)]
      );
      console.log(`[product-spotlight] Published: ${slug}`);
      return;
    }
    console.warn(`[product-spotlight] Attempt ${attempt} failed: ${gate.failures.join(', ')}`);
  }
  console.error(`[product-spotlight] Failed all attempts for "${topic}"`);
}
