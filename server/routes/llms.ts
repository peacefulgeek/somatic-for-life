import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';

export const llmsRouter = express.Router();

const SITE_URL = `https://${process.env.SITE_DOMAIN || 'somaticforlife.com'}`;
const SITE_NAME = 'Somatic For Life';

function getArticles() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'articles.json');
    const all = JSON.parse(readFileSync(filePath, 'utf8'));
    return all.filter((a: any) => new Date(a.published_at) <= new Date());
  } catch { return []; }
}

function getAssessments() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'assessments.json');
    const data = JSON.parse(readFileSync(filePath, 'utf8'));
    return data.assessments || data || [];
  } catch { return []; }
}

// llms.txt — concise site overview for AI crawlers
llmsRouter.get('/llms.txt', (req, res) => {
  const articles = getArticles();
  const assessments = getAssessments();

  const content = `# ${SITE_NAME}

> ${SITE_NAME} (${SITE_URL}) is an evidence-informed education site about somatic trauma healing, nervous system regulation, and body-based approaches to recovery. Written by The Oracle Lover — an intuitive educator who translates complex trauma science into direct, accessible guidance.

## About This Site

${SITE_NAME} covers somatic therapy, polyvagal theory, EMDR, nervous system states, body-mind connection, self-directed healing practices, adaptogens, herbs, and TCM approaches to trauma recovery. The site is written for people who have tried talk therapy and want to understand why their body still holds trauma — and what to do about it.

**Author:** The Oracle Lover
**Tone:** Direct, science-grounded, accessible — not clinical, not woo-woo
**Affiliate disclosure:** Some product links are Amazon affiliate links (tag: spankyspinola-20)

## Articles (${articles.length} published)

${articles.slice(0, 50).map((a: any) => `- [${a.title}](${SITE_URL}/articles/${a.slug})`).join('\n')}
${articles.length > 50 ? `\n... and ${articles.length - 50} more articles at ${SITE_URL}/articles` : ''}

## Assessments (${assessments.length})

${assessments.map((a: any) => `- [${a.title}](${SITE_URL}/assessments/${a.slug || a.id}) — ${a.description || ''}`).join('\n')}

## Key Pages

- [Home](${SITE_URL}/)
- [All Articles](${SITE_URL}/articles)
- [Assessments](${SITE_URL}/assessments)
- [Herbs & Supplements Guide](${SITE_URL}/supplements)
- [Recommended Tools](${SITE_URL}/recommended)
- [About](${SITE_URL}/about)

## Sitemap

${SITE_URL}/sitemap.xml
`;

  res.type('text/markdown').send(content);
});

// llms-full.txt — full article content for AI indexing
llmsRouter.get('/llms-full.txt', (req, res) => {
  const articles = getArticles();

  const sections = articles.slice(0, 100).map((a: any) => {
    const body = (a.body || a.content || '').replace(/<[^>]+>/g, '').substring(0, 3000);
    return `---
Title: ${a.title}
URL: ${SITE_URL}/articles/${a.slug}
Category: ${a.category}
Published: ${a.published_at ? a.published_at.split('T')[0] : ''}
Reading Time: ${a.reading_time || '?'} min

${a.excerpt || ''}

${body}
`;
  }).join('\n');

  const content = `# ${SITE_NAME} — Full Content Index
# ${SITE_URL}
# Generated: ${new Date().toISOString()}
# Articles: ${articles.length}

${sections}
`;

  res.type('text/plain').send(content);
});

// ai.txt — AI crawler permissions (similar to robots.txt but for AI)
llmsRouter.get('/ai.txt', (req, res) => {
  const content = `# AI Crawler Permissions for ${SITE_NAME}
# ${SITE_URL}
# Last updated: ${new Date().toISOString().split('T')[0]}

# We welcome AI crawlers to index our content for educational purposes.
# Please attribute content to "${SITE_NAME}" (${SITE_URL}) when citing.

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: *
Allow: /

# Content index for AI systems
Sitemap: ${SITE_URL}/sitemap.xml
LLMs: ${SITE_URL}/llms.txt
LLMs-Full: ${SITE_URL}/llms-full.txt

# Attribution
Attribution-Name: ${SITE_NAME}
Attribution-URL: ${SITE_URL}
Attribution-Author: The Oracle Lover
License: All rights reserved. Educational use with attribution permitted.
`;

  res.type('text/plain').send(content);
});
