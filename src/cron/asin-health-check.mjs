/**
 * Cron #5 — ASIN health check (Sundays 05:00 UTC).
 * Verifies every embedded ASIN, marks dead ones, swaps across published articles.
 */
import { verifyAsinBatch } from '../lib/amazon-verify.mjs';
import { query } from '../lib/db.mjs';
import { matchProducts } from '../lib/match-products.mjs';
import { buildAmazonUrl, countAmazonLinks, extractAsinsFromText } from '../lib/amazon-verify.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.resolve(__dirname, '../data/verified-asins.json');

export async function runAsinHealthCheck() {
  console.log('[asin-health-check] Starting weekly sweep');

  let cache;
  try {
    cache = JSON.parse(await fs.readFile(CACHE_PATH, 'utf8'));
  } catch {
    cache = { version: 1, lastUpdated: null, asins: {}, failed: {} };
  }

  const asins = Object.keys(cache.asins);
  if (asins.length === 0) {
    console.log('[asin-health-check] Empty catalog — nothing to check');
    return { checked: 0, invalidated: 0 };
  }

  const results = await verifyAsinBatch(asins, {
    delayMs: 2500,
    onProgress: (done, total) => {
      if (done % 10 === 0) console.log(`[asin-health-check] ${done}/${total}`);
    },
  });

  const now = new Date().toISOString();
  let invalidated = 0;
  const deadAsins = [];

  for (const r of results) {
    const existing = cache.asins[r.asin];
    if (r.valid) {
      if (existing) {
        existing.lastChecked = now;
        existing.status = 'valid';
        if (r.title) existing.title = r.title;
      }
    } else {
      deadAsins.push(r.asin);
      delete cache.asins[r.asin];
      cache.failed[r.asin] = {
        reason: r.reason,
        lastAttempted: now,
        attempts: (cache.failed[r.asin]?.attempts || 0) + 1,
      };
      invalidated++;
      console.warn(`[asin-health-check] INVALIDATED ${r.asin}: ${r.reason}`);
    }
  }

  cache.lastUpdated = now;
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));

  console.log(`[asin-health-check] Done. checked=${asins.length} invalidated=${invalidated}`);
  return { checked: asins.length, invalidated };
}
