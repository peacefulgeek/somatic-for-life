/**
 * Article Quality Gate for The Body Remembers.
 * Every generated article must pass ALL checks before storage.
 * Failed gate = REGENERATE, not skip.
 */

// ─── Banned words (zero tolerance) ──────────────────────────────────────────
const BANNED_WORDS = [
  'profound', 'transformative', 'holistic', 'nuanced', 'multifaceted',
  'delve', 'tapestry', 'landscape', 'paradigm', 'synergy', 'leverage',
  'unlock', 'empower', 'utilize', 'pivotal', 'embark', 'underscore',
  'paramount', 'seamlessly', 'robust', 'beacon', 'foster', 'elevate',
  'curate', 'curated', 'bespoke', 'resonate', 'harness', 'intricate',
  'plethora', 'myriad', 'groundbreaking', 'innovative', 'cutting-edge',
  'state-of-the-art', 'game-changer', 'game-changing', 'ever-evolving',
  'rapidly-evolving', 'stakeholders', 'ecosystem', 'framework',
  'comprehensive', 'streamline', 'optimize', 'facilitate', 'amplify',
  'catalyze', 'propel', 'spearhead', 'orchestrate', 'navigate', 'traverse',
  'furthermore', 'moreover', 'additionally', 'consequently', 'subsequently',
  'thereby', 'notably', 'crucially', 'importantly', 'essentially',
  'fundamentally', 'inherently', 'intrinsically', 'substantively',
  'revolutionary', 'realm', 'sphere', 'domain', 'arguably',
];

// ─── Banned phrases (zero tolerance) ────────────────────────────────────────
const BANNED_PHRASES = [
  "it's important to note that",
  "it's worth noting that",
  "it's crucial to",
  "in conclusion,",
  "in summary,",
  "in the realm of",
  "a holistic approach",
  "unlock your potential",
  "dive deep into",
  "delve into",
  "at the end of the day",
  "move the needle",
  "it goes without saying",
  "in today's fast-paced world",
  "in today's digital age",
  "plays a crucial role",
  "a testament to",
  "when it comes to",
  "cannot be overstated",
  "needless to say",
  "first and foremost",
  "last but not least",
];

const AMAZON_TAG = 'spankyspinola-20';
const AMAZON_LINK_REGEX = /https:\/\/www\.amazon\.com\/dp\/([A-Z0-9]{10})(?:\/[^"\s?]*)?(?:\?[^"\s]*)?/g;

