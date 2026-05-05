/**
 * Article generation engine using DeepSeek via OpenAI client.
 * Per spec: OPENAI_API_KEY + OPENAI_BASE_URL=https://api.deepseek.com
 */
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com',
});

const MODEL = process.env.OPENAI_MODEL || 'deepseek-chat';
const AMAZON_TAG = process.env.AMAZON_TAG || 'spankyspinola-20';
const TODAY = new Date().toISOString().split('T')[0];

const ORACLE_LOVER_PHRASES = [
  '"Look, here\'s the thing."',
  '"Stop overthinking this."',
  '"This isn\'t mystical. It\'s mechanical."',
  '"You already know the answer. You just don\'t like it."',
  '"Let me demystify this for you."',
  '"Here\'s what actually works."',
  '"That\'s the short version. Want the long one?"',
  '"Nobody\'s coming to explain this to you. So I will."',
  '"The body doesn\'t lie. The mind does. Constantly."',
  '"Less theory. More practice."',
];

const SOMATIC_PHRASES = [
  '"Talk therapy works for many things. Trauma stored in the body often needs something different."',
  '"This isn\'t mystical. It\'s neurobiology."',
  '"The shaking and the trembling is your nervous system completing something."',
  '"You don\'t have to remember it clearly for the body to remember it."',
];

