import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const articles = JSON.parse(readFileSync(join(__dirname, '../data/articles.json'), 'utf8'));

function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

let under1800 = [];
let total = 0;
let minWords = Infinity;
let maxWords = 0;
let sumWords = 0;

for (const a of articles) {
  const body = a.body || a.content || '';
  const wc = wordCount(body);
  total++;
  sumWords += wc;
  if (wc < minWords) minWords = wc;
  if (wc > maxWords) maxWords = wc;
  if (wc < 1800) {
    under1800.push({ slug: a.slug, title: a.title, words: wc });
  }
}

console.log(`Total articles: ${total}`);
console.log(`Min words: ${minWords}`);
console.log(`Max words: ${maxWords}`);
console.log(`Avg words: ${Math.round(sumWords / total)}`);
console.log(`Under 1800 words: ${under1800.length}`);
if (under1800.length > 0) {
  console.log('\nArticles under 1800 words:');
  for (const a of under1800) {
    console.log(`  [${a.words}] ${a.slug}`);
  }
}
