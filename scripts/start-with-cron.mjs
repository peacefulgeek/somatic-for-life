/**
 * Production entry point for Somatic For Life.
 * Starts the Express server as a child process and registers all cron schedules.
 * NO setTimeout for long intervals — cron expressions only (Section 8A).
 */
process.env.NODE_ENV = 'production';
import cron from 'node-cron';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ─── Start web server as child process ───────────────────────────────────
const server = spawn('node', ['dist/index.js'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' },
});

server.on('exit', (code) => {
  console.log(`[start-with-cron] Server exited with code ${code}`);
  process.exit(code ?? 0);
});

// ─── Register cron schedules ──────────────────────────────────────────────
const AUTO_GEN = process.env.AUTO_GEN_ENABLED === 'true';

if (!AUTO_GEN) {
  console.log('[start-with-cron] AUTO_GEN_ENABLED not "true" — cron disabled');
} else {
  try {
    const [genMod, spotMod, rmMod, rqMod, ahcMod] = await Promise.all([
      import('../src/cron/generate-article.mjs'),
      import('../src/cron/product-spotlight.mjs'),
      import('../src/cron/refresh-monthly.mjs'),
      import('../src/cron/refresh-quarterly.mjs'),
      import('../src/cron/asin-health-check.mjs'),
    ]);

    // ─── 1. ARTICLE PUBLISHER — phase-aware, queue-first ─────────────────
    // Phase 1 (published_count < 60): 5 fires/day, every day
    cron.schedule('0 7,10,13,16,19 * * *', async () => {
      console.log(`[cron] generate-article (phase-1 slot) ${new Date().toISOString()}`);
      try { await genMod.generateOrReleaseArticle({ allowedPhase: 1 }); }
      catch (e) { console.error('[cron] generate-article phase-1 failed:', e); }
    }, { timezone: 'UTC' });

    // Phase 2 (published_count >= 60): 1 fire/weekday at 08:00 UTC
    cron.schedule('0 8 * * 1-5', async () => {
      console.log(`[cron] generate-article (phase-2 slot) ${new Date().toISOString()}`);
      try { await genMod.generateOrReleaseArticle({ allowedPhase: 2 }); }
      catch (e) { console.error('[cron] generate-article phase-2 failed:', e); }
    }, { timezone: 'UTC' });

    // ─── 2. PRODUCT SPOTLIGHT — Saturday 08:00 UTC ────────────────────────
    cron.schedule('0 8 * * 6', async () => {
      console.log(`[cron] product-spotlight ${new Date().toISOString()}`);
      try { await spotMod.generateProductSpotlight(); }
      catch (e) { console.error('[cron] product-spotlight failed:', e); }
    }, { timezone: 'UTC' });

    // ─── 3. MONTHLY REFRESH — 1st of month 03:00 UTC ─────────────────────
    cron.schedule('0 3 1 * *', async () => {
      console.log(`[cron] refresh-monthly ${new Date().toISOString()}`);
      try { await rmMod.refreshMonthly(); }
      catch (e) { console.error('[cron] refresh-monthly failed:', e); }
    }, { timezone: 'UTC' });

    // ─── 4. QUARTERLY REFRESH — Jan/Apr/Jul/Oct 1st at 04:00 UTC ─────────
    cron.schedule('0 4 1 1,4,7,10 *', async () => {
      console.log(`[cron] refresh-quarterly ${new Date().toISOString()}`);
      try { await rqMod.refreshQuarterly(); }
      catch (e) { console.error('[cron] refresh-quarterly failed:', e); }
    }, { timezone: 'UTC' });

    // ─── 5. ASIN HEALTH CHECK — Sundays 05:00 UTC ────────────────────────
    cron.schedule('0 5 * * 0', async () => {
      console.log(`[cron] asin-health-check ${new Date().toISOString()}`);
      try { await ahcMod.runAsinHealthCheck(); }
      catch (e) { console.error('[cron] asin-health-check failed:', e); }
    }, { timezone: 'UTC' });

    console.log('[start-with-cron] All cron schedules registered (AUTO_GEN_ENABLED=true)');
  } catch (err) {
    console.error('[start-with-cron] Cron registration failed:', err);
    // Server continues to run even if cron fails — never crash the web service
  }
}

const shutdown = (sig) => {
  console.log(`[start-with-cron] ${sig} received, shutting down`);
  server.kill(sig);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