export async function generateArticle({
  topic,
  category,
  tags = [],
  catalog = [],
  relatedArticles = [],
  authorName = 'The Oracle Lover',
  niche = 'somatic trauma healing',
  openerType = null,
  conclusionType = null,
}) {
  const productList = catalog.slice(0, 8).map(p =>
    `  - ASIN ${p.asin}: ${p.name} (${p.category})`
  ).join('\n');

  const internalList = relatedArticles.slice(0, 10).map(a =>
    `  - "${a.title}" → /articles/${a.slug}`
  ).join('\n');

  const openerInstructions = {
    'gut-punch': 'Start with a gut-punch statement — a bold, direct claim that immediately challenges the reader.',
    'question': 'Start with a provocative question that the reader genuinely wants answered.',
    'micro-story': 'Start with a 2-3 sentence micro-story — a specific moment, a person, a scene.',
    'counterintuitive': 'Start with a counterintuitive claim that contradicts conventional wisdom.',
  };

  const conclusionInstructions = {
    'cta': 'End with a clear call to action — what should the reader do next?',
    'reflection': 'End with a reflective observation that invites the reader to sit with something.',
    'question': 'End with a question that stays with the reader.',
    'challenge': 'End with a direct challenge to the reader.',
    'benediction': 'End with a warm, grounding benediction.',
  };

  const opener = openerType || ['gut-punch', 'question', 'micro-story', 'counterintuitive'][Math.floor(Math.random() * 4)];
  const conclusion = conclusionType || ['cta', 'reflection', 'question', 'challenge', 'benediction'][Math.floor(Math.random() * 5)];

  const selectedPhrases = [
    ...ORACLE_LOVER_PHRASES.sort(() => 0.5 - Math.random()).slice(0, 3),
    ...SOMATIC_PHRASES.sort(() => 0.5 - Math.random()).slice(0, 2),
  ];

  const prompt = `You are The Oracle Lover — an intuitive educator and oracle guide who writes about somatic trauma healing. You have a science background and a no-BS approach. You demystify body-based healing without mystifying it or reducing it.

Write a complete article about: "${topic}"

HARD RULES:

WORD COUNT
- 1,600 to 2,000 words (strict; under 1,200 or over 2,500 = regenerate)

NEVER USE EM-DASHES OR EN-DASHES
- Zero (—) (–). Use commas, periods, colons, parentheses, or " - " (hyphen with spaces).

NEVER USE THESE WORDS
delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark, underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated, bespoke, resonate, harness, intricate, plethora, myriad, comprehensive, transformative, groundbreaking, innovative, cutting-edge, revolutionary, state-of-the-art, ever-evolving, profound, holistic, nuanced, multifaceted, stakeholders, ecosystem, landscape, realm, sphere, domain, arguably, notably, crucially, importantly, essentially, fundamentally, inherently, intrinsically, substantively, streamline, optimize, facilitate, amplify, catalyze, propel, spearhead, orchestrate, navigate, traverse, furthermore, moreover, additionally, consequently, subsequently, thereby.

NEVER USE THESE PHRASES
"it's important to note", "it's worth noting", "in conclusion,", "in summary,", "in the realm of", "dive deep into", "delve into", "at the end of the day", "in today's fast-paced world", "in today's digital age", "plays a crucial role", "a testament to", "when it comes to", "cannot be overstated", "needless to say", "first and foremost", "last but not least".

VOICE
- Contractions throughout. You're. Don't. It's. That's. I've. We'll.
- Vary sentence length aggressively. Some fragments. Some long. Some three words.
- Direct address ("you") throughout.
- Include at least 3 of these Oracle Lover phrases naturally in the text:
${selectedPhrases.map(p => `  ${p}`).join('\n')}
- Concrete specifics over abstractions. A name. A number. A moment.
- Sentence lengths: mix 6-word punches, 18-word sentences, 3-word hits.

OPENER TYPE: ${openerInstructions[opener]}

ARTICLE STRUCTURE (output in this exact order):

1. TL;DR block (mandatory):
<section data-tldr="ai-overview" aria-label="In short">
  <p>[Three short declarative sentences summarizing the article's core insight.]</p>
</section>

2. Opening paragraph — ${openerInstructions[opener]}

3. 3-5 H2 sections with H3 subsections where needed. Each section should be substantive, specific, and cite real researchers where relevant (Bessel van der Kolk, Peter Levine, Pat Ogden, Babette Rothschild, Resmaa Menakem, Bruce Perry, Carl Jung, Angeles Arrien, Clarissa Pinkola Estés, Tara Brach). No researcher cited more than once per article.

4. Include at least one self-referencing line using one of:
   - "In our experience writing about ${niche}..."
   - "Across the articles we've published on this site..."
   - "Over the years I've seen..."
   - "In my own practice..."

5. Internal links (minimum 3) - use these naturally in prose:
${internalList || '  (No related articles yet — link to /articles when referencing related topics)'}

6. At least 1 external authoritative link to NIH, PubMed, CDC, WHO, or a peer-reviewed journal. Format:
   <a href="[URL]" target="_blank" rel="nofollow noopener">[descriptive anchor]</a>

7. Amazon affiliate links (exactly 3 or 4) embedded naturally in prose. Format each as:
   <a href="https://www.amazon.com/dp/ASIN?tag=${AMAZON_TAG}" target="_blank" rel="nofollow sponsored noopener">Product Name</a> (paid link)
   Use ONLY these ASINs:
${productList || '  (No catalog yet — skip affiliate links for now)'}

8. FAQ section (vary: some articles 0 FAQs, some 2-3, some 5 — not uniform). For this article: ${Math.random() < 0.3 ? '0 FAQs' : Math.random() < 0.6 ? '3 FAQs' : '5 FAQs'}

9. Conclusion — ${conclusionInstructions[conclusion]}

10. Author byline (mandatory):
<aside class="author-byline" data-eeat="author">
  <p><strong>Reviewed by The Oracle Lover</strong>, Intuitive Educator & Oracle Guide.
  Last updated <time datetime="${TODAY}">${TODAY}</time>.</p>
  <p>I've spent years writing about somatic healing on this site. The body's wisdom is not mystical — it's biological. And it's available to you right now.</p>
</aside>

11. Sanskrit mantra closing (1 line, italicized):
<p><em>[Choose one: Om Shanti Shanti Shanti / Tat Tvam Asi / Lokah Samastah Sukhino Bhavantu]</em></p>

OUTPUT FORMAT: Return only the article HTML body content (no <html>, no <head>, no <body> wrapper). Start directly with the TL;DR section.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 4000,
  });

  const body = response.choices[0]?.message?.content || '';

  // Extract ASINs used
  const asinMatches = body.match(/amazon\.com\/dp\/([A-Z0-9]{10})/g) || [];
  const productsUsed = [...new Set(asinMatches.map(m => m.split('/dp/')[1]))];

  // Generate meta description
  const metaPrompt = `Write a compelling meta description (150-160 characters) for an article titled "${topic}" about somatic trauma healing. Be direct, specific, no fluff. No em-dashes.`;
  const metaResponse = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: metaPrompt }],
    temperature: 0.7,
    max_tokens: 100,
  });
  const metaDescription = (metaResponse.choices[0]?.message?.content || '').trim().slice(0, 160);

  return {
    body,
    metaDescription,
    ogTitle: topic,
    ogDescription: metaDescription,
    productsUsed,
    openerType: opener,
    conclusionType: conclusion,
  };
}
