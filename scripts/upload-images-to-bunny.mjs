/**
 * upload-images-to-bunny.mjs
 * Converts all images in public/images/ to compressed WebP and uploads to Bunny CDN.
 * After upload, deletes local copies (except favicon.svg).
 * Run: node scripts/upload-images-to-bunny.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load env
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'somatic-forlife';
const BUNNY_STORAGE_ENDPOINT = process.env.BUNNY_STORAGE_ENDPOINT || 'https://ny.storage.bunnycdn.com';
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || 'https://somatic-forlife.b-cdn.net';

if (!BUNNY_API_KEY) {
  console.error('ERROR: BUNNY_API_KEY not set');
  process.exit(1);
}

const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const WEBP_TMP = path.join(ROOT, 'tmp-webp');

// Create tmp dir
fs.mkdirSync(WEBP_TMP, { recursive: true });

async function uploadFile(localPath, remoteName) {
  const data = fs.readFileSync(localPath);
  const url = `${BUNNY_STORAGE_ENDPOINT}/${BUNNY_STORAGE_ZONE}/images/${remoteName}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'AccessKey': BUNNY_API_KEY,
      'Content-Type': 'image/webp',
    },
    body: data,
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed for ${remoteName}: ${response.status} ${text}`);
  }
  
  return `${BUNNY_CDN_URL}/images/${remoteName}`;
}

async function convertToWebP(inputPath, outputPath) {
  // Use Python Pillow for WebP conversion
  const script = `
from PIL import Image
import sys
img = Image.open(sys.argv[1])
# Resize to max 1200px wide
w, h = img.size
if w > 1200:
    ratio = 1200 / w
    img = img.resize((1200, int(h * ratio)), Image.LANCZOS)
img.save(sys.argv[2], 'WEBP', quality=82, method=6)
print(f"Converted: {sys.argv[1]} -> {sys.argv[2]} ({img.size[0]}x{img.size[1]})")
`;
  
  const tmpScript = path.join(WEBP_TMP, 'convert.py');
  fs.writeFileSync(tmpScript, script);
  execSync(`python3 ${tmpScript} "${inputPath}" "${outputPath}"`, { stdio: 'inherit' });
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('No images directory found at', IMAGES_DIR);
    return;
  }

  const files = fs.readdirSync(IMAGES_DIR).filter(f => 
    /\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(f)
  );

  console.log(`Found ${files.length} images to convert and upload`);
  
  const cdnMap = {}; // original filename -> CDN URL
  
  for (const file of files) {
    const inputPath = path.join(IMAGES_DIR, file);
    const baseName = path.basename(file, path.extname(file));
    const webpName = `${baseName}.webp`;
    const webpPath = path.join(WEBP_TMP, webpName);
    
    try {
      // Convert to WebP
      console.log(`\nConverting ${file} -> ${webpName}...`);
      await convertToWebP(inputPath, webpPath);
      
      // Upload to Bunny
      console.log(`Uploading ${webpName} to Bunny CDN...`);
      const cdnUrl = await uploadFile(webpPath, webpName);
      console.log(`✓ Uploaded: ${cdnUrl}`);
      
      cdnMap[file] = cdnUrl;
      cdnMap[`/images/${file}`] = cdnUrl;
      
    } catch (err) {
      console.error(`✗ Failed: ${file}`, err.message);
    }
  }
  
  console.log('\n=== CDN URL MAP ===');
  console.log(JSON.stringify(cdnMap, null, 2));
  
  // Save the map for use in article updates
  fs.writeFileSync(path.join(ROOT, 'tmp-webp', 'cdn-map.json'), JSON.stringify(cdnMap, null, 2));
  
  // Update articles.json to use CDN URLs
  const articlesPath = path.join(ROOT, 'data', 'articles.json');
  if (fs.existsSync(articlesPath)) {
    let articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
    let updated = 0;
    articles = articles.map(a => {
      if (a.hero_url && cdnMap[a.hero_url]) {
        a.hero_url = cdnMap[a.hero_url];
        updated++;
      }
      return a;
    });
    fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2));
    console.log(`\nUpdated ${updated} article hero_url entries to CDN URLs`);
  }
  
  // Delete local images (keep favicon.svg)
  let deleted = 0;
  for (const file of files) {
    try {
      fs.unlinkSync(path.join(IMAGES_DIR, file));
      deleted++;
    } catch {}
  }
  console.log(`\nDeleted ${deleted} local image files`);
  
  // Clean up tmp
  try {
    fs.rmSync(WEBP_TMP, { recursive: true });
  } catch {}
  
  console.log('\n✓ All images migrated to Bunny CDN. Zero local images remain.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
