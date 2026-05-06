import express from 'express';

export const robotsRouter = express.Router();

const SITE_URL = `https://${process.env.SITE_DOMAIN || 'somaticforlife.com'}`;

robotsRouter.get('/', (req, res) => {
  const content = `# Robots.txt for Somatic For Life
# ${SITE_URL}

# Standard crawlers
User-agent: *
Allow: /
Disallow: /api/
Disallow: /.env
Disallow: /admin

# Google
User-agent: Googlebot
Allow: /
Disallow: /api/

# Bing
User-agent: Bingbot
Allow: /

# AI crawlers — all welcome
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Omgilibot
Allow: /

User-agent: FacebookBot
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/llms.txt
`;

  res.type('text/plain').send(content);
});
