/**
 * gen500.mjs — Generate 500 somatic healing articles via DeepSeek API
 * Uses openai npm package. Date-gates at 6/day. Saves progress after each batch.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import OpenAI from 'openai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Parse .env manually
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx < 0) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

const ENV = loadEnv();
const DEEPSEEK_KEY = ENV.OPENAI_API_KEY;
const DEEPSEEK_URL = (ENV.OPENAI_BASE_URL || 'https://api.deepseek.com') + '/v1';
const MODEL = 'deepseek-v4-flash'; // flash is faster and cheaper; pro for final quality pass
const BUNNY_CDN_URL = ENV.BUNNY_CDN_URL || 'https://somatic-forlife.b-cdn.net';
const AMAZON_TAG = ENV.AMAZON_TAG || 'spankyspinola-20';
const ARTICLES_PER_DAY = 6;
const BATCH_SIZE = 3;
const DELAY_MS = 500;
const MAX_RETRIES = 3;

const TOPICS_FILE = path.join(ROOT, 'src/data/seed-topics-500.json');
const ARTICLES_FILE = path.join(ROOT, 'data/articles.json');
const PRODUCTS_FILE = path.join(ROOT, 'src/data/product-catalog.json');

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

const client = new OpenAI({
  apiKey: DEEPSEEK_KEY,
  baseURL: DEEPSEEK_URL,
  timeout: 120000,
  maxRetries: 2,
});

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function computePublishDate(index) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(today.getTime() + Math.floor(index / ARTICLES_PER_DAY) * 86400000);
  return d.toISOString().split('T')[0];
}

function isPublished(publishDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(publishDate) <= today;
}

function buildPrompt(topic, products) {
  const rel = products
    .filter(p => {
      const cats = [topic.category, topic.title].join(' ').toLowerCase();
      return (p.keywords || []).some(k => cats.includes(k.toLowerCase())) ||
             cats.includes((p.category || '').toLowerCase());
    })
    .slice(0, 2);

  const productBlock = rel.length > 0
    ? `\n\nInclude a "Recommended Resources" section with these Amazon products (tag=${AMAZON_TAG}):\n` +
      rel.map(p => `- ${p.title} (ASIN: ${p.asin})`).join('\n')
    : '';

  return `You are The Oracle Lover — a direct, science-grounded somatic healing educator. Write a comprehensive article about: "${topic.title}"

Requirements:
- Minimum 1800 words
- Category: ${topic.category}
- Tone: Direct, no-fluff, science-grounded but accessible. Not woo-woo. Not clinical.
- Use H2 and H3 headings
- Include "Key Takeaways" section (3-5 bullet points)
- Include "What the Research Says" section with real study references
- Include "Practical Application" section with actionable steps
- Include 5 FAQ questions and answers at the end
- Write in second person ("you", "your body")${productBlock}

Return ONLY valid JSON (no markdown code blocks, no preamble):
{
  "title": "article title",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description 150-160 chars",
  "excerpt": "2-3 sentence excerpt",
  "body": "full article HTML using h2, h3, p, ul, ol, blockquote tags — minimum 1800 words",
  "faqs": [{"q": "question", "a": "answer"}],
  "keyTakeaways": ["takeaway 1", "takeaway 2"],
  "readingTime": 9,
  "affiliateProducts": [{"asin": "B0...", "title": "...", "url": "https://amazon.com/dp/ASIN?tag=${AMAZON_TAG}"}]
}`;
}

async function generateOne(topic, products, articleIndex, retryCount = 0) {
  const prompt = buildPrompt(topic, products);
  let raw;
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a somatic healing expert. Return only valid JSON, no markdown code blocks, no preamble, no reasoning.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });
    raw = completion.choices[0].message.content || '';
  } catch (e) {
    if (retryCount < MAX_RETRIES) {
      await sleep(2000 * (retryCount + 1));
      return generateOne(topic, products, articleIndex, retryCount + 1);
    }
    throw new Error(`API failed after ${MAX_RETRIES} retries: ${e.message}`);
  }

  // Clean JSON — handle DeepSeek reasoning tags and markdown code blocks
  let cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '') // remove DeepSeek reasoning tags
    .replace(/```json\s*/gi, '').replace(/```\s*/g, '') // remove markdown code fences
    .trim();

  // Find the outermost JSON object
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // Attempt progressive fixes
    let fixed = cleaned
      .replace(/,\s*}/g, '}')   // trailing commas in objects
      .replace(/,\s*]/g, ']')   // trailing commas in arrays
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":') // unquoted keys
      .replace(/:\s*'([^']*)'/g, ': "$1"');        // single-quoted values
    try {
      parsed = JSON.parse(fixed);
    } catch (e2) {
      // Last resort: try to extract just the body field and build minimal article
      const titleMatch = raw.match(/"title"\s*:\s*"([^"]+)"/);
      const excerptMatch = raw.match(/"excerpt"\s*:\s*"([^"]+)"/);
      // Find body content between first <h2> and last </section> or end
      const bodyMatch = raw.match(/"body"\s*:\s*"((?:[^"\\]|\\[\s\S])*?)"(?=\s*,|\s*})/s);
      if (titleMatch && bodyMatch) {
        parsed = {
          title: titleMatch[1],
          excerpt: excerptMatch ? excerptMatch[1] : '',
          body: bodyMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"'),
          faqs: [],
          keyTakeaways: [],
          affiliateProducts: [],
        };
      } else {
        throw new Error(`JSON parse failed: ${e2.message}`);
      }
    }
  }

  const publishDate = computePublishDate(articleIndex);
  const heroUrl = CATEGORY_HERO_MAP[topic.category] || `${BUNNY_CDN_URL}/images/hero-somatic-healing.webp`;
  const wordCount = (parsed.body || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;

  return {
    id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
    readingTime: parsed.readingTime || Math.ceil(wordCount / 200),
    affiliateProducts: parsed.affiliateProducts || [],
    author: 'The Oracle Lover',
    publishDate,
    published: isPublished(publishDate),
    dateModified: new Date().toISOString(),
    wordCount,
  };
}

async function main() {
  console.log(`=== Somatic For Life — 500 Article Generator ===`);
  console.log(`Model: ${MODEL} | Base: ${DEEPSEEK_URL}`);
  console.log(`Key: ${DEEPSEEK_KEY ? DEEPSEEK_KEY.slice(0, 20) + '...' : 'NOT SET'}`);

  if (!DEEPSEEK_KEY) { console.error('ERROR: OPENAI_API_KEY not in .env'); process.exit(1); }

  const topics = JSON.parse(readFileSync(TOPICS_FILE, 'utf8'));
  const products = existsSync(PRODUCTS_FILE) ? JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8')) : [];
  let existing = existsSync(ARTICLES_FILE) ? JSON.parse(readFileSync(ARTICLES_FILE, 'utf8')) : [];
  const existingSlugs = new Set(existing.map(a => a.slug));
  const pending = topics.filter(t => !existingSlugs.has(t.slug));

  console.log(`Topics: ${topics.length} | Existing: ${existing.length} | Pending: ${pending.length}`);
  if (pending.length === 0) { console.log('All done!'); return; }

  let success = 0, errors = 0;
  const results = [...existing];

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pending.length / BATCH_SIZE);
    console.log(`\nBatch ${batchNum}/${totalBatches}`);

    const batchResults = await Promise.all(batch.map(async (topic, bi) => {
      const idx = existing.length + i + bi;
      try {
        const art = await generateOne(topic, products, idx);
        console.log(`  ✓ [${idx + 1}] ${topic.title.slice(0, 55)}... (${art.wordCount}w, ${art.publishDate})`);
        return { ok: true, art };
      } catch (e) {
        console.error(`  ✗ [${idx + 1}] ${topic.title.slice(0, 45)}: ${e.message.slice(0, 80)}`);
        return { ok: false };
      }
    }));

    for (const r of batchResults) {
      if (r.ok) { results.push(r.art); success++; }
      else errors++;
    }

    writeFileSync(ARTICLES_FILE, JSON.stringify(results, null, 2));
    process.stdout.write(`  Saved: ${results.length} | ✓${success} ✗${errors}\n`);

    if (i + BATCH_SIZE < pending.length) await sleep(DELAY_MS);
  }

  console.log(`\n=== DONE === ✓${success} ✗${errors} | Total: ${results.length}`);
  const pub = results.filter(a => a.published).length;
  console.log(`Published: ${pub} | Scheduled: ${results.length - pub} | ~${Math.ceil(results.length / ARTICLES_PER_DAY)} days of content`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
