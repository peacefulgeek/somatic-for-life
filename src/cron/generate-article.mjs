/**
 * Cron #1 — Article publisher (queue-first, phase-aware).
 * Phase 1 (published < 60): runs 5x/day
 * Phase 2 (published >= 60): runs 1x/weekday
 */
import { query } from '../lib/db.mjs';
import { generateArticle } from '../lib/deepseek-generate.mjs';
import { runQualityGate } from '../lib/article-quality-gate.mjs';
import { assignHeroImage } from '../lib/bunny.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.resolve(__dirname, '../data/product-catalog.json');
const TOPICS_PATH = path.resolve(__dirname, '../data/seed-topics.json');

const MAX_ATTEMPTS = 4;

function slugify(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function generateOrReleaseArticle({ allowedPhase }) {
  // Phase guard
  const { rows: [{ count }] } = await query(
    `SELECT count(*)::int as count FROM articles WHERE status = 'published'`
  );
  const currentPhase = count < 60 ? 1 : 2;
  if (currentPhase !== allowedPhase) {
    console.log(`[generate-article] Phase mismatch: current=${currentPhase}, allowed=${allowedPhase} — skipping`);
    return { skipped: true, currentPhase, allowedPhase };
  }

  // Try queue first
  const { rows: queued } = await query(
    `SELECT id, slug, title, body, category, tags, asins_used, queued_at
     FROM articles WHERE status = 'queued'
     ORDER BY queued_at ASC LIMIT 1`
  );

  if (queued.length > 0) {
    const a = queued[0];
    const gate = runQualityGate(a.body);
    if (gate.passed) {
      const heroUrl = await assignHeroImage(a.slug);
      await query(
        `UPDATE articles SET status='published', published_at=NOW(), hero_url=$2 WHERE id=$1`,
        [a.id, heroUrl]
      );
      console.log(`[generate-article] Released queued article: ${a.slug}`);
      return { released: true, slug: a.slug };
    } else {
      console.warn(`[generate-article] Queued article ${a.slug} failed gate: ${gate.failures.join(', ')}`);
      // Fall through to fresh generation
    }
  }

  // Generate fresh article
  let catalog = [];
  try {
    const raw = await fs.readFile(CATALOG_PATH, 'utf8');
    const catalogData = JSON.parse(raw);
    catalog = Array.isArray(catalogData) ? catalogData : catalogData.products || [];
  } catch { /* no catalog yet */ }

  let topics = [];
  try {
    const raw = await fs.readFile(TOPICS_PATH, 'utf8');
    topics = JSON.parse(raw);
  } catch { /* no topics file */ }

  // Pick a topic not yet in DB
  const { rows: existing } = await query(`SELECT slug FROM articles`);
  const existingSlugs = new Set(existing.map(r => r.slug));

  const available = topics.filter(t => !existingSlugs.has(slugify(t.title)));
  if (available.length === 0) {
    console.log('[generate-article] No available topics — all generated');
    return { skipped: true, reason: 'no-topics' };
  }

  const topic = available[Math.floor(Math.random() * available.length)];

  // Get internal link pool
  const { rows: pool } = await query(
    `SELECT slug, title, category, tags FROM articles ORDER BY queued_at DESC NULLS LAST LIMIT 200`
  );

  let ok = false;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !ok; attempt++) {
    try {
      const article = await generateArticle({
        topic: topic.title,
        category: topic.category,
        tags: topic.tags || [],
        catalog,
        relatedArticles: pool,
        authorName: 'The Oracle Lover',
        niche: 'somatic trauma healing',
      });

      const gate = runQualityGate(article.body);
      if (gate.passed) {
        const slug = slugify(topic.title);
        const heroUrl = await assignHeroImage(slug);
        await query(
          `INSERT INTO articles (slug, title, meta_description, og_title, og_description, category, tags, body, status, published_at, last_modified_at, hero_url, asins_used, word_count, reading_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', NOW(), NOW(), $9, $10, $11, $12)
           ON CONFLICT (slug) DO NOTHING`,
          [
            slug, topic.title, article.metaDescription, article.ogTitle, article.ogDescription,
            topic.category, topic.tags || [], article.body, heroUrl,
            article.productsUsed || [], gate.wordCount,
            Math.ceil(gate.wordCount / 200),
          ]
        );
        console.log(`[generate-article] Generated and published: ${slug} (${gate.wordCount} words)`);
        ok = true;
      } else {
        console.warn(`[generate-article] Attempt ${attempt} failed gate: ${gate.failures.join(', ')}`);
      }
    } catch (err) {
      console.error(`[generate-article] Attempt ${attempt} error:`, err.message);
    }
  }

  if (!ok) {
    console.error(`[generate-article] Failed all ${MAX_ATTEMPTS} attempts for "${topic.title}"`);
    return { failed: true, topic: topic.title };
  }

  return { generated: true };
}
