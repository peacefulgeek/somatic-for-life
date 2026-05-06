# Somatic For Life — Site 117

**somaticforlife.com** — The research-grounded guide to somatic healing, nervous system regulation, and body-based trauma recovery. Science, practice, and zero fluff.

Written by **The Oracle Lover** — intuitive educator and oracle guide.

**Stack:** Node.js 22 + Express 5 + Vite + React 18 + TypeScript · JSON data (PostgreSQL-ready) · Bunny CDN · DigitalOcean App Platform

---

## Quick Start

```bash
pnpm install
pnpm build          # builds client + server
node dist/index.js  # starts production server on PORT (default 3000)
```

For development:
```bash
pnpm dev            # Vite dev server (frontend, port 5173)
pnpm dev:server     # Express server (port 3000)
```

---

## Environment Variables

Create a `.env` file (never commit it):

```env
# Site domain
SITE_DOMAIN=somaticforlife.com

# DeepSeek API (for daily article cron)
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.deepseek.com

# Amazon affiliate tag
AMAZON_TAG=spankyspinola-20

# Bunny CDN
BUNNY_STORAGE_ZONE=somatic-forlife
BUNNY_API_KEY=9683bfd5-7ef1-4ea7-aaa3bed5d2a0-9722-43fc
BUNNY_CDN_URL=https://somatic-forlife.b-cdn.net
BUNNY_REGION=ny.storage.bunnycdn.com

# Optional — PostgreSQL. Falls back to data/*.json if not set
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Port (DigitalOcean sets this automatically)
PORT=3000
```

---

## Project Structure

```
somatic-for-life/
├── .do/app.yaml              # DigitalOcean App Platform config
├── data/
│   ├── articles.json         # 500 articles (date-gated at 6/day)
│   ├── assessments.json      # 9 assessments with scoring
│   └── supplements.json      # 191 herbs/TCM/supplements/books/tools
├── server/
│   ├── index.ts              # Express server entry
│   ├── ssr.ts                # Per-route SSR meta injection
│   └── routes/               # articles, assessments, supplements, sitemap, robots, llms, health
├── src/
│   ├── client/
│   │   ├── App.tsx           # Router + layout
│   │   ├── components/       # Sidebar, ArticleCard, Footer, MobileHeader, etc.
│   │   ├── pages/            # HomePage, ArticlesPage, ArticlePage, AssessmentsPage, AssessmentPage, SupplementsPage, etc.
│   │   └── styles/           # tokens.css + global.css
│   ├── cron/                 # Scheduled jobs
│   ├── data/                 # seed-topics-500.json, product-catalog.json
│   ├── db/                   # schema.sql, migrate.mjs
│   └── lib/                  # db.mjs, bunny.mjs, aeo.mjs, quality-gate.mjs
├── scripts/
│   ├── build-server.mjs      # esbuild server bundler
│   ├── gen500.mjs            # 500-article DeepSeek generator
│   ├── start-with-cron.mjs   # Production entry with cron scheduler
│   └── upload-images-to-bunny.mjs
└── public/                   # Static assets
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, topic grid, assessments CTA, recent articles |
| `/articles` | All articles with search, category filter, pagination |
| `/articles/:slug` | Full article with hero image, FAQs, related articles, affiliate products |
| `/assessments` | All 9 assessments |
| `/assessments/:id` | Interactive quiz with scored results |
| `/supplements` | 191 herbs/TCM/supplements/books/tools with evidence ratings |
| `/recommended` | Curated books and tools |
| `/about` | About The Oracle Lover |
| `/sitemap.xml` | XML sitemap with image extensions |
| `/robots.txt` | Robots file with AI crawler permissions |
| `/llms.txt` | LLM-readable site summary |
| `/llms-full.txt` | Full article content for AI indexing |
| `/ai.txt` | AI crawler permissions file |
| `/health` | Health check endpoint |

---

## Assessments (9)

1. **What State Is Your Nervous System In Right Now?** — Ventral vagal / sympathetic / dorsal vagal
2. **How Is Trauma Showing Up in Your Body?** — Physical trauma mapping
3. **How Wide Is Your Window of Tolerance?** — Capacity for stress/activation
4. **Is People-Pleasing a Trauma Response for You?** — Fawn response identification
5. **Are You Ready to Start Somatic Healing Work?** — Readiness assessment
6. **What Childhood Trauma Patterns Are You Carrying?** — ACEs and attachment patterns
7. **What Is Your Polyvagal Profile?** — Nervous system dominance pattern
8. **Are You Ready for EMDR?** — EMDR readiness and contraindications
9. **Somatic Symptom Checker** — Body-held stress and trauma inventory

---

## Article Categories (500 total, 6/day date-gated)

| Category | Articles |
|---|---|
| Trauma Therapy | ~60 |
| Nervous System | ~55 |
| Somatic Healing | ~55 |
| Somatic Practices | ~55 |
| Body-Mind Connection | ~55 |
| Self-Directed Work | ~55 |
| Polyvagal Theory | ~55 |
| Research & Science | ~55 |
| EMDR | ~55 |

---

## Supplements Page (191 items, 7 categories)

| Category | Items |
|---|---|
| Adaptogens & Mushrooms | 17 |
| Nervines & Calming Herbs | 21 |
| TCM Formulas | 21 |
| Ayurvedic Herbs | 12 |
| Supplements & Nutrients | 50 |
| Books | 43 |
| Tools & Devices | 27 |

---

## SEO / AEO

- Per-route SSR meta injection (title, description, canonical, OG, Twitter cards)
- JSON-LD schemas: Article, FAQPage, Quiz, WebSite, BreadcrumbList
- `article:published_time` + `article:modified_time` meta tags
- XML sitemap with image extensions (`xmlns:image`)
- `robots.txt` with AI crawler permissions (GPTBot, ClaudeBot, PerplexityBot, etc.)
- `llms.txt` — concise site overview for AI systems
- `llms-full.txt` — full article content index for AI indexing
- `ai.txt` — AI crawler permissions and attribution

---

## Cron Jobs (production)

| Job | Schedule | Description |
|---|---|---|
| `generate-article` | Daily 2am UTC | Generates 1 new article via DeepSeek |
| `product-spotlight` | Weekly Mon 9am | Refreshes affiliate product matches |
| `refresh-monthly` | 1st of month | Updates top 20 articles |
| `refresh-quarterly` | 1st of quarter | Full content audit |
| `asin-health-check` | Weekly Sun | Verifies Amazon ASIN validity |

---

## Deploying to DigitalOcean App Platform

The `.do/app.yaml` is pre-configured. Steps:

1. **Push to GitHub** (see below)
2. In DigitalOcean App Platform → **New App** → connect your GitHub repo
3. Select `peacefulgeek/somatic-for-life` → it auto-detects `.do/app.yaml`
4. Add environment variables in the DO dashboard
5. Deploy

**Build command:** `pnpm install && pnpm build`
**Run command:** `node scripts/start-with-cron.mjs`

---

## Push to GitHub

```bash
cd /home/ubuntu/the-body-remembers

