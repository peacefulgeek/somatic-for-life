/**
 * Bulk seed script — generates 30 articles using OpenAI API and saves to data/articles.json
 * Run: node scripts/bulk-seed.mjs
 */
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = 'gpt-4.1-mini';
const AMAZON_TAG = 'spankyspinola-20';
const TODAY = new Date().toISOString().split('T')[0];

// Category to hero image mapping
const CATEGORY_IMAGES = {
  'somatic-healing': '/images/hero-somatic-healing.jpg',
  'nervous-system': '/images/hero-nervous-system.jpg',
  'trauma-therapy': '/images/hero-trauma-therapy.jpg',
  'polyvagal-theory': '/images/hero-polyvagal.jpg',
  'somatic-practices': '/images/hero-somatic-practices.jpg',
  'emdr-therapy': '/images/hero-emdr.jpg',
  'body-mind': '/images/hero-body-mind.jpg',
  'trauma-research': '/images/hero-trauma-research.jpg',
  'self-directed': '/images/hero-self-directed.jpg',
};

const PRODUCT_CATALOG = [
  { asin: 'B00G3L1C2K', name: 'The Body Keeps the Score', category: 'somatic-healing' },
  { asin: 'B00AQCGD7K', name: 'Waking the Tiger: Healing Trauma', category: 'somatic-healing' },
  { asin: 'B07BFKM1YZ', name: "My Grandmother's Hands", category: 'trauma-research' },
  { asin: 'B01LWKXHQF', name: 'In an Unspoken Voice', category: 'somatic-healing' },
  { asin: 'B07PJVPZGM', name: 'The Polyvagal Theory in Therapy', category: 'polyvagal-theory' },
  { asin: 'B07HQKQHKV', name: 'Anchored: How to Befriend Your Nervous System', category: 'polyvagal-theory' },
  { asin: '0393709272', name: 'The Body Keeps the Score (Paperback)', category: 'somatic-healing' },
  { asin: '1623172217', name: 'Trauma-Sensitive Mindfulness', category: 'somatic-practices' },
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function countWords(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

async function generateArticle(topic) {
  const products = PRODUCT_CATALOG.slice(0, 6).map(p => `  - ASIN ${p.asin}: ${p.name}`).join('\n');

  const prompt = `You are The Oracle Lover, an intuitive educator who writes about somatic trauma healing. Science background. No-BS approach. Demystify body-based healing without mystifying it.

Write a complete, high-quality article about: "${topic.title}"

HARD RULES:
- 1,400 to 1,900 words
- NO em-dashes or en-dashes. Use commas, periods, colons, or parentheses instead.
- NO these words: delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, comprehensive, transformative, groundbreaking, innovative, cutting-edge, revolutionary, holistic, nuanced, multifaceted, profound
- Use contractions throughout (you're, it's, don't, I've, we'll)
- Vary sentence length aggressively. Short punches. Longer explanations.
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
${products}

7. 2-3 FAQ items (use <details>/<summary> format):
<details>
  <summary>[Question]</summary>
  <p>[Answer]</p>
</details>

8. Conclusion (reflection, challenge, or call to action)

9. Author byline:
<aside class="author-byline" data-eeat="author">
  <p><strong>Reviewed by The Oracle Lover</strong>, Intuitive Educator and Oracle Guide. Last updated <time datetime="${TODAY}">${TODAY}</time>.</p>
  <p>I've spent years writing about somatic healing on this site. The body's wisdom is not mystical - it's biological. And it's available to you right now.</p>
</aside>

10. Sanskrit closing (one line, italicized):
<p><em>Om Shanti Shanti Shanti</em></p>

OUTPUT: Return ONLY the article HTML body. Start with the TL;DR section. No html, head, or body tags.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 3500,
  });

  return response.choices[0]?.message?.content || '';
}

async function generateMeta(title) {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{
      role: 'user',
      content: `Write a compelling meta description (140-155 characters) for an article titled "${title}" about somatic trauma healing. Be direct and specific. No em-dashes. No fluff. Return only the meta description text.`
    }],
    temperature: 0.7,
    max_tokens: 80,
  });
  return (response.choices[0]?.message?.content || '').trim().slice(0, 160);
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Load existing articles
  let articles = [];
  try {
    const raw = await fs.readFile(ARTICLES_FILE, 'utf8');
    articles = JSON.parse(raw);
    console.log(`[bulk-seed] Loaded ${articles.length} existing articles`);
  } catch {
    console.log('[bulk-seed] Starting fresh');
  }

  const topicsRaw = await fs.readFile(path.join(ROOT, 'src/data/seed-topics.json'), 'utf8');
  const topics = JSON.parse(topicsRaw);

  let seeded = 0, skipped = 0, failed = 0;

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const slug = slugify(topic.title);

    if (articles.find(a => a.slug === slug)) {
      console.log(`[${i+1}/${topics.length}] SKIP: ${slug}`);
      skipped++;
      continue;
    }

    console.log(`[${i+1}/${topics.length}] Generating: ${topic.title}`);

    try {
      const body = await generateArticle(topic);
      const metaDescription = await generateMeta(topic.title);
      const wordCount = countWords(body);
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));
      const daysAgo = topics.length - i;
      const publishedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      const article = {
        id: Date.now() + i,
        slug,
        title: topic.title,
        meta_description: metaDescription,
        og_title: topic.title,
        og_description: metaDescription,
        category: topic.category,
        tags: topic.tags || [],
        body,
        status: 'published',
        hero_url: CATEGORY_IMAGES[topic.category] || '/images/hero-somatic-healing.jpg',
        image_alt: `${topic.title} - somatic healing illustration`,
        word_count: wordCount,
        reading_time: readingTime,
        published_at: publishedAt,
        last_modified_at: publishedAt,
        created_at: publishedAt,
      };

      articles.push(article);
      // Save after each article to avoid losing progress
      await fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2));
      seeded++;
      console.log(`  OK: ${slug} (${wordCount} words, ${readingTime} min read)`);
    } catch (err) {
      console.error(`  FAILED: ${topic.title} - ${err.message}`);
      failed++;
    }

    // Rate limit
    if (i < topics.length - 1) await new Promise(r => setTimeout(r, 1200));
  }

  console.log(`\n[bulk-seed] Done. seeded=${seeded} skipped=${skipped} failed=${failed}`);
  console.log(`[bulk-seed] Total articles: ${articles.length}`);
}

main().catch(err => {
  console.error('[bulk-seed] Fatal:', err);
  process.exit(1);
});
