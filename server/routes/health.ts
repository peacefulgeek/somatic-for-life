import express from 'express';
import { query } from '../../src/lib/db.mjs';

export const healthRouter = express.Router();

healthRouter.get('/', async (req, res) => {
  const start = Date.now();
  try {
    await query('SELECT 1');
    res.json({
      status: 'ok',
      db: 'ok',
      uptime: process.uptime(),
      responseTime: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // DB failure is non-fatal for health check — site can serve cached content
    res.json({
      status: 'ok',
      db: 'unavailable',
      uptime: process.uptime(),
      responseTime: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  }
});
