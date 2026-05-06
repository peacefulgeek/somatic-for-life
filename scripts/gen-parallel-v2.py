#!/usr/bin/env python3
"""
Parallel article generator v2 — with atomic writes and proper state management
Uses OpenAI GPT-4.1-mini
"""
import json
import os
import re
import time
import threading
import tempfile
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path

from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

client = OpenAI(
    api_key=OPENAI_API_KEY,
    base_url="https://api.openai.com/v1"
)

PROJECT_DIR = Path("/home/ubuntu/the-body-remembers")
ARTICLES_FILE = PROJECT_DIR / "data" / "articles.json"
INPUTS_FILE = Path("/tmp/map-inputs.json")

# Thread-safe state
lock = threading.Lock()
# This is the MASTER list — loaded once, only appended to
master_articles = []
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

SYSTEM_PROMPT = """You are The Oracle Lover — an intuitive educator and oracle guide who writes about somatic healing, nervous system regulation, and body-based trauma recovery for somaticforlife.com.

Your voice: Direct, no-fluff, science-grounded but accessible. Not woo-woo. Not clinical. Like a trusted educator who has done the research and speaks plainly.

Write for people who: have tried therapy but still feel stuck, want to understand why their body reacts the way it does, are curious about somatic therapy, EMDR, polyvagal theory, and are doing self-directed healing work.

Always cite real researchers and authors: Bessel van der Kolk, Peter Levine, Stephen Porges, Deb Dana, Pat Ogden, Gabor Maté, Dan Siegel, Richard Schwartz, Francine Shapiro."""


def generate_article(topic_str: str, idx: int) -> dict | None:
    parts = topic_str.split("|||")
    title = parts[0]
    category = parts[1] if len(parts) > 1 else "Somatic Healing"
    slug = parts[2] if len(parts) > 2 else title.lower().replace(" ", "-")

    prompt = f"""Write a comprehensive 1800-2200 word article for somaticforlife.com.

Title: {title}
Category: {category}
Slug: {slug}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks, just raw JSON):
{{
  "slug": "{slug}",
  "title": "{title}",
  "category": "{category}",
  "excerpt": "2-3 sentence SEO excerpt under 160 chars",
  "readTime": "7 min read",
  "body": "Full HTML article body (1800-2200 words). Use <h2>, <h3>, <p>, <ul>, <li>, <blockquote> tags. Include a pull quote in <blockquote>. Write 6-8 sections.",
  "faqs": [
    {{"q": "Question 1?", "a": "Answer 1 (2-3 sentences)"}},
    {{"q": "Question 2?", "a": "Answer 2 (2-3 sentences)"}},
    {{"q": "Question 3?", "a": "Answer 3 (2-3 sentences)"}},
    {{"q": "Question 4?", "a": "Answer 4 (2-3 sentences)"}}
  ],
  "affiliateProducts": [
    {{"title": "Book or tool title", "asin": "B0XXXXXXXX", "description": "Why this helps"}}
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
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'^```\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            content = content.strip()

            article = json.loads(content)
            article["hero_url"] = HERO_IMAGES.get(category, HERO_IMAGES["Somatic Healing"])
            article["author"] = "The Oracle Lover"
            article["published"] = True
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
            print(f"  ✗ [{idx}] {title[:50]}: {e}")
            return None

    return None


def atomic_save(articles: list):
    """Write to a temp file then atomically rename to avoid corruption."""
    tmp = str(ARTICLES_FILE) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
    shutil.move(tmp, str(ARTICLES_FILE))


def apply_date_gating(articles: list) -> list:
    """Apply date-gating: 6 articles per day starting from 30 days ago."""
    # Find articles that already have published_at
    dated = [a for a in articles if a.get("published_at")]
    undated = [a for a in articles if not a.get("published_at")]

    if dated:
        dates = []
        for a in dated:
            try:
                dates.append(datetime.fromisoformat(a["published_at"][:10]))
            except:
                pass
        next_date = max(dates) + timedelta(days=1) if dates else datetime.now() - timedelta(days=30)
    else:
        next_date = datetime.now() - timedelta(days=30)

    per_day = 6
    day_count = 0
    now = datetime.now()

    for article in undated:
        if day_count >= per_day:
            next_date += timedelta(days=1)
            day_count = 0
        article["published_at"] = next_date.strftime("%Y-%m-%d")
        article["published"] = next_date <= now
        day_count += 1

    return dated + undated


def main():
    global master_articles

    # Load existing articles ONCE into master list
    with open(ARTICLES_FILE) as f:
        master_articles = json.load(f)

    existing_slugs = {a["slug"] for a in master_articles}
    print(f"Starting with {len(master_articles)} existing articles")

    # Load remaining topics
    with open(INPUTS_FILE) as f:
        all_inputs = json.load(f)

    remaining = [inp for inp in all_inputs if inp.split("|||")[2] not in existing_slugs]
    print(f"Remaining to generate: {len(remaining)}")
    print(f"Starting parallel generation with 20 workers...")
    print()

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(generate_article, inp, i): (i, inp) for i, inp in enumerate(remaining)}

        for future in as_completed(futures):
            idx, inp = futures[future]
            title = inp.split("|||")[0]

            try:
                article = future.result()
                if article:
                    with lock:
                        master_articles.append(article)
                        counter["done"] += 1
                        done = counter["done"]
                        total = len(remaining)
                        print(f"  ✓ [{done}/{total}] {title[:60]}")

                        # Save every 10 articles using atomic write
                        if done % 10 == 0:
                            save_snapshot = list(master_articles)
                            save_snapshot = apply_date_gating(save_snapshot)
                            atomic_save(save_snapshot)
                            print(f"  [Saved {len(save_snapshot)} total articles]")
                else:
                    with lock:
                        counter["failed"] += 1
            except Exception as e:
                with lock:
                    counter["failed"] += 1
                    print(f"  ✗ [{idx}] {title[:50]}: {e}")

    # Final save
    with lock:
        final = apply_date_gating(list(master_articles))
        atomic_save(final)

    print(f"\n=== DONE ===")
    print(f"Generated: {counter['done']}")
    print(f"Failed: {counter['failed']}")
    print(f"Total articles: {len(master_articles)}")


if __name__ == "__main__":
    main()
