#!/usr/bin/env python3
"""
Parallel article generator v3 — writes each article to its own file.
No shared state, no write corruption. Merge at the end.
"""
import json
import os
import re
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

client = OpenAI(api_key=OPENAI_API_KEY, base_url="https://api.openai.com/v1")

PROJECT_DIR = Path("/home/ubuntu/the-body-remembers")
ARTICLES_FILE = PROJECT_DIR / "data" / "articles.json"
INPUTS_FILE = Path("/tmp/map-inputs.json")
# Each article goes into its own file in this dir
ARTICLES_DIR = PROJECT_DIR / "data" / "articles-parts"
ARTICLES_DIR.mkdir(exist_ok=True)

counter_lock = threading.Lock()
counter = {"done": 0, "failed": 0}

HERO_IMAGES = {
    "Trauma Therapy": "https://somatic-forlife.b-cdn.net/images/hero-trauma-therapy.webp",
    "Nervous System": "https://somatic-forlife.b-cdn.net/images/hero-nervous-system.webp",
    "Somatic Healing": "https://somatic-forlife.b-cdn.net/images/hero-somatic-healing.webp",
    "Somatic Practices": "https://somatic-forlife.b-cdn.net/images/hero-somatic-practices.webp",
    "Body-Mind Connection": "https://somatic-forlife.b-cdn.net/images/hero-body-mind.webp",
    "Self-Directed": "https://somatic-forlife.b-cdn.net/images/hero-self-directed.webp",
    "Polyvagal Theory": "https://somatic-forlife.b-cdn.net/images/hero-polyvagal.webp",
    "Research": "https://somatic-forlife.b-cdn.net/images/hero-trauma-research.webp",
    "EMDR": "https://somatic-forlife.b-cdn.net/images/hero-emdr.webp",
}

SYSTEM_PROMPT = """You are The Oracle Lover — an intuitive educator who writes about somatic healing, nervous system regulation, and body-based trauma recovery for somaticforlife.com.

Your voice: Direct, no-fluff, science-grounded but accessible. Not woo-woo. Not clinical. Like a trusted educator who has done the research and speaks plainly.

Write for people who have tried therapy but still feel stuck, want to understand why their body reacts the way it does, and are doing self-directed healing work.

Always cite real researchers: Bessel van der Kolk, Peter Levine, Stephen Porges, Deb Dana, Pat Ogden, Gabor Maté, Dan Siegel, Richard Schwartz, Francine Shapiro."""


def generate_article(topic_str: str, idx: int) -> dict | None:
    parts = topic_str.split("|||")
    title = parts[0]
    category = parts[1] if len(parts) > 1 else "Somatic Healing"
    slug = parts[2] if len(parts) > 2 else re.sub(r'[^a-z0-9-]', '-', title.lower()).strip('-')

    # Skip if already generated
    part_file = ARTICLES_DIR / f"{slug}.json"
    if part_file.exists():
        try:
            existing = json.loads(part_file.read_text())
            if existing.get("body") and len(existing["body"]) > 500:
                return existing
        except:
            pass

    prompt = f"""Write a comprehensive 1800-2200 word article for somaticforlife.com.

Title: {title}
Category: {category}
Slug: {slug}

Return ONLY valid JSON (no markdown code blocks, no extra text):
{{
  "slug": "{slug}",
  "title": "{title}",
  "category": "{category}",
  "excerpt": "2-3 sentence SEO excerpt under 160 chars",
  "readTime": "8 min read",
  "body": "Full HTML article body (1800-2200 words). Use h2, h3, p, ul, li, blockquote tags. Include a pull quote in blockquote. Write 6-8 sections with real citations.",
  "faqs": [
    {{"q": "Question 1?", "a": "Answer 1 (2-3 sentences)."}},
    {{"q": "Question 2?", "a": "Answer 2 (2-3 sentences)."}},
    {{"q": "Question 3?", "a": "Answer 3 (2-3 sentences)."}},
    {{"q": "Question 4?", "a": "Answer 4 (2-3 sentences)."}}
  ],
  "affiliateProducts": [
    {{"title": "Book or tool title", "asin": "B0XXXXXXXX", "description": "Why this helps with somatic healing"}}
  ],
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description under 160 chars"
}}"""

    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=3500,
                timeout=60
            )

            content = response.choices[0].message.content.strip()
            # Strip markdown code blocks if present
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'^```\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            content = content.strip()

            article = json.loads(content)
            article["hero_url"] = HERO_IMAGES.get(category, HERO_IMAGES["Somatic Healing"])
            article["author"] = "The Oracle Lover"

            # Write to individual file atomically
            tmp = str(part_file) + ".tmp"
            with open(tmp, "w") as f:
                json.dump(article, f, ensure_ascii=False)
            os.rename(tmp, str(part_file))

            return article

        except json.JSONDecodeError:
            if attempt < 2:
                time.sleep(1)
                continue
            return None
        except Exception as e:
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue
            return None

    return None


