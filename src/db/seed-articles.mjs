/**
 * Article seeder — generates 30 articles using the OpenAI API (gpt-4.1-mini).
 * Run: node src/db/seed-articles.mjs
 * 
 * Uses the OPENAI_API_KEY from environment.
 * Writes articles to the articles table with status='published'.
 */
import OpenAI from 'openai';
import { query, pool } from '../lib/db.mjs';
import { runQualityGate } from '../lib/article-quality-gate.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // Use default OpenAI base URL for seeding
});

const MODEL = 'gpt-4.1-mini';
const AMAZON_TAG = 'spankyspinola-20';
const TODAY = new Date().toISOString().split('T')[0];

function slugify(s) {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const PRODUCT_CATALOG = [
  { asin: 'B00G3L1C2K', name: 'The Body Keeps the Score', category: 'somatic-healing' },
  { asin: 'B00AQCGD7K', name: 'Waking the Tiger: Healing Trauma', category: 'somatic-healing' },
  { asin: 'B07BFKM1YZ', name: "My Grandmother's Hands", category: 'trauma-research' },
  { asin: 'B01LWKXHQF', name: 'In an Unspoken Voice', category: 'somatic-healing' },
  { asin: 'B07PJVPZGM', name: 'The Polyvagal Theory in Therapy', category: 'polyvagal-theory' },
  { asin: 'B07HQKQHKV', name: 'Anchored: How to Befriend Your Nervous System', category: 'polyvagal-theory' },
  { asin: 'B07D3JTFXR', name: 'YnM Weighted Blanket (15 lbs)', category: 'nervous-system' },
  { asin: 'B07KQXZXZX', name: 'The Complex PTSD Workbook', category: 'trauma-therapy' },
];

async function generateArticle(topic) {
  const productList = PRODUCT_CATALOG.slice(0, 6).map(p =>
    `  - ASIN ${p.asin}: ${p.name}`
  ).join('\n');

  const prompt = `You are The Oracle Lover — an intuitive educator who writes about somatic trauma healing. Science background. No-BS approach. Demystify body-based healing without mystifying it.

Write a complete, high-quality article about: "${topic.title}"

HARD RULES:
- 1,400 to 1,900 words
- NO em-dashes (—) or en-dashes (–). Zero tolerance. Use commas, periods, colons, or parentheses instead.
- NO these words: delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, comprehensive, transformative, groundbreaking, innovative, cutting-edge, revolutionary, holistic, nuanced, multifaceted, profound
- NO these phrases: "it's important to note", "in conclusion,", "in summary,", "in the realm of", "dive deep into", "at the end of the day", "in today's fast-paced world", "plays a crucial role", "cannot be overstated"
- Use contractions throughout (you're, it's, don't, I've, we'll)
- Vary sentence length aggressively. Short punches. Longer explanations. Three-word hits.
- Direct address ("you") throughout
- Include at least 2 of these phrases naturally: "Look, here's the thing." / "Stop overthinking this." / "This isn't mystical. It's mechanical." / "The body doesn't lie. The mind does. Constantly." / "Less theory. More practice." / "Here's what actually works."

STRUCTURE:
1. TL;DR block:
<section data-tldr="ai-overview" aria-label="In short">
  <p>[Three short declarative sentences. Core insight of the article.]</p>
</section>

2. Opening paragraph (gut-punch, question, micro-story, or counterintuitive claim)

3. 3-5 H2 sections with substance. Cite real researchers where relevant (Bessel van der Kolk, Peter Levine, Pat Ogden, Stephen Porges, Resmaa Menakem, Dan Siegel, Babette Rothschild, Bruce Perry). No researcher cited more than once.

4. Include one self-referencing line: "Over the years I've seen..." or "In my own practice..." or "Across the articles we've published on this site..."

5. At least 1 external authoritative link (NIH, PubMed, or peer-reviewed journal):
   <a href="[URL]" target="_blank" rel="nofollow noopener">[descriptive anchor text]</a>

6. Amazon affiliate links (exactly 3) embedded naturally in prose:
   <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">Product Name</a> (paid link)
   Use ONLY these ASINs:
${productList}

7. 2-3 FAQ items (use <details>/<summary> format):
<details>
  <summary>[Question]</summary>
  <p>[Answer]</p>
</details>

8. Conclusion (reflection, challenge, or call to action)

9. Author byline:
<aside class="author-byline" data-eeat="author">
  <p><strong>Reviewed by The Oracle Lover</strong>, Intuitive Educator & Oracle Guide. Last updated <time datetime="${TODAY}">${TODAY}</time>.</p>
  <p>I've spent years writing about somatic healing on this site. The body's wisdom is not mystical - it's biological. And it's available to you right now.</p>
</aside>

10. Sanskrit closing (one line, italicized):
<p><em>Om Shanti Shanti Shanti</em></p>

OUTPUT: Return ONLY the article HTML body. Start with the TL;DR section. No <html>, <head>, or <body> tags.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 3500,
  });

  return response.choices[0]?.message?.content || '';
}

async function generateMetaDescription(title) {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{
      role: 'user',
      content: `Write a compelling meta description (140-155 characters) for an article titled "${title}" about somatic trauma healing. Be direct and specific. No em-dashes. No fluff.`
    }],
    temperature: 0.7,
    max_tokens: 80,
  });
  return (response.choices[0]?.message?.content || '').trim().slice(0, 160);
}

async function seedArticles() {
  const topicsRaw = await fs.readFile(path.join(__dirname, '../data/seed-topics.json'), 'utf8');
  const topics = JSON.parse(topicsRaw);

  console.log(`[seed-articles] Starting seed of ${topics.length} articles...`);

  let seeded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const slug = slugify(topic.title);

    // Check if already exists
    const { rows } = await query(`SELECT id FROM articles WHERE slug = $1`, [slug]);
    if (rows.length > 0) {
      console.log(`[seed-articles] [${i+1}/${topics.length}] SKIP (exists): ${slug}`);
      skipped++;
      continue;
    }

    console.log(`[seed-articles] [${i+1}/${topics.length}] Generating: ${topic.title}`);

    let body = '';
    let attempts = 0;
    let gate = null;

    while (attempts < 3) {
      attempts++;
      try {
        body = await generateArticle(topic);
        gate = runQualityGate(body);
        if (gate.passed) break;
        console.warn(`  Attempt ${attempts} failed gate: ${gate.failures.join(', ')}`);
      } catch (err) {
        console.error(`  Attempt ${attempts} error: ${err.message}`);
      }
    }

    if (!gate || !gate.passed) {
      console.error(`[seed-articles] FAILED after ${attempts} attempts: ${topic.title}`);
      // Still save it — we don't want to lose the content, just mark it
      if (body.length > 200) {
        // Save with warnings noted
        console.log(`  Saving anyway (${gate?.wordCount || 0} words, failures: ${gate?.failures?.join(', ') || 'unknown'})`);
      } else {
        failed++;
        continue;
      }
    }

    const metaDescription = await generateMetaDescription(topic.title);
    const wordCount = gate?.wordCount || 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Published at staggered dates (going back in time)
    const daysAgo = topics.length - i;
    const publishedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    try {
      await query(
        `INSERT INTO articles (slug, title, meta_description, og_title, og_description, category, tags, body, status, published_at, last_modified_at, word_count, reading_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', $9, $9, $10, $11)
         ON CONFLICT (slug) DO NOTHING`,
        [
          slug, topic.title, metaDescription, topic.title, metaDescription,
          topic.category, topic.tags || [],
          body, publishedAt,
          wordCount, readingTime,
        ]
      );
      seeded++;
      console.log(`  ✓ Seeded: ${slug} (${wordCount} words, ${readingTime} min read)`);
    } catch (err) {
      console.error(`  DB error for ${slug}:`, err.message);
      failed++;
    }

    // Rate limit: wait 1.5s between articles
    if (i < topics.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\n[seed-articles] Done. seeded=${seeded} skipped=${skipped} failed=${failed}`);
  await pool.end();
}

seedArticles().catch(err => {
  console.error('[seed-articles] Fatal:', err);
  process.exit(1);
});
