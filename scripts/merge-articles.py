#!/usr/bin/env python3
"""
Clean merge of original articles + all generated parts.
Applies date-gating and normalizes all fields.
"""
import json
import os
from pathlib import Path
from datetime import datetime, timedelta

PROJECT_DIR = Path("/home/ubuntu/the-body-remembers")
ARTICLES_FILE = PROJECT_DIR / "data" / "articles.json"
PARTS_DIR = PROJECT_DIR / "data" / "articles-parts"
BACKUP_FILE = PROJECT_DIR / "data" / "articles-backup.json"

def normalize_article(a, idx):
    """Normalize article fields to a consistent format."""
    # Handle both old format (meta_description) and new format (metaDescription/excerpt)
    meta_desc = a.get('meta_description') or a.get('metaDescription') or a.get('excerpt') or ''
    title = a.get('title', '')
    slug = a.get('slug', '')
    category = a.get('category', 'Somatic Healing')
    
    # Normalize body field
    body = a.get('body', '')
    
    # Normalize hero_url
    hero_url = a.get('hero_url', '')
    if not hero_url:
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
        }
        hero_url = hero_map.get(category, hero_map['Somatic Healing'])
    
    # Normalize FAQs
    faqs = a.get('faqs', [])
    if not faqs and a.get('faq'):
        faqs = a['faq']
    
    # Normalize affiliate products
    affiliate = a.get('affiliateProducts') or a.get('affiliate_products') or a.get('products') or []
    
    # Normalize reading time
    read_time = a.get('readTime') or a.get('reading_time') or '8 min read'
    if isinstance(read_time, int):
        read_time = f'{read_time} min read'
    
    # Normalize word count
    word_count = a.get('word_count', 0)
    if not word_count and body:
        word_count = len(body.split())
    
    return {
        'id': a.get('id') or (1000 + idx),
        'slug': slug,
        'title': title,
        'meta_description': meta_desc[:160] if meta_desc else '',
        'metaTitle': a.get('metaTitle') or a.get('og_title') or title,
        'category': category,
        'tags': a.get('tags') or [],
        'body': body,
        'hero_url': hero_url,
        'image_alt': a.get('image_alt') or f'{title} - somatic healing illustration',
        'author': a.get('author', 'The Oracle Lover'),
        'reading_time': read_time,
        'word_count': word_count,
        'faqs': faqs,
        'affiliateProducts': affiliate,
        # published_at will be set by date-gating below
        'published_at': a.get('published_at'),
        'last_modified_at': a.get('last_modified_at') or a.get('created_at'),
        'created_at': a.get('created_at'),
    }

def main():
    # Backup current file
    if ARTICLES_FILE.exists():
        import shutil
        shutil.copy(str(ARTICLES_FILE), str(BACKUP_FILE))
        print(f"Backed up to {BACKUP_FILE}")
    
    # Load original 30 articles (the ones with status=published)
    current = json.loads(ARTICLES_FILE.read_text())
    originals = [a for a in current if a.get('status') == 'published']
    print(f"Original published articles: {len(originals)}")
    
    # Load all parts
    parts = []
    for f in sorted(PARTS_DIR.glob("*.json")):
        if f.name.endswith(".tmp"):
            continue
        try:
            a = json.loads(f.read_text())
            if a.get('slug') and a.get('body') and len(a.get('body', '')) > 200:
                parts.append(a)
        except Exception as e:
            print(f"  Skip {f.name}: {e}")
    print(f"Valid parts loaded: {len(parts)}")
    
    # Merge: originals first, then parts (dedup by slug)
    seen_slugs = set()
    all_articles = []
    
    for i, a in enumerate(originals):
        if a['slug'] not in seen_slugs:
            norm = normalize_article(a, i)
            norm['status'] = 'published'
            norm['published'] = True
            if not norm['published_at']:
                norm['published_at'] = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            all_articles.append(norm)
            seen_slugs.add(a['slug'])
    
    for i, a in enumerate(parts):
        if a['slug'] not in seen_slugs:
            norm = normalize_article(a, len(originals) + i)
            all_articles.append(norm)
            seen_slugs.add(a['slug'])
    
    print(f"Total unique articles: {len(all_articles)}")
    
    # Apply date-gating to articles without published_at
    # Start 30 days ago, 6 articles per day
    now = datetime.now()
    start_date = now - timedelta(days=30)
    per_day = 6
    day_count = 0
    current_date = start_date
    now_str = now.strftime('%Y-%m-%d')
    
    ungated = [a for a in all_articles if not a.get('published_at')]
    print(f"Articles needing date-gating: {len(ungated)}")
    
    for a in all_articles:
        if not a.get('published_at'):
            if day_count >= per_day:
                current_date += timedelta(days=1)
                day_count = 0
            a['published_at'] = current_date.strftime('%Y-%m-%d')
            day_count += 1
        
        # Set published boolean based on published_at vs today
        if not a.get('status') == 'published':
            a['published'] = a['published_at'] <= now_str
            a['status'] = 'published' if a['published'] else 'scheduled'
    
    published = len([a for a in all_articles if a.get('published') or a.get('status') == 'published'])
    future = len(all_articles) - published
    print(f"Published: {published} | Future (date-gated): {future}")
    
    # Sort by published_at desc
    all_articles.sort(key=lambda a: a.get('published_at', ''), reverse=True)
    
    # Write atomically
    tmp = str(ARTICLES_FILE) + ".merge.tmp"
    with open(tmp, 'w') as f:
        json.dump(all_articles, f, indent=2, ensure_ascii=False)
    os.rename(tmp, str(ARTICLES_FILE))
    
    size_mb = os.path.getsize(ARTICLES_FILE) / 1024 / 1024
    print(f"\n✓ articles.json written: {len(all_articles)} articles, {size_mb:.1f}MB")
    print(f"✓ Published today: {published}")
    print(f"✓ Date-gated for future: {future}")
    
    # Show date range
    dates = sorted([a['published_at'] for a in all_articles if a.get('published_at')])
    if dates:
        print(f"✓ Date range: {dates[-1]} → {dates[0]}")

if __name__ == '__main__':
    main()
