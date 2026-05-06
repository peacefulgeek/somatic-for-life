/**
 * generate-500-articles.mjs
 * Generates 500 somatic healing articles at 1800+ words each.
 * Uses OpenAI-compatible API (gpt-4.1-mini for speed/cost).
 * Date-gates articles: 6 per day starting from today.
 * Merges with existing articles.json (skips already-generated slugs).
 * Uploads hero image to Bunny CDN for each article.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Config
// Use DeepSeek API key from .env (OPENAI_API_KEY in .env is the DeepSeek key)
// The system OPENAI_API_KEY env var is the Manus proxy — we want the .env one
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.deepseek.com';
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || '9683bfd5-7ef1-4ea7-aaa3bed5d2a0-9722-43fc';
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'somatic-forlife';
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || 'https://somatic-forlife.b-cdn.net';
const BUNNY_ENDPOINT = 'ny.storage.bunnycdn.com';
const AMAZON_TAG = process.env.AMAZON_TAG || 'spankyspinola-20';
const ARTICLES_PER_DAY = 6;
const BATCH_SIZE = 5; // concurrent requests
const DELAY_MS = 1200; // ms between batches

const TOPICS_FILE = path.join(ROOT, 'src/data/seed-topics-500.json');
const ARTICLES_FILE = path.join(ROOT, 'data/articles.json');
const PRODUCTS_FILE = path.join(ROOT, 'src/data/product-catalog.json');

// Unsplash-style category image mapping (CDN URLs already uploaded)
const CATEGORY_HERO_MAP = {
  'Trauma Therapy': `${BUNNY_CDN_URL}/images/hero-trauma-therapy.webp`,
  'Nervous System': `${BUNNY_CDN_URL}/images/hero-nervous-system.webp`,
  'Somatic Healing': `${BUNNY_CDN_URL}/images/hero-somatic-healing.webp`,
  'Somatic Practices': `${BUNNY_CDN_URL}/images/hero-somatic-practices.webp`,
  'Body-Mind': `${BUNNY_CDN_URL}/images/hero-body-mind.webp`,
  'Self-Directed': `${BUNNY_CDN_URL}/images/hero-self-directed.webp`,
  'Polyvagal Theory': `${BUNNY_CDN_URL}/images/hero-polyvagal.webp`,
  'Research': `${BUNNY_CDN_URL}/images/hero-trauma-research.webp`,
  'EMDR': `${BUNNY_CDN_URL}/images/hero-emdr.webp`,
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function computePublishDate(index) {
  // Start from today, gate 6 per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOffset = Math.floor(index / ARTICLES_PER_DAY);
  const d = new Date(today.getTime() + dayOffset * 86400000);
  return d.toISOString().split('T')[0];
}

function isPublished(publishDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pub = new Date(publishDate);
  return pub <= today;
}

async function callOpenAI(messages, model = process.env.OPENAI_MODEL || 'deepseek-v4-pro') {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 3000,
    });

    const url = new URL(`${OPENAI_BASE_URL}/chat/completions`);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function buildPrompt(topic, products) {
  // Pick 2-3 relevant products
  const relevantProducts = products
    .filter(p => {
      const cats = [topic.category, topic.title].join(' ').toLowerCase();
      return p.keywords?.some(k => cats.includes(k.toLowerCase())) ||
             cats.includes(p.category?.toLowerCase() || '');
    })
    .slice(0, 3);

  const productBlock = relevantProducts.length > 0
    ? `\n\nInclude a "Recommended Resources" section with these Amazon products (use affiliate tag ${AMAZON_TAG}):\n` +
      relevantProducts.map(p => `- ${p.title} (ASIN: ${p.asin}) — ${p.description}`).join('\n')
    : '';

  return `You are The Oracle Lover — a direct, science-grounded somatic healing educator. Write a comprehensive, deeply helpful article about: "${topic.title}"

Requirements:
- Minimum 1800 words, ideally 2000-2200
- Category: ${topic.category}
- Tone: Direct, no-fluff, science-grounded but accessible. Not woo-woo. Not clinical. Like a trusted educator who has done the research.
- Structure with H2 and H3 headings
- Include a "Key Takeaways" section at the top (3-5 bullet points)
- Include a "What the Research Says" section with real study references
- Include a "Practical Application" section with actionable steps
- Include 5 FAQ questions and answers at the end (for schema markup)
- Write in second person ("you", "your body")
- Do NOT use excessive em-dashes or bullet point overload
- End with a compassionate, empowering closing paragraph${productBlock}

Return ONLY valid JSON in this exact format:
{
  "title": "article title",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description 150-160 chars",
  "excerpt": "2-3 sentence excerpt for card display",
  "body": "full article HTML using <h2>, <h3>, <p>, <ul>, <ol>, <blockquote> tags",
  "faqs": [{"q": "question", "a": "answer"}, ...],
  "keyTakeaways": ["takeaway 1", "takeaway 2", ...],
  "readingTime": estimated_minutes_as_number,
  "affiliateProducts": [{"asin": "B0...", "title": "...", "url": "https://amazon.com/dp/ASIN?tag=${AMAZON_TAG}"}]
}`;
}

async function generateArticle(topic, products, index) {
  const prompt = buildPrompt(topic, products);
  const raw = await callOpenAI([
    { role: 'system', content: 'You are a somatic healing expert and educator. Always return valid JSON only, no markdown code blocks.' },
    { role: 'user', content: prompt }
  ]);

  // Clean up any markdown code blocks
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned);

  const publishDate = computePublishDate(index);
  const heroUrl = CATEGORY_HERO_MAP[topic.category] || `${BUNNY_CDN_URL}/images/hero-somatic-healing.webp`;

  return {
    id: `article-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    slug: topic.slug,
    title: parsed.title || topic.title,
    metaTitle: parsed.metaTitle || topic.title,
    metaDescription: parsed.metaDescription || parsed.excerpt || '',
    excerpt: parsed.excerpt || '',
    category: topic.category,
    hero_url: heroUrl,
    hero_alt: `${topic.title} — Somatic For Life`,
    body: parsed.body || '',
    faqs: parsed.faqs || [],
    keyTakeaways: parsed.keyTakeaways || [],
    readingTime: parsed.readingTime || 8,
    affiliateProducts: parsed.affiliateProducts || [],
    author: 'The Oracle Lover',
    publishDate,
    published: isPublished(publishDate),
    dateModified: new Date().toISOString(),
    wordCount: (parsed.body || '').replace(/<[^>]+>/g, '').split(/\s+/).length,
  };
}

async function main() {
  if (!OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY not set');
    process.exit(1);
  }

  const topics = JSON.parse(readFileSync(TOPICS_FILE, 'utf8'));
  const products = existsSync(PRODUCTS_FILE) ? JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8')) : [];

  // Load existing articles
  let existing = [];
  if (existsSync(ARTICLES_FILE)) {
    existing = JSON.parse(readFileSync(ARTICLES_FILE, 'utf8'));
  }
  const existingSlugs = new Set(existing.map(a => a.slug));

  // Filter to only topics not yet generated
  const pending = topics.filter(t => !existingSlugs.has(t.slug));
  console.log(`Total topics: ${topics.length}`);
  console.log(`Already generated: ${existing.length}`);
  console.log(`Pending generation: ${pending.length}`);

  if (pending.length === 0) {
    console.log('All articles already generated!');
    return;
  }

  const results = [...existing];
  let successCount = 0;
  let errorCount = 0;

  // Process in batches
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const globalIndex = existing.length + i; // for date-gating offset

    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pending.length / BATCH_SIZE)} — articles ${i + 1}-${Math.min(i + BATCH_SIZE, pending.length)}`);

    const batchPromises = batch.map(async (topic, batchIdx) => {
      const articleIndex = globalIndex + batchIdx;
      try {
        const article = await generateArticle(topic, products, articleIndex);
        console.log(`  ✓ [${articleIndex + 1}] ${topic.title.slice(0, 60)}... (${article.wordCount} words, pub: ${article.publishDate})`);
        return { ok: true, article };
      } catch (err) {
        console.error(`  ✗ [${articleIndex + 1}] ${topic.title.slice(0, 50)}: ${err.message}`);
        return { ok: false, topic };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    for (const r of batchResults) {
      if (r.ok) {
        results.push(r.article);
        successCount++;
      } else {
        errorCount++;
      }
    }

    // Save progress after every batch
    writeFileSync(ARTICLES_FILE, JSON.stringify(results, null, 2));
    console.log(`  Progress saved: ${results.length} total articles`);

    // Rate limit delay between batches
    if (i + BATCH_SIZE < pending.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n=== GENERATION COMPLETE ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total articles: ${results.length}`);
  console.log(`Articles file: ${ARTICLES_FILE}`);

  // Summary of date-gating
  const publishedCount = results.filter(a => a.published).length;
  const scheduledCount = results.filter(a => !a.published).length;
  console.log(`\nPublished today: ${publishedCount}`);
  console.log(`Scheduled (future): ${scheduledCount}`);
  console.log(`Days of content: ~${Math.ceil(results.length / ARTICLES_PER_DAY)} days`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
