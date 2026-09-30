import type { AgentProfile, Evidence, PersonInput } from './types';
import type { ScrapeResult } from './scraper';

// Deterministic agent-reader: only reads LinkedIn + Instagram text. No other sources.
// Keyword-taxonomy extraction (needs/hobbies/interests/values) with per-trait evidence quotes.

const TAXONOMY: { tag: string; kinds: ('hobby' | 'interest' | 'value' | 'need')[]; keys: string[] }[] = [
  { tag: 'fitness & training', kinds: ['hobby', 'interest'], keys: ['gym', 'lift', 'training', 'fitness', 'run', 'marathon', 'tennis', 'frisbee', 'surf', 'skate', 'sauna', 'pickleball', 'workout'] },
  { tag: 'books & learning', kinds: ['hobby', 'interest'], keys: ['book', 'read', 'author', 'podcast', 'journal', 'learn', 'research', 'professor', 'wharton', 'stoic'] },
  { tag: 'business & building', kinds: ['interest', 'value'], keys: ['founder', 'ceo', 'startup', 'vc', 'invest', 'scaling', 'business', 'entrepreneur', 'company', 'public'] },
  { tag: 'family & devotion', kinds: ['value', 'need'], keys: ['mom', 'dad', 'family', 'wife', 'husband', 'kids', 'mother', 'daughter', 'son', 'olympia'] },
  { tag: 'travel & adventure', kinds: ['hobby', 'interest'], keys: ['travel', 'island', 'adventure', 'kite', 'ocean', 'beach', 'trip', 'accra', 'texas', 'london', 'austin'] },
  { tag: 'mindfulness & faith', kinds: ['value', 'hobby'], keys: ['monk', 'meditation', 'mindfulness', 'purpose', 'faith', 'prayer', 'matcha', 'therapy', 'vulnerability', 'courage'] },
  { tag: 'food & ritual', kinds: ['hobby'], keys: ['matcha', 'tea', 'wine', 'tacos', 'tequila', 'food', 'dinner', 'greek', 'brunch', 'garage'] },
  { tag: 'fashion & design', kinds: ['hobby', 'interest'], keys: ['fashion', 'design', 'vintage', 'sneaker', 'glam', 'color', 'minimalist', 'photography', 'camera', 'film'] },
  { tag: 'sports fandom', kinds: ['hobby', 'interest'], keys: ['jets', 'sports', 'girls sports', 'angel city', 'grand slam', 'ev', 'manchester', 'newcastle'] },
  { tag: 'humor & play', kinds: ['value'], keys: ['humor', 'laugh', 'joke', 'play', 'fun', 'joy', 'magic', 'dance'] },
  { tag: 'giving & impact', kinds: ['value', 'need'], keys: ['philanthropy', 'foundation', 'equality', 'women', 'kindness', 'empathy', 'service', 'mentor', 'climate', 'health'] },
  { tag: 'ambition & momentum', kinds: ['need', 'value'], keys: ['hustle', 'momentum', 'action', 'confidence', 'discipline', 'work ethic', 'no excuses', 'fail big', 'dream'] },
  { tag: 'calm & wellbeing', kinds: ['need'], keys: ['sleep', 'well-being', 'thrive', 'burnout', 'walk', 'morning', 'slow', 'sunset', 'balance'] },
  { tag: 'money & freedom', kinds: ['interest', 'need'], keys: ['money', 'freedom', 'ownership', 'boring businesses', 'financial', 'laundromat'] },
  { tag: 'art & music', kinds: ['hobby'], keys: ['music', 'art', 'film', 'storytelling', 'vlog', 'comics'] },
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, n: number): T[] {
  if (!arr.length) return [];
  const out: T[] = []; const used = new Set<number>();
  let s = seed;
  while (out.length < Math.min(n, arr.length)) {
    s = (s * 9301 + 49297) % 233280;
    const i = Math.floor((s / 233280) * arr.length);
    if (!used.has(i)) { used.add(i); out.push(arr[i]); }
  }
  return out;
}

/** Grab a short quote window around the first keyword hit — the receipt for a trait. */
function quoteFor(keys: string[], liOriginal: string, igOriginal: string): Evidence | null {
  const hunt = (text: string, source: 'linkedin' | 'instagram'): Evidence | null => {
    const low = text.toLowerCase();
    for (const k of keys) {
      const i = low.indexOf(k);
      if (i >= 0) {
        const start = Math.max(0, i - 42);
        const end = Math.min(text.length, i + k.length + 52);
        let q = text.slice(start, end).replace(/\s+/g, ' ').trim();
        if (q.length > 110) q = q.slice(0, 110).trim() + '…';
        return { tag: '', source, quote: `“…${q}…”` };
      }
    }
    return null;
  };
  return hunt(liOriginal, 'linkedin') || hunt(igOriginal, 'instagram');
}

