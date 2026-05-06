#!/usr/bin/env python3
"""Normalize all article category names to slug format."""
import json, os

ARTICLES_FILE = '/home/ubuntu/the-body-remembers/data/articles.json'

# Mapping from display names to slugs
CATEGORY_MAP = {
    'Trauma Therapy': 'trauma-therapy',
    'trauma therapy': 'trauma-therapy',
    'Nervous System': 'nervous-system',
    'nervous system': 'nervous-system',
    'Somatic Healing': 'somatic-healing',
    'somatic healing': 'somatic-healing',
    'Somatic Practices': 'somatic-practices',
    'somatic practices': 'somatic-practices',
    'Body-Mind Connection': 'body-mind',
    'Body-Mind': 'body-mind',
    'body-mind connection': 'body-mind',
    'Self-Directed': 'self-directed',
    'Self-Directed Work': 'self-directed',
    'self directed': 'self-directed',
    'Polyvagal Theory': 'polyvagal-theory',
    'polyvagal theory': 'polyvagal-theory',
    'Research': 'trauma-research',
    'Research & Science': 'trauma-research',
    'Trauma Research': 'trauma-research',
    'trauma research': 'trauma-research',
    'EMDR': 'emdr-therapy',
    'EMDR Therapy': 'emdr-therapy',
    'emdr': 'emdr-therapy',
    'emdr therapy': 'emdr-therapy',
    'Somatic Experiencing': 'somatic-healing',
    'somatic experiencing': 'somatic-healing',
    'Body-Mind': 'body-mind',
    'Mindfulness': 'somatic-practices',
    'mindfulness': 'somatic-practices',
    'Breathwork': 'somatic-practices',
    'breathwork': 'somatic-practices',
    'Attachment': 'trauma-therapy',
    'attachment': 'trauma-therapy',
    'Attachment Theory': 'trauma-therapy',
    'Childhood Trauma': 'trauma-therapy',
    'childhood trauma': 'trauma-therapy',
    'Complex PTSD': 'trauma-therapy',
    'complex ptsd': 'trauma-therapy',
    'PTSD': 'trauma-therapy',
    'ptsd': 'trauma-therapy',
    'IFS': 'trauma-therapy',
    'Internal Family Systems': 'trauma-therapy',
    'Grounding': 'somatic-practices',
    'grounding': 'somatic-practices',
    'Yoga': 'somatic-practices',
    'yoga': 'somatic-practices',
    'Meditation': 'somatic-practices',
    'meditation': 'somatic-practices',
    'Chronic Pain': 'body-mind',
    'chronic pain': 'body-mind',
    'Vagus Nerve': 'nervous-system',
    'vagus nerve': 'nervous-system',
    'Window of Tolerance': 'nervous-system',
    'window of tolerance': 'nervous-system',
    'Freeze Response': 'nervous-system',
    'freeze response': 'nervous-system',
    'Fight-Flight-Freeze': 'nervous-system',
    'Dissociation': 'trauma-therapy',
    'dissociation': 'trauma-therapy',
    'Hypervigilance': 'nervous-system',
    'hypervigilance': 'nervous-system',
    'Trauma Recovery': 'trauma-therapy',
    'trauma recovery': 'trauma-therapy',
    'Healing': 'somatic-healing',
    'healing': 'somatic-healing',
    'Body Awareness': 'somatic-practices',
    'body awareness': 'somatic-practices',
    'Nervous System Regulation': 'nervous-system',
    'nervous system regulation': 'nervous-system',
    'Somatic Therapy': 'somatic-healing',
    'somatic therapy': 'somatic-healing',
    'Trauma': 'trauma-therapy',
    'trauma': 'trauma-therapy',
    'Mind-Body': 'body-mind',
    'mind-body': 'body-mind',
    'Neuroscience': 'trauma-research',
    'neuroscience': 'trauma-research',
    'Epigenetics': 'trauma-research',
    'epigenetics': 'trauma-research',
    'ACEs': 'trauma-research',
    'Adverse Childhood Experiences': 'trauma-research',
    'Interoception': 'somatic-practices',
    'interoception': 'somatic-practices',
    'Embodiment': 'somatic-healing',
    'embodiment': 'somatic-healing',
    'Pendulation': 'somatic-practices',
    'pendulation': 'somatic-practices',
    'Titration': 'somatic-practices',
    'titration': 'somatic-practices',
    'Resourcing': 'somatic-practices',
    'resourcing': 'somatic-practices',
    'Co-Regulation': 'nervous-system',
    'co-regulation': 'nervous-system',
    'Self-Regulation': 'self-directed',
    'self-regulation': 'self-directed',
    'Bilateral Stimulation': 'emdr-therapy',
    'bilateral stimulation': 'emdr-therapy',
    'Eye Movement': 'emdr-therapy',
    'eye movement': 'emdr-therapy',
    'Tapping': 'somatic-practices',
    'tapping': 'somatic-practices',
    'EFT': 'somatic-practices',
    'TRE': 'somatic-practices',
    'Tension Release': 'somatic-practices',
    'tension release': 'somatic-practices',
    'Freeze': 'nervous-system',
    'Fawn': 'nervous-system',
    'Dorsal Vagal': 'nervous-system',
    'dorsal vagal': 'nervous-system',
    'Ventral Vagal': 'nervous-system',
    'ventral vagal': 'nervous-system',
    'Sympathetic': 'nervous-system',
    'sympathetic': 'nervous-system',
    'Parasympathetic': 'nervous-system',
    'parasympathetic': 'nervous-system',
}

VALID_SLUGS = {
    'trauma-therapy', 'nervous-system', 'somatic-healing', 'somatic-practices',
    'body-mind', 'self-directed', 'polyvagal-theory', 'trauma-research', 'emdr-therapy'
}

articles = json.load(open(ARTICLES_FILE))
changed = 0
unknown = {}

for a in articles:
    cat = a.get('category', '')
    if cat in VALID_SLUGS:
        continue  # already correct
    
    # Try direct mapping
    normalized = CATEGORY_MAP.get(cat)
    if not normalized:
        # Try case-insensitive
        normalized = CATEGORY_MAP.get(cat.lower())
    if not normalized:
        # Try to infer from slug
        slug_cat = cat.lower().replace(' ', '-').replace('_', '-')
        if slug_cat in VALID_SLUGS:
            normalized = slug_cat
    if not normalized:
        unknown[cat] = unknown.get(cat, 0) + 1
        normalized = 'somatic-healing'  # default fallback
    
    a['category'] = normalized
    changed += 1

print(f'Normalized: {changed} articles')
if unknown:
    print('Unknown categories (defaulted to somatic-healing):')
    for k, v in sorted(unknown.items(), key=lambda x: -x[1])[:20]:
        print(f'  "{k}": {v} articles')

# Atomic write
tmp = ARTICLES_FILE + '.norm.tmp'
with open(tmp, 'w') as f:
    json.dump(articles, f, indent=2, ensure_ascii=False)
os.rename(tmp, ARTICLES_FILE)

# Verify
verify = json.load(open(ARTICLES_FILE))
cats = {}
for a in verify:
    if a.get('published') == True or a.get('status') == 'published':
        c = a.get('category', 'unknown')
        cats[c] = cats.get(c, 0) + 1
print(f'\n✓ Final category counts (published only):')
for k, v in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {k}: {v}')
print(f'Total published: {sum(cats.values())}')
