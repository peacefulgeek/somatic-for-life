/**
 * Cron #3 — Monthly refresh (1st of month 03:00 UTC).
 * Revises 25 articles: expand 1 paragraph + humanize.
 */
import { query } from '../lib/db.mjs';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com',
});
const MODEL = process.env.OPENAI_MODEL || 'deepseek-chat';
const TODAY = new Date().toISOString().split('T')[0];

export async function refreshMonthly() {
  console.log('[refresh-monthly] Starting monthly refresh');

  const { rows: articles } = await query(
    `SELECT id, slug, title, body, category FROM articles
     WHERE status = 'published'
     ORDER BY last_modified_at ASC NULLS FIRST
     LIMIT 25`
  );

  let refreshed = 0;
  for (const article of articles) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: [{
          role: 'user',
          content: `You are The Oracle Lover. Revise this article about "${article.title}" for somatic trauma healing.

Tasks:
1. Expand one paragraph with a new specific detail or research finding (add ~100 words)
2. Humanize: add more contractions, vary sentence lengths, add one conversational interjection
3. Update the author byline date to ${TODAY}
4. NO em-dashes (—) (–). Zero tolerance.
5. Do not change the TL;DR block.
6. Return the complete revised article HTML.

ARTICLE:
${article.body.slice(0, 3000)}...`,
        }],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const newBody = response.choices[0]?.message?.content || '';
      if (newBody.length > 500) {
        // Update byline date
        const updatedBody = newBody.replace(
          /datetime="\d{4}-\d{2}-\d{2}"/,
          `datetime="${TODAY}"`
        );
        await query(
          `UPDATE articles SET body = $1, last_modified_at = NOW() WHERE id = $2`,
          [updatedBody, article.id]
        );
        refreshed++;
        console.log(`[refresh-monthly] Refreshed: ${article.slug}`);
      }
    } catch (err) {
      console.error(`[refresh-monthly] Error refreshing ${article.slug}:`, err.message);
    }
  }

  console.log(`[refresh-monthly] Done. Refreshed ${refreshed}/${articles.length} articles`);
  return { refreshed };
}
