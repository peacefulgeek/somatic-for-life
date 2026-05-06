import { readFileSync, writeFileSync } from 'fs';

const topics = JSON.parse(readFileSync('./src/data/seed-topics-500.json', 'utf8'));
const existing = JSON.parse(readFileSync('/tmp/existing-slugs.json', 'utf8'));
const existingSet = new Set(existing);

function toSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/, '');
}

const remaining = topics.filter(t => !existingSet.has(toSlug(t.title)));
console.log('Total topics:', topics.length);
console.log('Already generated:', topics.length - remaining.length);
console.log('Remaining to generate:', remaining.length);

writeFileSync('/tmp/remaining-topics.json', JSON.stringify(remaining, null, 2));
console.log('Saved remaining topics to /tmp/remaining-topics.json');

// Show first 5
console.log('\nFirst 5 remaining:');
remaining.slice(0, 5).forEach(t => console.log(' -', t.title));
