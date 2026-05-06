#!/usr/bin/env python3
"""Fix date-gating on all articles in articles.json."""
import json, os
from datetime import datetime, timedelta

ARTICLES_FILE = '/home/ubuntu/the-body-remembers/data/articles.json'
articles = json.load(open(ARTICLES_FILE))

now = datetime.now()
today_str = now.strftime('%Y-%m-%d')

# Separate: originals (have status=published) vs new (no published_at)
originals = [a for a in articles if a.get('status') == 'published']
new_articles = [a for a in articles if a.get('status') != 'published']

print(f'Originals: {len(originals)}')
print(f'New articles: {len(new_articles)}')

# Date-gate new articles: start 30 days ago, 6/day
# Articles with published_at <= today get published=True
start_date = now - timedelta(days=30)
per_day = 6
day_count = 0
current_date = start_date

for a in new_articles:
    if day_count >= per_day:
        current_date += timedelta(days=1)
        day_count = 0
    date_str = current_date.strftime('%Y-%m-%d')
    a['published_at'] = date_str
    a['published'] = date_str <= today_str
    a['status'] = 'published' if a['published'] else 'scheduled'
    day_count += 1

# Ensure originals are marked published
for a in originals:
    a['published'] = True
    if not a.get('published_at'):
        a['published_at'] = (now - timedelta(days=35)).strftime('%Y-%m-%d')

# Merge and sort by published_at desc
all_articles = originals + new_articles
all_articles.sort(key=lambda a: a.get('published_at', ''), reverse=True)

pub = len([a for a in all_articles if a.get('published')])
sched = len([a for a in all_articles if not a.get('published')])
print(f'Total: {len(all_articles)} | Published: {pub} | Scheduled: {sched}')

# Atomic write
tmp = ARTICLES_FILE + '.tmp'
with open(tmp, 'w') as f:
    json.dump(all_articles, f, indent=2, ensure_ascii=False)
os.rename(tmp, ARTICLES_FILE)

size_mb = os.path.getsize(ARTICLES_FILE) / 1024 / 1024
print(f'Written: {size_mb:.1f}MB')

# Show date range
dates = sorted(set(a.get('published_at','') for a in all_articles if a.get('published_at')))
if dates:
    print(f'Date range: {dates[0]} → {dates[-1]}')
    last_pub = max(a.get('published_at','') for a in all_articles if a.get('published'))
    first_sched = min((a.get('published_at','') for a in all_articles if not a.get('published')), default='N/A')
    print(f'Last published: {last_pub}')
    print(f'First scheduled: {first_sched}')
