/**
 * Database abstraction layer.
 * Uses PostgreSQL when DATABASE_URL is set, otherwise falls back to JSON files.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');

let _pool = null;

export async function getPool() {
  if (_pool) return _pool;
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const { Pool } = pg;
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    _pool.on('error', err => console.error('[db] Pool error:', err.message));
    return _pool;
  }
  return null;
}

export const pool = {
  end: async () => {
    if (_pool) { await _pool.end(); _pool = null; }
  }
};

export async function query(sql, params = []) {
  const pg = await getPool();
  if (pg) {
    return pg.query(sql, params);
  }
  return jsonFallback(sql, params);
}

export async function close() {
  if (_pool) { await _pool.end(); _pool = null; }
}

// ─── JSON file fallback (for local dev without Postgres) ─────────────────────
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

async function readJson(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function jsonFallback(sql, params) {
  const s = sql.trim().toLowerCase();

  if (s.startsWith('select') && s.includes('from articles')) {
    const articles = await readJson(ARTICLES_FILE);
    let rows = [...articles];

    if (s.includes("status = 'published'") || params.includes('published')) {
      rows = rows.filter(a => a.status === 'published' || a.published === true);
    }
    if (s.includes('slug =') || s.includes('slug=$')) {
      const slugParam = params.find(p => typeof p === 'string' && p.includes('-'));
      if (slugParam) rows = rows.filter(a => a.slug === slugParam);
    }
    if (s.includes('category =') || s.includes('category=$')) {
      const catParam = params.find(p => typeof p === 'string' && p.includes('-'));
      if (catParam) rows = rows.filter(a => a.category === catParam);
    }
    if (s.includes('ilike')) {
      const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%'));
      if (searchParam) {
        const q = searchParam.replace(/%/g, '').toLowerCase();
        rows = rows.filter(a =>
          a.title?.toLowerCase().includes(q) || a.meta_description?.toLowerCase().includes(q)
        );
      }
    }
    if (s.includes('order by published_at desc')) {
      rows = rows.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
    }
    if (s.includes('count(*)')) {
      return { rows: [{ count: String(rows.length) }] };
    }
    const limitMatch = s.match(/limit\s+\$?(\d+)/);
    const offsetMatch = s.match(/offset\s+\$?(\d+)/);
    const limitNum = limitMatch ? parseInt(params[params.length - 2] || limitMatch[1]) : rows.length;
    const offsetNum = offsetMatch ? parseInt(params[params.length - 1] || offsetMatch[1]) : 0;
    rows = rows.slice(offsetNum, offsetNum + limitNum);
    return { rows };
  }

  if (s.startsWith('select') && s.includes('count(*)') && s.includes('from articles')) {
    const articles = await readJson(ARTICLES_FILE);
    const published = articles.filter(a => a.status === 'published' || a.published === true);
    return { rows: [{ count: String(published.length) }] };
  }

  if (s.startsWith('select') && s.includes('category') && s.includes('count') && s.includes('from articles')) {
    const articles = await readJson(ARTICLES_FILE);
    const counts = {};
    for (const a of articles) {
      if (a.status === 'published' || a.published === true) counts[a.category] = (counts[a.category] || 0) + 1;
    }
    return { rows: Object.entries(counts).map(([category, count]) => ({ category, count: String(count) })) };
  }

  if (s.startsWith('insert into articles')) {
    const articles = await readJson(ARTICLES_FILE);
    const now = new Date().toISOString();
    const newArticle = {
      id: Date.now(),
      slug: params[0], title: params[1], meta_description: params[2] || '',
      og_title: params[3] || params[1], og_description: params[4] || params[2] || '',
      category: params[5] || 'somatic-healing', tags: params[6] || [],
      body: params[7] || '', status: params[8] || 'queued',
      hero_url: params[9] || null, image_alt: params[10] || null,
      word_count: params[11] || 0, reading_time: params[12] || 5,
      published_at: params[13] || null, last_modified_at: now, created_at: now,
    };
    if (!articles.find(a => a.slug === newArticle.slug)) {
      articles.push(newArticle);
      await writeJson(ARTICLES_FILE, articles);
    }
    return { rows: [newArticle] };
  }

  if (s.startsWith('update articles')) {
    const articles = await readJson(ARTICLES_FILE);
    const idParam = params[params.length - 1];
    const idx = articles.findIndex(a => a.id === idParam || a.slug === idParam);
    if (idx !== -1) {
      if (s.includes('status')) articles[idx].status = 'published';
      if (s.includes('hero_url')) articles[idx].hero_url = params[0];
      articles[idx].last_modified_at = new Date().toISOString();
      await writeJson(ARTICLES_FILE, articles);
    }
    return { rows: [] };
  }

  if (s.startsWith('insert into') && !s.includes('articles')) {
    // Silently ignore cron_log, products, etc. in JSON mode
    return { rows: [] };
  }

  return { rows: [] };
}

// ─── High-level helpers ───────────────────────────────────────────────────
export async function getArticles({ page = 1, limit = 12, category = '', search = '' } = {}) {
  const pg = await getPool();
  if (pg) {
    let where = `WHERE status = 'published'`;
    const params = [];
    let idx = 1;
    if (category) { where += ` AND category = $${idx++}`; params.push(category); }
    if (search) { where += ` AND (title ILIKE $${idx} OR meta_description ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    const countRes = await pg.query(`SELECT COUNT(*) FROM articles ${where}`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const { rows } = await pg.query(
      `SELECT id, slug, title, meta_description, category, tags, hero_url, image_alt, reading_time, published_at, word_count
       FROM articles ${where} ORDER BY published_at DESC NULLS LAST LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );
    return { articles: rows, pagination: { page, limit, total, pages, hasNext: page < pages, hasPrev: page > 1 } };
  }

  // JSON fallback
  const all = await readJson(ARTICLES_FILE);
  let filtered = all.filter(a => a.status === 'published' || a.published === true);
  if (category) filtered = filtered.filter(a => a.category === category);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a => a.title?.toLowerCase().includes(q) || a.meta_description?.toLowerCase().includes(q));
  }
  filtered.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
  const total = filtered.length;
  const pages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  return {
    articles: filtered.slice(offset, offset + limit),
    pagination: { page, limit, total, pages, hasNext: page < pages, hasPrev: page > 1 },
  };
}

export async function getArticleBySlug(slug) {
  const pg = await getPool();
  if (pg) {
    const { rows } = await pg.query(`SELECT * FROM articles WHERE slug = $1 AND status = 'published' LIMIT 1`, [slug]);
    return rows[0] || null;
  }
  const all = await readJson(ARTICLES_FILE);
  return all.find(a => a.slug === slug && (a.status === 'published' || a.published === true)) || null;
}

export async function getRelatedArticles(slug, category, limit = 4) {
  const pg = await getPool();
  if (pg) {
    const { rows } = await pg.query(
      `SELECT id, slug, title, meta_description, category, hero_url, reading_time, published_at
       FROM articles WHERE status = 'published' AND slug != $1 AND category = $2
       ORDER BY published_at DESC NULLS LAST LIMIT $3`,
      [slug, category, limit]
    );
    return rows;
  }
  const all = await readJson(ARTICLES_FILE);
  return all.filter(a => (a.status === 'published' || a.published === true) && a.slug !== slug && a.category === category).slice(0, limit);
}

export async function getCategoryCounts() {
  const pg = await getPool();
  if (pg) {
    const { rows } = await pg.query(
      `SELECT category, COUNT(*) as count FROM articles WHERE status = 'published' GROUP BY category ORDER BY count DESC`
    );
    return rows.map(r => ({ category: r.category, count: parseInt(r.count, 10) }));
  }
  const all = await readJson(ARTICLES_FILE);
  const counts = {};
  for (const a of all) {
    if (a.status === 'published' || a.published === true) counts[a.category] = (counts[a.category] || 0) + 1;
  }
  return Object.entries(counts).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
}

export async function getFeaturedArticles(limit = 6) {
  const pg = await getPool();
  if (pg) {
    const { rows } = await pg.query(
      `SELECT id, slug, title, meta_description, category, hero_url, image_alt, reading_time, published_at
       FROM articles WHERE status = 'published' ORDER BY published_at DESC NULLS LAST LIMIT $1`,
      [limit]
    );
    return rows;
  }
  const all = await readJson(ARTICLES_FILE);
  return all.filter(a => a.status === 'published' || a.published === true).sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0)).slice(0, limit);
}

export async function saveArticle(article) {
  const pg = await getPool();
  if (pg) {
    const { rows } = await pg.query(
      `INSERT INTO articles (slug, title, meta_description, og_title, og_description, category, tags, body, status, hero_url, image_alt, word_count, reading_time, published_at, last_modified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
       ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, meta_description=EXCLUDED.meta_description, body=EXCLUDED.body, status=EXCLUDED.status, hero_url=EXCLUDED.hero_url, word_count=EXCLUDED.word_count, reading_time=EXCLUDED.reading_time, last_modified_at=NOW()
       RETURNING *`,
      [article.slug, article.title, article.meta_description, article.og_title || article.title,
       article.og_description || article.meta_description, article.category, article.tags || [],
       article.body, article.status || 'published', article.hero_url || null, article.image_alt || null,
       article.word_count || 0, article.reading_time || 0, article.published_at || new Date().toISOString()]
    );
    return rows[0];
  }
  const all = await readJson(ARTICLES_FILE);
  const idx = all.findIndex(a => a.slug === article.slug);
  const now = new Date().toISOString();
  if (idx >= 0) { all[idx] = { ...all[idx], ...article, last_modified_at: now }; }
  else { all.push({ id: Date.now(), ...article, created_at: now, last_modified_at: now }); }
  await writeJson(ARTICLES_FILE, all);
  return article;
}

export async function logCron(jobName, status, message = '', durationMs = 0) {
  try {
    const pg = await getPool();
    if (!pg) return;
    await pg.query(
      `INSERT INTO cron_log (job_name, status, message, duration_ms) VALUES ($1, $2, $3, $4)`,
      [jobName, status, message, durationMs]
    );
  } catch { /* non-fatal */ }
}
