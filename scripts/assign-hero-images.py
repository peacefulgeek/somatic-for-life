#!/usr/bin/env python3
"""Assign CDN hero images to all articles that don't have one, based on category."""
import json, os, random

ARTICLES_FILE = '/home/ubuntu/the-body-remembers/data/articles.json'
CDN = 'https://somatic-forlife.b-cdn.net'

# Category -> list of CDN images (best fit first)
CATEGORY_IMAGES = {
    'trauma-therapy': [
        f'{CDN}/hero-trauma-therapy.webp',
        f'{CDN}/hero-somatic-healing.webp',
        f'{CDN}/hero-body-mind.webp',
    ],
    'nervous-system': [
        f'{CDN}/hero-nervous-system.webp',
        f'{CDN}/hero-polyvagal.webp',
        f'{CDN}/hero-somatic-healing.webp',
    ],
    'somatic-healing': [
        f'{CDN}/hero-somatic-healing.webp',
        f'{CDN}/hero-somatic-practices.webp',
        f'{CDN}/hero-body-mind.webp',
    ],
    'somatic-practices': [
        f'{CDN}/hero-somatic-practices.webp',
        f'{CDN}/hero-somatic-healing.webp',
        f'{CDN}/hero-self-directed.webp',
    ],
    'body-mind': [
        f'{CDN}/hero-body-mind.webp',
        f'{CDN}/hero-somatic-healing.webp',
        f'{CDN}/hero-nervous-system.webp',
    ],
    'self-directed': [
        f'{CDN}/hero-self-directed.webp',
        f'{CDN}/hero-somatic-practices.webp',
        f'{CDN}/hero-somatic-healing.webp',
    ],
    'polyvagal-theory': [
        f'{CDN}/hero-polyvagal.webp',
        f'{CDN}/hero-nervous-system.webp',
        f'{CDN}/hero-trauma-research.webp',
    ],
    'trauma-research': [
        f'{CDN}/hero-trauma-research.webp',
        f'{CDN}/hero-polyvagal.webp',
        f'{CDN}/hero-nervous-system.webp',
    ],
    'emdr-therapy': [
        f'{CDN}/hero-emdr.webp',
        f'{CDN}/hero-trauma-therapy.webp',
        f'{CDN}/hero-trauma-research.webp',
    ],
}

DEFAULT_IMAGES = [
    f'{CDN}/hero-somatic-healing.webp',
    f'{CDN}/hero-nervous-system.webp',
    f'{CDN}/hero-trauma-therapy.webp',
    f'{CDN}/hero-body-mind.webp',
    f'{CDN}/hero-somatic-practices.webp',
]

articles = json.load(open(ARTICLES_FILE))
updated = 0

# Use a rotating index per category for variety
category_idx = {}

for a in articles:
    if a.get('hero_url') and 'b-cdn.net' in str(a.get('hero_url', '')):
        continue  # already has CDN image
    
    cat = a.get('category', 'somatic-healing')
    images = CATEGORY_IMAGES.get(cat, DEFAULT_IMAGES)
    
    # Rotate through images for variety
    idx = category_idx.get(cat, 0)
    a['hero_url'] = images[idx % len(images)]
    category_idx[cat] = idx + 1
    
    # Set image_alt if missing
    if not a.get('image_alt'):
        a['image_alt'] = f"{a.get('title', 'Somatic healing')} - Somatic For Life"
    
    updated += 1

print(f'Updated {updated} articles with CDN hero images')

# Atomic write
tmp = ARTICLES_FILE + '.img.tmp'
with open(tmp, 'w') as f:
    json.dump(articles, f, indent=2, ensure_ascii=False)
os.rename(tmp, ARTICLES_FILE)

# Verify
verify = json.load(open(ARTICLES_FILE))
with_img = sum(1 for a in verify if a.get('hero_url'))
print(f'✓ {with_img}/{len(verify)} articles now have hero images')
