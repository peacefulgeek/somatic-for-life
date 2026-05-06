#!/usr/bin/env python3
"""
Definitive single-pass merge: 30 originals + all 376 parts → 406 articles.
Sets published=True for all articles with published_at <= today.
"""
import json, os
from pathlib import Path
from datetime import datetime, timedelta

PROJECT = Path('/home/ubuntu/the-body-remembers')
PARTS_DIR = PROJECT / 'data' / 'articles-parts'
OUT_FILE = PROJECT / 'data' / 'articles.json'

now = datetime.now()
today_str = now.strftime('%Y-%m-%d')

# --- Load original 30 articles from the parts-independent source ---
# The originals are the 30 articles that have status=published in the current file
# But since the file may be corrupted, let's load from git's original commit
# Actually, let's just load all parts + the originals from current file
current = json.loads(OUT_FILE.read_text()) if OUT_FILE.exists() else []
originals = [a for a in current if a.get('status') == 'published' and a.get('body')]
print(f'Originals with body: {len(originals)}')

# --- Load all parts ---
parts = []
for f in sorted(PARTS_DIR.glob('*.json')):
    if '.tmp' in f.name: continue
    try:
        a = json.loads(f.read_text())
        if a.get('slug') and a.get('body') and len(a.get('body','')) > 200:
            parts.append(a)
    except Exception as e:
        print(f'  Skip {f.name}: {e}')

print(f'Valid parts: {len(parts)}')

# --- Merge, dedup by slug ---
seen = set()
merged = []

for a in originals:
    if a['slug'] not in seen:
        merged.append(a)
        seen.add(a['slug'])

for a in parts:
    if a['slug'] not in seen:
        merged.append(a)
        seen.add(a['slug'])

print(f'Total unique: {len(merged)}')

# --- Normalize hero_url ---
hero_map = {
    'Trauma Therapy': 'https://somatic-forlife.b-cdn.net/images/hero-trauma-therapy.webp',
    'Nervous System': 'https://somatic-forlife.b-cdn.net/images/hero-nervous-system.webp',
    'Somatic Healing': 'https://somatic-forlife.b-cdn.net/images/hero-somatic-healing.webp',
    'Somatic Practices': 'https://somatic-forlife.b-cdn.net/images/hero-somatic-practices.webp',
    'Body-Mind Connection': 'https://somatic-forlife.b-cdn.net/images/hero-body-mind.webp',
    'Self-Directed': 'https://somatic-forlife.b-cdn.net/images/hero-self-directed.webp',
    'Polyvagal Theory': 'https://somatic-forlife.b-cdn.net/images/hero-polyvagal.webp',
    'Research': 'https://somatic-forlife.b-cdn.net/images/hero-trauma-research.webp',
    'EMDR': 'https://somatic-forlife.b-cdn.net/images/hero-emdr.webp',
    'trauma-therapy': 'https://somatic-forlife.b-cdn.net/images/hero-trauma-therapy.webp',
    'nervous-system': 'https://somatic-forlife.b-cdn.net/images/hero-nervous-system.webp',
    'somatic-healing': 'https://somatic-forlife.b-cdn.net/images/hero-somatic-healing.webp',
    'somatic-practices': 'https://somatic-forlife.b-cdn.net/images/hero-somatic-practices.webp',
    'body-mind': 'https://somatic-forlife.b-cdn.net/images/hero-body-mind.webp',
    'self-directed': 'https://somatic-forlife.b-cdn.net/images/hero-self-directed.webp',
    'polyvagal-theory': 'https://somatic-forlife.b-cdn.net/images/hero-polyvagal.webp',
    'trauma-research': 'https://somatic-forlife.b-cdn.net/images/hero-trauma-research.webp',
    'emdr-therapy': 'https://somatic-forlife.b-cdn.net/images/hero-emdr.webp',
}
default_hero = 'https://somatic-forlife.b-cdn.net/images/hero-somatic-healing.webp'

# --- Date-gate new articles (those without published_at) ---
start_date = now - timedelta(days=30)
per_day = 6
day_count = 0
current_date = start_date

for a in merged:
    # Ensure hero_url
    if not a.get('hero_url'):
        cat = a.get('category', '')
        a['hero_url'] = hero_map.get(cat, default_hero)
    
    # Normalize meta_description
    if not a.get('meta_description'):
        a['meta_description'] = (a.get('metaDescription') or a.get('excerpt') or '')[:160]
    
    # Normalize reading_time
    rt = a.get('readTime') or a.get('reading_time') or '8 min read'
    if isinstance(rt, int):
        rt = f'{rt} min read'
    a['reading_time'] = rt
    
    # Normalize word_count
    if not a.get('word_count') and a.get('body'):
        a['word_count'] = len(a['body'].split())
    
    # Set published_at for ungated articles
    if not a.get('published_at'):
        if day_count >= per_day:
            current_date += timedelta(days=1)
            day_count = 0
        a['published_at'] = current_date.strftime('%Y-%m-%d')
        day_count += 1
    
    # Set published boolean
    pub_at = str(a.get('published_at', ''))[:10]  # take first 10 chars (YYYY-MM-DD)
    if a.get('status') == 'published':
        a['published'] = True
    else:
        a['published'] = pub_at <= today_str if pub_at else False
        a['status'] = 'published' if a['published'] else 'scheduled'

# Sort by published_at desc
merged.sort(key=lambda a: str(a.get('published_at', ''))[:10], reverse=True)

pub_count = sum(1 for a in merged if a.get('published'))
sched_count = sum(1 for a in merged if not a.get('published'))
print(f'Published: {pub_count} | Scheduled: {sched_count}')

# --- Atomic write ---
tmp = str(OUT_FILE) + '.final.tmp'
with open(tmp, 'w') as f:
    json.dump(merged, f, indent=2, ensure_ascii=False)
os.rename(tmp, str(OUT_FILE))

size_mb = os.path.getsize(OUT_FILE) / 1024 / 1024
print(f'✓ Written: {len(merged)} articles, {size_mb:.1f}MB')

# Verify
verify = json.loads(OUT_FILE.read_text())
v_pub = sum(1 for a in verify if a.get('published'))
v_sched = sum(1 for a in verify if not a.get('published'))
print(f'✓ Verified: {len(verify)} total, {v_pub} published, {v_sched} scheduled')