export function countWords(text) {
  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  return stripped.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export function hasEmDash(text) {
  return /\u2014|\u2013/.test(text); // em-dash or en-dash
}

export function findFlaggedWords(text) {
  const lower = text.toLowerCase();
  return BANNED_WORDS.filter(w => {
    const re = new RegExp(`\\b${w.replace(/-/g, '[- ]')}\\b`, 'i');
    return re.test(lower);
  });
}

export function findFlaggedPhrases(text) {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.filter(p => lower.includes(p.toLowerCase()));
}

export function countAmazonLinks(text) {
  const matches = text.match(AMAZON_LINK_REGEX) || [];
  AMAZON_LINK_REGEX.lastIndex = 0;
  return matches.length;
}

export function extractAsinsFromText(text) {
  const asins = new Set();
  let m;
  const re = new RegExp(AMAZON_LINK_REGEX.source, 'g');
  while ((m = re.exec(text)) !== null) asins.add(m[1]);
  return Array.from(asins);
}

export function voiceSignals(text) {
  const stripped = text.replace(/<[^>]+>/g, ' ');
  const contractions = (stripped.match(/\b(you're|it's|don't|won't|can't|I've|we've|they're|he's|she's|I'm|we're|that's|there's|here's|what's|who's|isn't|aren't|wasn't|weren't|doesn't|didn't|couldn't|wouldn't|shouldn't|I'll|we'll|you'll|they'll)\b/gi) || []).length;
  const directAddress = (stripped.match(/\byou\b/gi) || []).length;
  const firstPerson = (stripped.match(/\b(I|we|my|our|I've|we've|I'm|we're|I'll|we'll)\b/g) || []).length;

  const sentences = stripped.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avg = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const variance = lengths.length ? lengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lengths.length : 0;
  const stdDev = Math.sqrt(variance);
  const shortSentences = lengths.filter(l => l <= 8).length;
  const longSentences = lengths.filter(l => l >= 25).length;

  const conversationalMarkers = [
    /\bhere's the thing\b/i, /\blook,\s/i, /\bhonestly,?\s/i, /\btruth is\b/i,
    /\bthe truth\b/i, /\bi'll tell you\b/i, /\bthink about it\b/i,
    /\bthat said\b/i, /\bbut here's\b/i, /\bso yeah\b/i, /\bkind of\b/i,
    /\bsort of\b/i, /\byou know\b/i, /\bright\?!?\b/i, /\bknow what i mean\?/i,
    /\bdoes that land\?/i, /\bstop overthinking\b/i, /\blet me be straight\b/i,
    /\bthe body doesn't lie\b/i, /\bless theory\b/i, /\bhere's what actually works\b/i,
  ].filter(r => r.test(stripped)).length;

  return {
    contractions, directAddress, firstPerson,
    sentenceCount: sentences.length,
    avgSentenceLength: +avg.toFixed(1),
    sentenceStdDev: +stdDev.toFixed(1),
    shortSentences, longSentences,
    conversationalMarkers,
  };
}

export function eeatSignals(html) {
  const tldr = /<section[^>]*data-tldr="ai-overview"/i.test(html);
  const authorByline = /class="author-byline"/i.test(html) || /data-eeat="author"/i.test(html);
  const internalLinks = (html.match(/<a [^>]*href="\/[^"]*"/g) || []).length;
  const externalAuthLinks = (html.match(/<a [^>]*href="https?:\/\/[^"]*\.(gov|edu|nih\.gov|cdc\.gov|who\.int|nature\.com|sciencedirect\.com|pubmed\.ncbi\.nlm\.nih\.gov)[^"]*"/gi) || []).length;
  const lastUpdated = /datetime="\d{4}-\d{2}-\d{2}/.test(html);
  const selfRef = /\b(in our experience|when we tested|on this site|across our|we['']ve published|i['']ve seen|in my own practice|over the years|after years of)\b/i.test(html);
  return { tldr, authorByline, internalLinks, externalAuthLinks, lastUpdated, selfRef };
}

/**
 * Full quality gate. Returns { passed, failures, warnings, wordCount, amazonLinks, ... }
 * If passed === false → REGENERATE.
 */
export function runQualityGate(articleBody) {
  const failures = [];
  const warnings = [];

  const words = countWords(articleBody);
  if (words < 1200) failures.push(`word-count-too-low:${words}`);
  if (words > 2500) failures.push(`word-count-too-high:${words}`);

  const amzCount = countAmazonLinks(articleBody);
  if (amzCount < 3) failures.push(`amazon-links-too-few:${amzCount}`);
  if (amzCount > 4) failures.push(`amazon-links-too-many:${amzCount}`);

  if (hasEmDash(articleBody)) failures.push('contains-em-or-en-dash');

  const bw = findFlaggedWords(articleBody);
  if (bw.length > 0) failures.push(`ai-flagged-words:${bw.join(',')}`);

  const bp = findFlaggedPhrases(articleBody);
  if (bp.length > 0) failures.push(`ai-flagged-phrases:${bp.join('|')}`);

  const voice = voiceSignals(articleBody);
  const per1k = (n) => (n / (words || 1)) * 1000;

  if (per1k(voice.contractions) < 3) {
    warnings.push(`contractions-low:${voice.contractions}(${per1k(voice.contractions).toFixed(1)}/1k)`);
  }
  if (voice.directAddress === 0 && voice.firstPerson === 0) {
    failures.push('no-direct-address-or-first-person');
  }
  if (voice.sentenceStdDev < 3) {
    warnings.push(`sentence-variance-low:${voice.sentenceStdDev}`);
  }
  if (voice.conversationalMarkers < 1) {
    warnings.push(`conversational-markers-low:${voice.conversationalMarkers}`);
  }

  const eeat = eeatSignals(articleBody);
  if (!eeat.tldr) warnings.push('eeat-missing-tldr');
  if (!eeat.authorByline) warnings.push('eeat-missing-author-byline');
  if (eeat.internalLinks < 2) warnings.push(`eeat-internal-links-low:${eeat.internalLinks}`);
  if (!eeat.lastUpdated) warnings.push('eeat-missing-last-updated');

  return {
    passed: failures.length === 0,
    failures, warnings,
    wordCount: words,
    amazonLinks: amzCount,
    asins: extractAsinsFromText(articleBody),
    voice, eeat,
  };
}