def main():
    # Load existing articles from main file
    existing = json.load(open(ARTICLES_FILE))
    existing_slugs = {a["slug"] for a in existing}
    print(f"Existing articles in main file: {len(existing)}")

    # Also check parts dir
    already_in_parts = set()
    for f in ARTICLES_DIR.glob("*.json"):
        if not f.name.endswith(".tmp"):
            already_in_parts.add(f.stem)
    print(f"Already in parts dir: {len(already_in_parts)}")

    # Load all inputs
    all_inputs = json.load(open(INPUTS_FILE))
    remaining = [inp for inp in all_inputs
                 if inp.split("|||")[2] not in existing_slugs
                 and inp.split("|||")[2] not in already_in_parts]
    print(f"Remaining to generate: {len(remaining)}")
    print(f"Starting with 20 parallel workers...")
    print()

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(generate_article, inp, i): (i, inp) for i, inp in enumerate(remaining)}

        for future in as_completed(futures):
            idx, inp = futures[future]
            title = inp.split("|||")[0]
            try:
                article = future.result()
                with counter_lock:
                    if article:
                        counter["done"] += 1
                        done = counter["done"]
                        total = len(remaining)
                        print(f"  ✓ [{done}/{total}] {title[:65]}")
                    else:
                        counter["failed"] += 1
                        print(f"  ✗ FAILED: {title[:65]}")
            except Exception as e:
                with counter_lock:
                    counter["failed"] += 1

    print(f"\n=== Generation complete ===")
    print(f"Generated: {counter['done']} | Failed: {counter['failed']}")
    print(f"\nMerging all parts into articles.json...")

    # Merge: start with existing articles
    all_articles = list(existing)
    existing_slugs_now = {a["slug"] for a in all_articles}

    # Add all parts
    parts_added = 0
    for part_file in sorted(ARTICLES_DIR.glob("*.json")):
        if part_file.name.endswith(".tmp"):
            continue
        try:
            article = json.loads(part_file.read_text())
            if article.get("slug") and article["slug"] not in existing_slugs_now:
                all_articles.append(article)
                existing_slugs_now.add(article["slug"])
                parts_added += 1
        except:
            pass

    print(f"Parts merged: {parts_added}")
    print(f"Total before date-gating: {len(all_articles)}")

    # Apply date-gating: 6 articles/day starting 30 days ago
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=30)
    per_day = 6
    day_count = 0
    current_date = start_date
    now_str = datetime.now().strftime("%Y-%m-%d")

    for article in all_articles:
        if not article.get("published_at"):
            if day_count >= per_day:
                current_date += timedelta(days=1)
                day_count = 0
            article["published_at"] = current_date.strftime("%Y-%m-%d")
            article["published"] = article["published_at"] <= now_str
            day_count += 1

    published = len([a for a in all_articles if a.get("published")])
    print(f"Published: {published} | Future: {len(all_articles) - published}")

    # Write final merged file atomically
    tmp = str(ARTICLES_FILE) + ".final.tmp"
    with open(tmp, "w") as f:
        json.dump(all_articles, f, indent=2, ensure_ascii=False)
    os.rename(tmp, str(ARTICLES_FILE))

    print(f"\n✓ articles.json written: {len(all_articles)} articles")
    print(f"✓ File size: {os.path.getsize(ARTICLES_FILE) / 1024 / 1024:.1f}MB")


if __name__ == "__main__":
    main()
