import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DATA_FILE = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'assessments.json')
  : path.resolve(process.cwd(), 'data/assessments.json');

export const assessmentsRouter = express.Router();

function loadAssessments() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// GET /api/assessments — list all assessments (summary only, no questions)
assessmentsRouter.get('/', (req, res) => {
  const all = loadAssessments();
  const summaries = all.map((a: any) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    icon: a.icon,
    time_minutes: a.time_minutes,
    question_count: a.question_count,
    category: a.category,
    related_article: a.related_article,
  }));
  res.json(summaries);
});

// GET /api/assessments/:slug — full assessment with questions
assessmentsRouter.get('/:slug', (req, res) => {
  const all = loadAssessments();
  const assessment = all.find((a: any) => a.slug === req.params.slug || a.id === req.params.slug);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
  res.json(assessment);
});