# Add remote
git remote add origin https://github.com/peacefulgeek/somatic-for-life.git

# Push
git push -u origin main
```

---

## Bunny CDN

- **Storage zone:** `somatic-forlife`
- **Region endpoint:** `https://ny.storage.bunnycdn.com/somatic-forlife`
- **Pull zone / CDN URL:** `https://somatic-forlife.b-cdn.net`

All 10 hero images are already uploaded as compressed WebP:
```
https://somatic-forlife.b-cdn.net/images/hero-somatic-healing.webp
https://somatic-forlife.b-cdn.net/images/hero-nervous-system.webp
https://somatic-forlife.b-cdn.net/images/hero-trauma-therapy.webp
https://somatic-forlife.b-cdn.net/images/hero-polyvagal.webp
https://somatic-forlife.b-cdn.net/images/hero-somatic-practices.webp
https://somatic-forlife.b-cdn.net/images/hero-emdr.webp
https://somatic-forlife.b-cdn.net/images/hero-body-mind.webp
https://somatic-forlife.b-cdn.net/images/hero-trauma-research.webp
https://somatic-forlife.b-cdn.net/images/hero-self-directed.webp
https://somatic-forlife.b-cdn.net/images/hero-homepage.webp
```

To upload new images:
```bash
node scripts/upload-images-to-bunny.mjs
```

---

## Article Generation

The 500-article generator is in `scripts/gen500.mjs`. Uses DeepSeek, date-gates at 6/day.

```bash
# Resume generation (skips already-generated articles)
node scripts/gen500.mjs
```

Articles are saved to `data/articles.json`. The server reads this file directly.

---

## Design System

- **Colors:** Soft violet/lavender palette (`--color-primary: #6A5A90`)
- **Fonts:** Lora (serif headings) + Inter (body) via Google Fonts
- **Layout:** 240px sticky sidebar + fluid main content
- **Cards:** 3-column grid → 2-col tablet → 1-col mobile
- **CSS tokens:** Full design token system in `src/client/styles/tokens.css`

---

## Amazon Affiliate

All product links use tag `spankyspinola-20`. Links are in:
- `data/supplements.json` — supplements page
- `data/articles.json` — `affiliateProducts` field on each article
- `src/data/product-catalog.json` — source catalog for article generation

---

## Author

**The Oracle Lover** — Intuitive Educator & Oracle Guide

[theoraclelover.com](https://theoraclelover.com)

*Om Shanti Shanti Shanti*
