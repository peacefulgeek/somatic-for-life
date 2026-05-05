/**
 * Cron #4 — Quarterly refresh (Jan/Apr/Jul/Oct 1st at 04:00 UTC).
 * Revises 20 articles: update stats, add new section.
 */
import { query } from '../lib/db.mjs';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com',
});
const MODEL = process.env.OPENAI_MODEL || 'deepseek-chat';
const TODAY = new Date().toISOString().split('T')[0];

export async function refreshQuarterly() {
  console.log('[refresh-quarterly] Starting quarterly refresh');

  const { rows: articles } = await query(
    `SELECT id, slug, title, body, category FROM articles
     WHERE status = 'published'
     ORDER BY last_modified_at ASC NULLS FIRST
     LIMIT 20`
  );

  let refreshed = 0;
  for (const article of articles) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: [{
          role: 'user',
          content: `You are The Oracle Lover. Do a quarterly update on this article about "${article.title}".

Tasks:
1. Add a new H2 section (~200 words) with updated information or a new angle
2. Update any statistics or research references to be current
3. Update the author byline date to ${TODAY}
4. NO em-dashes (—) (–). Zero tolerance.
5. Keep the TL;DR block but update it to reflect any new content
6. Return the complete revised article HTML.

ARTICLE:
${article.body.slice(0, 3000)}...`,
        }],
        temperature: 0.7,
        max_tokens: 4500,
      });

      const newBody = response.choices[0]?.message?.content || '';
      if (newBody.length > 500) {
        const updatedBody = newBody.replace(
          /datetime="\d{4}-\d{2}-\d{2}"/,
          `datetime="${TODAY}"`
        );
        await query(
          `UPDATE articles SET body = $1, last_modified_at = NOW() WHERE id = $2`,
          [updatedBody, article.id]
        );
        refreshed++;
        console.log(`[refresh-quarterly] Refreshed: ${article.slug}`);
      }
    } catch (err) {
      console.error(`[refresh-quarterly] Error refreshing ${article.slug}:`, err.message);
    }
  }

  console.log(`[refresh-quarterly] Done. Refreshed ${refreshed}/${articles.length} articles`);
  return { refreshed };
}
