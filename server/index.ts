import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { articlesRouter } from './routes/articles.js';
import { healthRouter } from './routes/health.js';
import { sitemapRouter } from './routes/sitemap.js';
import { robotsRouter } from './routes/robots.js';
import { llmsRouter } from './routes/llms.js';
import { assessmentsRouter } from './routes/assessments.js';
import supplementsRouter from './routes/supplements.js';
import { ssrHandler } from './ssr.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '10000', 10);

const app = express();

// ─── WWW → apex 301 redirect ──────────────────────────────────────────────
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.startsWith('www.')) {
    const apex = host.slice(4);
    return res.redirect(301, `https://${apex}${req.originalUrl}`);
  }
  next();
});

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Security headers ─────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ─── Static assets (Vite build output) ───────────────────────────────────
if (isProd) {
  const clientDist = path.resolve(process.cwd(), 'dist/client');
  app.use('/assets', express.static(path.join(clientDist, 'assets'), {
    maxAge: '1y',
    immutable: true,
  }));
  // Serve hero images
  app.use('/images', express.static(path.join(clientDist, 'images'), {
    maxAge: '7d',
  }));
}

// ─── API & special routes ─────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/supplements', supplementsRouter);
app.use('/sitemap.xml', sitemapRouter);
app.use('/robots.txt', robotsRouter);
app.use('/', llmsRouter);

// ─── SSR catch-all ────────────────────────────────────────────────────────
app.get('/{*path}', ssrHandler);

// ─── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Somatic For Life running on port ${PORT} (${isProd ? 'production' : 'development'})`);
});

export default app;
