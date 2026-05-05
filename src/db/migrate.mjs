/**
 * Database migration + seed script.
 * Run: node src/db/migrate.mjs
 * Idempotent — safe to run multiple times.
 */
import { query, pool } from '../lib/db.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log('[migrate] Running schema...');

  const schema = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');

  // Split on semicolons and run each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await query(stmt);
    } catch (err) {
      if (err.message.includes('already exists')) {
        // Idempotent — ignore
      } else {
        console.error('[migrate] Error:', err.message);
        console.error('[migrate] Statement:', stmt.slice(0, 100));
      }
    }
  }

  console.log('[migrate] Schema applied.');

  // Seed product catalog
  console.log('[migrate] Seeding product catalog...');
  const catalogRaw = await fs.readFile(path.join(__dirname, '../data/product-catalog.json'), 'utf8');
  const catalog = JSON.parse(catalogRaw);

  for (const p of catalog) {
    try {
      await query(
        `INSERT INTO products (asin, name, category, tags, type, author, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         ON CONFLICT (asin) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           tags = EXCLUDED.tags,
           type = EXCLUDED.type,
           author = EXCLUDED.author`,
        [p.asin, p.name, p.category, p.tags || [], p.type || 'book', p.author || null]
      );
    } catch (err) {
      console.error(`[migrate] Product seed error for ${p.asin}:`, err.message);
    }
  }

  console.log(`[migrate] Seeded ${catalog.length} products.`);
  console.log('[migrate] Done.');

  await pool.end();
}

migrate().catch(err => {
  console.error('[migrate] Fatal:', err);
  process.exit(1);
});
