#!/usr/bin/env python3
"""
Parallel article generator using OpenAI GPT-4.1-mini
Generates all remaining articles in parallel using ThreadPoolExecutor
"""
import json
import os
import re
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path

# OpenAI
from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

client = OpenAI(
    api_key=OPENAI_API_KEY,
    base_url="https://api.openai.com/v1"
)

PROJECT_DIR = Path("/home/ubuntu/the-body-remembers")
ARTICLES_FILE = PROJECT_DIR / "data" / "articles.json"
INPUTS_FILE = Path("/tmp/map-inputs.json")

# Thread-safe lock for writing articles
lock = threading.Lock()
results = []
failed = []
counter = {"done": 0, "failed": 0}

# Category to hero image mapping
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
            
            # Strip markdown code blocks if present
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'^```\s*', '', content)
            content = re.sub(r'\s*```$', '', content)
            content = content.strip()
            
            # Parse JSON
            article = json.loads(content)
            
            # Add required fields
            article["hero_url"] = HERO_IMAGES.get(category, HERO_IMAGES["Somatic Healing"])
            article["author"] = "The Oracle Lover"
            article["published"] = True
            
            return article
            
        except json.JSONDecodeError as e:
            if attempt < 2:
                time.sleep(1)
                continue
            print(f"  ✗ [{idx}] {title[:50]}: JSON parse error: {e}")
            return None
        except Exception as e:
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue
            print(f"  ✗ [{idx}] {title[:50]}: {e}")
            return None
    
    return None


def main():
    # Load existing articles
    with open(ARTICLES_FILE) as f:
        existing_articles = json.load(f)
    
    existing_slugs = {a["slug"] for a in existing_articles}
    print(f"Existing articles: {len(existing_articles)}")
    
    # Load remaining topics
    with open(INPUTS_FILE) as f:
        all_inputs = json.load(f)
    
    # Filter out already done
    remaining = [inp for inp in all_inputs if inp.split("|||")[2] not in existing_slugs]
    print(f"Remaining to generate: {len(remaining)}")
    print(f"Starting parallel generation with 20 workers...")
    print()
    
    generated = []
    
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(generate_article, inp, i): (i, inp) for i, inp in enumerate(remaining)}
        
        for future in as_completed(futures):
            idx, inp = futures[future]
            title = inp.split("|||")[0]
            
            try:
                article = future.result()
                if article:
                    with lock:
                        generated.append(article)
                        counter["done"] += 1
                        done = counter["done"]
                        total = len(remaining)
                        print(f"  ✓ [{done}/{total}] {title[:60]}")
                        
                        # Save every 10 articles
                        if done % 10 == 0:
                            save_articles(existing_articles, generated)
                else:
                    with lock:
                        counter["failed"] += 1
                        failed.append(inp)
            except Exception as e:
                with lock:
                    counter["failed"] += 1
                    print(f"  ✗ [{idx}] {title[:50]}: {e}")
    
    # Final save
    save_articles(existing_articles, generated)
    
    print(f"\n=== DONE ===")
    print(f"Generated: {counter['done']}")
    print(f"Failed: {counter['failed']}")
    print(f"Total articles: {len(existing_articles) + len(generated)}")


def save_articles(existing: list, generated: list):
    """Merge existing + generated with date-gating and save."""
    # Date-gate: start from today - 30 days, 6 per day
    all_articles = list(existing)
    
    # Find the latest published_at date in existing
    existing_dates = []
    for a in existing:
        d = a.get("published_at") or a.get("publishDate")
        if d:
            try:
                existing_dates.append(datetime.fromisoformat(d[:10]))
            except:
                pass
    
    if existing_dates:
        next_date = max(existing_dates) + timedelta(days=1)
    else:
        next_date = datetime.now() - timedelta(days=30)
    
    # Assign dates to new articles (6 per day)
    per_day = 6
    day_count = 0
    
    for i, article in enumerate(generated):
        if day_count >= per_day:
            next_date += timedelta(days=1)
            day_count = 0
        
        article["published_at"] = next_date.strftime("%Y-%m-%d")
        article["published"] = next_date <= datetime.now()
        day_count += 1
        all_articles.append(article)
    
    with open(ARTICLES_FILE, "w") as f:
        json.dump(all_articles, f, indent=2, ensure_ascii=False)
    
    print(f"  [Saved {len(all_articles)} total articles]")


if __name__ == "__main__":
    main()
