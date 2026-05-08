#!/usr/bin/env python3
"""
Expand all articles to 1800+ words using OpenAI GPT-4.1-mini.
Reads data/articles.json, expands each article body, writes back.
"""
import json
import os
import sys
import time
from pathlib import Path
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    base_url=os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"),
)

DATA_FILE = Path(__file__).parent.parent / "data" / "articles.json"
BACKUP_FILE = Path(__file__).parent.parent / "data" / "articles-backup.json"
PROGRESS_FILE = Path("/tmp/expand-progress.json")

def word_count(html):
    import re
    text = re.sub(r'<[^>]+>', ' ', html or '')
    text = re.sub(r'\s+', ' ', text).strip()
    return len(text.split())

def expand_article(article):
    title = article.get("title", "")
    category = article.get("category", "somatic-healing")
    existing_body = article.get("body", "")
    existing_faqs = article.get("faqs", [])
    
    faq_text = ""
    if existing_faqs:
        faq_text = "\n\nExisting FAQs to preserve:\n" + "\n".join(
            f"Q: {f['q']}\nA: {f['a']}" for f in existing_faqs
        )
    
    prompt = f"""You are The Oracle Lover, a somatic trauma healing educator writing for somaticforlife.com.

Write a LONG, comprehensive, deeply informative article titled: "{title}"
Category: {category}

CRITICAL REQUIREMENT: The article MUST contain AT LEAST 1800 words of readable text (not counting HTML tags). This is non-negotiable. Write extensively.

Structure and content requirements:
- Professional, warm, authoritative tone — The Oracle Lover persona
- Structure with HTML: <h2> subheadings, <p> paragraphs, <ul>/<li> lists, <blockquote> for quotes
- Include ALL of the following sections (each section must be at least 200 words):
  1. Introduction (200+ words)
  2. The Science Behind This (200+ words) — cite van der Kolk, Levine, Porges, Ogden
  3. How This Manifests in the Body (200+ words)
  4. Somatic Healing Approaches (200+ words) — specific techniques
  5. Practical Exercises You Can Do Now (200+ words) — step-by-step
  6. Working With a Therapist (150+ words)
  7. The Path Forward (150+ words)
  8. Frequently Asked Questions (4-6 Q&A pairs)
- Include at least one blockquote attributed to "The Oracle Lover"
- Reference real researchers: Bessel van der Kolk, Peter Levine, Stephen Porges, Pat Ogden, Gabor Maté, Deb Dana
- Practical, actionable content that helps trauma survivors
- No affiliate product mentions in the body
- Do NOT include a title <h1> — start directly with an introductory paragraph or <h2>

FAQ format:
  <h2>Frequently Asked Questions</h2>
  <div class="faq-item"><h3>Question here?</h3><p>Answer here.</p></div>

Existing content to expand upon (keep all good content, add significantly more depth and length):
{existing_body[:2000] if existing_body else "Write fresh content."}
{faq_text}

Return ONLY the HTML body content. No markdown, no code fences, no preamble. Write at least 1800 words of text."""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4096,
        temperature=0.7,
    )
    
    new_body = response.choices[0].message.content.strip()
    # Remove any accidental markdown code fences
    if new_body.startswith("```"):
        new_body = new_body.split("```")[1]
        if new_body.startswith("html"):
            new_body = new_body[4:]
    
    return new_body

def main():
    # Load articles
    with open(DATA_FILE) as f:
        articles = json.load(f)
    
    # Backup
    if not BACKUP_FILE.exists():
        with open(BACKUP_FILE, 'w') as f:
            json.dump(articles, f)
        print(f"Backed up {len(articles)} articles")
    
    # Load progress
    progress = {}
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE) as f:
            progress = json.load(f)
    
    total = len(articles)
    expanded = 0
    skipped = 0
    errors = 0
    
    # Get start index from args
    start_idx = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    end_idx = int(sys.argv[2]) if len(sys.argv) > 2 else total
    
    print(f"Processing articles {start_idx} to {end_idx-1} of {total}")
    
    for i in range(start_idx, min(end_idx, total)):
        article = articles[i]
        slug = article.get("slug", f"article-{i}")
        
        # Check if already expanded
        current_wc = word_count(article.get("body", ""))
        if current_wc >= 1800:
            skipped += 1
            if i % 20 == 0:
                print(f"[{i}/{total}] SKIP {slug} ({current_wc} words)")
            continue
        
        if slug in progress and progress[slug] == "done":
            skipped += 1
            continue
        
        try:
            print(f"[{i}/{total}] Expanding: {article.get('title','')[:60]} ({current_wc} words)")
            new_body = expand_article(article)
            new_wc = word_count(new_body)
            
            if new_wc < 1500:
                print(f"  WARNING: Only {new_wc} words generated, retrying...")
                time.sleep(2)
                new_body = expand_article(article)
                new_wc = word_count(new_body)
            
            articles[i]["body"] = new_body
            articles[i]["word_count"] = new_wc
            articles[i]["reading_time"] = f"{max(7, new_wc // 200)} min read"
            
            # Extract FAQs from new body if present
            import re
            faq_pattern = re.findall(r'<h3>(.*?)\?</h3>\s*<p>(.*?)</p>', new_body, re.DOTALL)
            if faq_pattern and len(faq_pattern) >= 2:
                articles[i]["faqs"] = [{"q": q.strip()+"?", "a": a.strip()} for q, a in faq_pattern[:6]]
            
            progress[slug] = "done"
            expanded += 1
            
            print(f"  -> {new_wc} words")
            
            # Save every 10 articles
            if expanded % 10 == 0:
                with open(DATA_FILE, 'w') as f:
                    json.dump(articles, f, indent=2, ensure_ascii=False)
                with open(PROGRESS_FILE, 'w') as f:
                    json.dump(progress, f)
                print(f"  Saved progress: {expanded} expanded, {skipped} skipped, {errors} errors")
            
            # Rate limit
            time.sleep(0.5)
            
        except Exception as e:
            print(f"  ERROR on {slug}: {e}")
            errors += 1
            time.sleep(2)
            continue
    
    # Final save
    with open(DATA_FILE, 'w') as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f)
    
    print(f"\nDone! Expanded: {expanded}, Skipped: {skipped}, Errors: {errors}")

if __name__ == "__main__":
    main()
