import { Router } from 'express';
import { readFileSync } from 'fs';
import path from 'path';

const router = Router();

let supplementsCache: any = null;

function getSupplements() {
  if (supplementsCache) return supplementsCache;
  try {
    const filePath = path.join(process.cwd(), 'data', 'supplements.json');
    supplementsCache = JSON.parse(readFileSync(filePath, 'utf8'));
    return supplementsCache;
  } catch (e) {
    return { categories: [], items: [] };
  }
}

// GET /api/supplements - all supplements data
router.get('/', (req, res) => {
  const data = getSupplements();
  const { category, evidence, q, limit } = req.query as Record<string, string>;

  let items = data.items || [];

  if (category && category !== 'all') {
    items = items.filter((i: any) => i.category === category);
  }
  if (evidence && evidence !== 'all') {
    items = items.filter((i: any) => i.evidence === evidence);
  }
  if (q) {
    const query = q.toLowerCase();
    items = items.filter((i: any) =>
      i.name.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query) ||
      (i.benefits || []).some((b: string) => b.toLowerCase().includes(query))
    );
  }
  if (limit) {
    items = items.slice(0, parseInt(limit));
  }

  res.json({
    categories: data.categories,
    items,
    total: items.length,
  });
});

// GET /api/supplements/:id - single supplement
router.get('/:id', (req, res) => {
  const data = getSupplements();
  const item = (data.items || []).find((i: any) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

export default router;