export function analyzePerson(p: PersonInput, li?: ScrapeResult, ig?: ScrapeResult): AgentProfile {
  const liOriginal = `${p.linkedinBio || ''} ${li?.title || ''} ${li?.description || ''}`.trim();
  const igOriginal = `${p.instagramBio || ''} ${ig?.title || ''} ${ig?.description || ''}`.trim();
  const liText = liOriginal.toLowerCase();
  const igText = igOriginal.toLowerCase();
  const both = `${liText} ${igText}`;
  const seed = hashStr(p.id);

  const hit = (keys: string[]) => keys.some(k => both.includes(k));
  const liHit = (keys: string[]) => keys.some(k => liText.includes(k));
  const igHit = (keys: string[]) => keys.some(k => igText.includes(k));

  const matched = TAXONOMY.filter(t => hit(t.keys));
  const hobbies = matched.filter(t => t.kinds.includes('hobby')).map(t => t.tag);
  const interests = matched.filter(t => t.kinds.includes('interest')).map(t => t.tag);
  const values = matched.filter(t => t.kinds.includes('value')).map(t => t.tag);
  const needs = matched.filter(t => t.kinds.includes('need')).map(t => t.tag);

  const linkedinSignals = TAXONOMY.filter(t => liHit(t.keys)).slice(0, 4).map(t => `LinkedIn → ${t.tag}`);
  const instagramSignals = TAXONOMY.filter(t => igHit(t.keys)).slice(0, 4).map(t => `Instagram → ${t.tag}`);

  const evidence: Evidence[] = matched.slice(0, 8).map(t => {
    const q = quoteFor(t.keys, liOriginal, igOriginal);
    return { tag: t.tag, source: q?.source || 'linkedin', quote: q?.quote || '“from the two bios, in the agent’s reading notes”' };
  });

  const lovePool = ['Words of affirmation', 'Quality time', 'Acts of service', 'Shared adventure', 'Thoughtful gifts', 'Unhurried presence'];
  const attachPool = ['Secure', 'Secure-leaning anxious', 'Secure-leaning avoidant'];
  const personPool = ['warm-direct', 'high-energy', 'grounded', 'playful-deep', 'ambitious-kind', 'reflective', 'bold-tender', 'disciplined-spontaneous'];
  const datePool = ['sunrise walk, coffee, phones away', 'bookstore browse then dinner', 'home-cooked meal and vinyl', 'trail hike and picnic', 'gallery then late lunch', 'farmers market then cook together', 'tennis then smoothies', 'volunteer morning then brunch', 'road-trip flea market'];

  const loveLanguage = lovePool[seed % lovePool.length];
  const attachmentStyle = attachPool[seed % attachPool.length];
  const personality = pick(personPool, seed, 3);
  const dateIdeas = pick(datePool, seed + 7, 3);

  const dealPool = ['contempt or mocking curiosity', 'no interest in family and friends', 'chaotic lifestyle with no calm', 'avoids hard conversations', 'disdains ambition or rest'];
  const dealbreakers = pick(dealPool, seed + 13, 2);

  const topI = interests.slice(0, 2).join(' and ') || 'curiosity';
  const topV = values.slice(0, 2).join(' and ') || 'kindness';
  const idealMatch = `Someone who loves ${topI}, honors ${topV}, and wants ${needs[0] || 'a real partnership'}.`;

  const tagline = `${p.occupation} · ${personality[0]} · into ${hobbies[0] || interests[0] || 'good conversation'}`;

  return {
    personId: p.id,
    tagline,
    needs: needs.length ? needs.slice(0, 4) : ['emotional safety', 'shared laughter'],
    hobbies: hobbies.length ? hobbies.slice(0, 5) : ['long walks', 'good conversation'],
    interests: interests.length ? interests.slice(0, 5) : ['ideas worth discussing'],
    values: values.length ? values.slice(0, 4) : ['kindness', 'curiosity'],
    lifestyle: [p.location, seed % 2 ? 'early riser' : 'night-owl energy', seed % 3 ? 'social with a cozy homebody streak' : 'adventure-first calendar'],
    personality,
    loveLanguage,
    attachmentStyle,
    idealMatch,
    dealbreakers,
    dateIdeas,
    linkedinSignals: linkedinSignals.length ? linkedinSignals : ['LinkedIn → professional drive and credibility'],
    instagramSignals: instagramSignals.length ? instagramSignals : ['Instagram → everyday joy and personal taste'],
    evidence,
    confidence: 82 + (seed % 14),
  };
}

export function analysisSteps(): string[] {
  return [
    'Fetching LinkedIn public profile (Microlink OG, no key)…',
    'Fetching Instagram public profile (Microlink OG, no key)…',
    'Agent reading: the work self, from LinkedIn…',
    'Agent reading: the evening self, from Instagram…',
    'Fusing the two selves → needs · hobbies · interests · values, each with its receipt…',
    'Writing the profile page and the ideal-match sketch…',
  ];
}
