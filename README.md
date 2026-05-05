# The Body Remembers — Site 117

> The research-grounded resource for body-based trauma healing, somatic therapy, and nervous system regulation.

**Stack:** Node.js + Express + Vite + React (SSR) · TypeScript · PostgreSQL (JSON fallback) · DigitalOcean App Platform

---

## Quick Start

```bash
pnpm install
pnpm build          # builds client + server
node dist/index.js  # starts production server on PORT (default 3000)
```

For development:
```bash
pnpm dev            # Vite dev server (frontend only, port 5173)
```

---

## Environment Variables

Create a `.env` file (never commit it):

```env
# Required for article generation cron
OPENAI_API_KEY=sk-...

# Optional — PostgreSQL. If not set, falls back to data/articles.json
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Amazon affiliate tag
AMAZON_TAG=your-tag-20

# Bunny CDN (add when ready)
BUNNY_STORAGE_ZONE=the-body-remembers
BUNNY_API_KEY=your-bunny-api-key
BUNNY_CDN_URL=https://the-body-remembers.b-cdn.net

# Site URL (for SEO/sitemap)
SITE_URL=https://thebodyremembers.com

# Port (DigitalOcean sets this automatically)
PORT=3000
```

---

## Project Structure

```
the-body-remembers/
├── .do/app.yaml              # DigitalOcean App Platform config
├── data/
│   ├── articles.json         # 30 seeded articles (JSON DB fallback)
│   └── assessments.json      # 5 assessments with scoring
├── server/
│   ├── index.ts              # Express server entry
│   ├── ssr.ts                # SSR renderer
│   └── routes/               # API routes (articles, assessments, sitemap, health)
├── src/
│   ├── client/               # React frontend
│   │   ├── App.tsx           # Router + layout
│   │   ├── components/       # Sidebar, ArticleCard, Footer, etc.
│   │   ├── pages/            # HomePage, ArticlePage, AssessmentPage, etc.
│   │   └── styles/           # tokens.css + global.css
│   ├── cron/                 # Scheduled jobs
│   ├── data/                 # Seed topics + product catalog
│   ├── db/                   # Schema + migration scripts
│   └── lib/                  # db, bunny, aeo, quality-gate, deepseek
├── scripts/
│   ├── build-server.mjs      # esbuild server bundler
│   ├── bulk-seed.mjs         # Generate 30 articles via OpenAI
│   └── start-with-cron.mjs   # Production entry with cron scheduler
└── public/images/            # Hero images (move to Bunny CDN in production)
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, topic grid, assessments CTA, recent articles |
| `/articles` | All articles with search, category filter, pagination |
| `/articles/:slug` | Full article with hero image, FAQs, related articles, affiliate products |
| `/assessments` | All 5 assessments |
| `/assessments/:id` | Interactive quiz with scored results |
| `/recommended` | Curated books and tools |
| `/about` | About The Oracle Lover |
| `/sitemap.xml` | XML sitemap |
| `/robots.txt` | Robots file |
| `/llms.txt` | LLM-readable site summary |
| `/health` | Health check endpoint |

---

## Assessments (5)

1. **What State Is Your Nervous System In Right Now?** — Ventral vagal / sympathetic / dorsal vagal
2. **How Is Trauma Showing Up in Your Body?** — Physical trauma mapping
3. **How Wide Is Your Window of Tolerance?** — Capacity for stress/activation
4. **Is People-Pleasing a Trauma Response for You?** — Fawn response identification
5. **Are You Ready to Start Somatic Healing Work?** — Readiness assessment

---

## Article Categories (30 articles)

| Category | Count |
|---|---|
| Trauma Therapy | 6 |
| Nervous System | 5 |
| Somatic Healing | 4 |
| Somatic Practices | 4 |
| Body-Mind Connection | 3 |
| Self-Directed Work | 3 |
| Polyvagal Theory | 2 |
| Research & Science | 2 |
| EMDR | 1 |

---

## Cron Jobs (production)

| Job | Schedule | Description |
|---|---|---|
| `generate-article` | Daily 6am UTC | Generates 1 new article via OpenAI |
| `product-spotlight` | Weekly Mon 8am | Refreshes affiliate product matches |
| `refresh-monthly` | 1st of month | Updates monthly content |
| `refresh-quarterly` | 1st of quarter | Full content audit |
| `asin-health-check` | Weekly Sun | Verifies Amazon ASIN validity |

---

## Deploying to DigitalOcean

The `.do/app.yaml` is pre-configured. Steps:

1. Push to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_ORG/the-body-remembers.git
   git push -u origin main
   ```
2. In DigitalOcean App Platform → **New App** → connect your GitHub repo
3. It will auto-detect `.do/app.yaml`
4. Add environment variables in the DO dashboard
5. Add a managed PostgreSQL database (optional — site works with JSON fallback)

**Build command:** `pnpm install && pnpm build`
**Run command:** `node scripts/start-with-cron.mjs`

---

## Adding Bunny CDN

When you have your Bunny CDN zone ready:

1. Set `BUNNY_STORAGE_ZONE`, `BUNNY_API_KEY`, `BUNNY_CDN_URL` in env
2. Upload images from `public/images/` to Bunny
3. Update `hero_url` values in `data/articles.json` to use CDN URLs (e.g. `https://the-body-remembers.b-cdn.net/images/hero-somatic-healing.jpg`)
4. The `ArticleCard` and `ArticlePage` components will automatically use CDN URLs

---

## Design System

- **Colors:** Soft violet/lavender palette (`--accent: #6A5A90`)
- **Fonts:** Lora (serif headings) + Inter (body)
- **Layout:** 240px sticky sidebar + fluid main content
- **Cards:** 3-column grid → 2-col tablet → 1-col mobile
- **Dark mode:** Not yet implemented (planned)

---

## Author

**The Oracle Lover** — Intuitive Educator & Oracle Guide
[theoraclelover.com](https://theoraclelover.com)

*Om Shanti Shanti Shanti*
