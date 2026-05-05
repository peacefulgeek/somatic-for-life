/**
 * esbuild config for server bundle.
 * Compiles server/index.ts + all server routes into dist/index.js.
 */
import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

await build({
  entryPoints: [path.join(root, 'server/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: path.join(root, 'dist/index.js'),
  external: [
    // Node built-ins
    'fs', 'path', 'url', 'crypto', 'stream', 'http', 'https', 'net', 'os',
    'child_process', 'events', 'util', 'buffer', 'querystring', 'zlib',
    // npm packages (resolved at runtime from node_modules)
    'express', 'compression', 'serve-static', 'pg', 'openai', 'node-cron',
    'react', 'react-dom', 'react-router-dom',
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  logLevel: 'info',
  sourcemap: false,
  minify: false,
  banner: {
    js: '// The Body Remembers — Server Bundle',
  },
});

console.log('[build-server] Server bundle written to dist/index.js');
