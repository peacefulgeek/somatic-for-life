import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const isProd = process.env.NODE_ENV === 'production';

const SITE_NAME = 'The Body Remembers';
const SITE_URL = `https://${process.env.SITE_DOMAIN || 'thebodyremembers.com'}`;
const SITE_DESCRIPTION = 'The research-grounded resource for body-based trauma healing, somatic therapy, and nervous system regulation.';

function buildHead({
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  canonical = '',
  ogImage = '',
  ogType = 'website',
  jsonLd = '',
}: {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: string;
}) {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  return `
    <title>${fullTitle}</title>
    <meta name="description" content="${description.replace(/"/g, '&quot;')}" />
    <link rel="canonical" href="${canonical || SITE_URL}" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${canonical || SITE_URL}" />
    ${ogImage ? `<meta property="og:image" content="${ogImage}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${fullTitle}" />
    <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}" />
    ${ogImage ? `<meta name="twitter:image" content="${ogImage}" />` : ''}
    ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}
  `.trim();
}

// Cache the manifest in production
let _manifestCache: Record<string, any> | null = null;

function getManifest(): Record<string, any> | null {
  if (_manifestCache) return _manifestCache;
  // Resolve relative to CWD (project root) since the bundle's __dirname is unreliable
  const candidates = [
    path.resolve(process.cwd(), 'dist/client/.vite/manifest.json'),
    path.resolve(process.cwd(), 'dist/client/manifest.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        _manifestCache = JSON.parse(fs.readFileSync(p, 'utf8'));
        return _manifestCache;
      } catch { /* continue */ }
    }
  }
  return null;
}

function getViteAssets(): { scripts: string; styles: string } {
  if (!isProd) {
    return {
      scripts: `<script type="module" src="http://localhost:5173/@vite/client"></script>
                <script type="module" src="http://localhost:5173/src/client/entry-client.tsx"></script>`,
      styles: '',
    };
  }

  const manifest = getManifest();
  if (!manifest) {
    // Fallback: scan the assets directory for known file patterns
    const assetsDir = path.resolve(process.cwd(), 'dist/client/assets');
    try {
      const files = fs.readdirSync(assetsDir);
      const jsFile = files.find(f => f.startsWith('entry-client') && f.endsWith('.js'));
      const cssFile = files.find(f => f.startsWith('entry-client') && f.endsWith('.css'));
      const vendorFile = files.find(f => f.startsWith('vendor') && f.endsWith('.js'));
      const runtimeFile = files.find(f => f.startsWith('rolldown-runtime') && f.endsWith('.js'));
      const scripts = [
        runtimeFile ? `<script type="module" src="/assets/${runtimeFile}"></script>` : '',
        vendorFile ? `<script type="module" src="/assets/${vendorFile}"></script>` : '',
        jsFile ? `<script type="module" src="/assets/${jsFile}"></script>` : '',
      ].filter(Boolean).join('\n  ');
      const styles = cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : '';
      return { scripts, styles };
    } catch {
      return { scripts: '', styles: '' };
    }
  }

  const entry = manifest['src/client/entry-client.tsx'];
  if (!entry) return { scripts: '', styles: '' };

  // Collect all imports recursively
  const allImports: string[] = [];
  function collectImports(key: string) {
    const m = manifest[key];
    if (!m) return;
    if (m.imports) {
      for (const imp of m.imports) {
        if (!allImports.includes(imp)) {
          allImports.push(imp);
          collectImports(imp);
        }
      }
    }
  }
  collectImports('src/client/entry-client.tsx');

  const scripts = [
    ...allImports.map(k => manifest[k]?.file ? `<script type="module" src="/${manifest[k].file}"></script>` : ''),
    `<script type="module" src="/${entry.file}"></script>`,
  ].filter(Boolean).join('\n  ');

  const styles = (entry.css || []).map((c: string) => `<link rel="stylesheet" href="/${c}" />`).join('\n  ');

  return { scripts, styles };
}

export function ssrHandler(req: Request, res: Response) {
  const { scripts, styles } = getViteAssets();
  const canonical = `${SITE_URL}${req.path}`;

  const headMeta = buildHead({ canonical });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${headMeta}
  ${styles}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="preconnect" href="https://the-body-remembers.b-cdn.net" />
</head>
<body>
  <div id="root"></div>
  ${scripts}
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
