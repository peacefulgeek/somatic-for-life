import express from 'express';
import { getArticles, getArticleBySlug, getRelatedArticles, getCategoryCounts, getFeaturedArticles } from '../../src/lib/db.mjs';

export const articlesRouter = express.Router();

// GET /api/articles — list published articles with pagination
articlesRouter.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const category = (req.query.category as string) || '';
    const search = (req.query.search as string) || '';
    const result = await getArticles({ page, limit, category, search });
    res.json(result);
  } catch (err) {
    console.error('[articles] list error:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// GET /api/articles/categories — article counts per category
articlesRouter.get('/categories', async (req, res) => {
  try {
    const rows = await getCategoryCounts();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/articles/popular — most-read articles (by recency as proxy)
articlesRouter.get('/popular', async (req, res) => {
  try {
    const rows = await getFeaturedArticles(5);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch popular articles' });
  }
});

// GET /api/articles/recent — most recently published
articlesRouter.get('/recent', async (req, res) => {
  try {
    const { articles } = await getArticles({ page: 1, limit: 5 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent articles' });
  }
});

// GET /api/articles/:slug — single article
articlesRouter.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await getArticleBySlug(slug);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    const related = await getRelatedArticles(slug, article.category, 4);
    res.json({ article, related });
  } catch (err) {
    console.error('[articles] single error:', err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});
