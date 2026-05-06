-- Somatic For Life — PostgreSQL Schema
-- Run this on first deploy to initialize the database

-- ─── Articles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id                SERIAL PRIMARY KEY,
  slug              VARCHAR(120) NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  meta_description  TEXT,
  og_title          TEXT,
  og_description    TEXT,
  category          VARCHAR(60) NOT NULL DEFAULT 'somatic-healing',
  tags              TEXT[] DEFAULT '{}',
  body              TEXT NOT NULL DEFAULT '',
  status            VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'queued', 'published', 'archived')),
  hero_url          TEXT,
  image_alt         TEXT,
  asins_used        TEXT[] DEFAULT '{}',
  word_count        INTEGER DEFAULT 0,
  reading_time      INTEGER DEFAULT 0,
  published_at      TIMESTAMPTZ,
  queued_at         TIMESTAMPTZ,
  last_modified_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- ─── Product Catalog ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  asin        VARCHAR(20) NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  category    VARCHAR(60),
  tags        TEXT[] DEFAULT '{}',
  type        VARCHAR(20) DEFAULT 'book',
  author      TEXT,
  status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dead', 'unverified')),
  last_checked_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- ─── ASIN Verification Log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asin_checks (
  id          SERIAL PRIMARY KEY,
  asin        VARCHAR(20) NOT NULL,
  valid       BOOLEAN NOT NULL,
  reason      TEXT,
  checked_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asin_checks_asin ON asin_checks(asin);
CREATE INDEX IF NOT EXISTS idx_asin_checks_checked_at ON asin_checks(checked_at DESC);

-- ─── Cron Log ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cron_log (
  id          SERIAL PRIMARY KEY,
  job_name    VARCHAR(60) NOT NULL,
  status      VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  message     TEXT,
  duration_ms INTEGER,
  ran_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cron_log_job_name ON cron_log(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_log_ran_at ON cron_log(ran_at DESC);
