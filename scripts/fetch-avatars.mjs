/**
 * Build-time face pipeline for undate.
 *
 * Guide-compliant path (needs APIFY_TOKEN):
 *   - Instagram: apify/instagram-profile-scraper  → profile_pic_url (_hd)
 *   - LinkedIn:  sabania/linkedin-scraper         → profileImage (no login)
 *   Downloads both to public/avatars/<id>-ig.jpg / <id>-li.jpg
 *
 * Keyless fallback (default, no token):
 *   - Microlink OG image for the IG + LinkedIn URLs
 *   - unavatar.io provider images
 *
 * Output: src/data/avatars.ts manifest. UI falls back to initials when missing.
 * Run: node scripts/fetch-avatars.mjs  (or APIFY_TOKEN=xxx node scripts/fetch-avatars.mjs)
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { PEOPLE } from '../src/data/people.ts';

const OUT_DIR = new URL('../public/avatars/', import.meta.url);
const MANIFEST = new URL('../src/data/avatars.ts', import.meta.url);
const TOKEN = process.env.APIFY_TOKEN || '';
const CONCURRENCY = 5;
const TIMEOUT_MS = 15000;

const igHandle = (url) => url.replace(/\/$/, '').split('/').pop().split('?')[0].toLowerCase();

async function fetchTimeout(url, opts = {}) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { ...opts, signal: c.signal, redirect: 'follow' });
    return r;
  } finally { clearTimeout(t); }
}

async function downloadImage(url, destName) {
  try {
    const r = await fetchTimeout(url);
    const ct = r.headers.get('content-type') || '';
    if (!r.ok || !ct.startsWith('image/')) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 3000) return null; // placeholder / 1px guard
    const { writeFileSync } = await import('node:fs');
    writeFileSync(new URL(destName, OUT_DIR), buf);
    return `/avatars/${destName}`;
  } catch { return null; }
}

async function microlinkImage(pageUrl) {
  try {
    const r = await fetchTimeout(`https://api.microlink.io?url=${encodeURIComponent(pageUrl)}&meta=true`);
    if (!r.ok) return null;
    const j = await r.json();
    return j?.data?.image?.url || null;
  } catch { return null; }
}

// ---- Apify path ----
async function apifyRun(actor, input) {
  const r = await fetchTimeout(`https://api.apify.com/v2/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error(`apify ${actor}: ${r.status}`);
  return r.json();
}

async function viaApify(person) {
  const out = {};
  try {
    const ig = await apifyRun('apify/instagram-profile-scraper', { usernames: [igHandle(person.instagramUrl)] });
    const pic = ig?.[0]?.profile_pic_url_hd || ig?.[0]?.profile_pic_url;
    if (pic) {
      const saved = await downloadImage(pic, `${person.id}-ig.jpg`);
      if (saved) out.ig = saved;
    }
  } catch (e) { console.log(`  apify ig failed for ${person.id}: ${e.message}`); }
  try {
    const li = await apifyRun('sabania/linkedin-scraper', { scrapeType: 'profiles', urls: [person.linkedinUrl] });
    const img = li?.[0]?.profileImage || li?.[0]?.profile_image;
    if (img) {
      const saved = await downloadImage(img, `${person.id}-li.jpg`);
      if (saved) out.li = saved;
    }
  } catch (e) { console.log(`  apify li failed for ${person.id}: ${e.message}`); }
  return out;
}

// ---- Keyless path ----
async function viaFree(person) {
  const out = {};
  const handle = igHandle(person.instagramUrl);
  const candsIg = [
    (async () => microlinkImage(person.instagramUrl))(),
    (async () => `https://unavatar.io/instagram/${handle}`)(),
  ];
  const candsLi = [
    (async () => microlinkImage(person.linkedinUrl))(),
    (async () => `https://unavatar.io/linkedin/${handle}`)(),
  ];
  for (const p of candsIg) {
    const url = await p;
    if (!url) continue;
    const saved = await downloadImage(url, `${person.id}-ig.jpg`);
    if (saved) { out.ig = saved; break; }
  }
  for (const p of candsLi) {
    const url = await p;
    if (!url) continue;
    const saved = await downloadImage(url, `${person.id}-li.jpg`);
    if (saved) { out.li = saved; break; }
  }
  return out;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(TOKEN ? 'Mode: Apify (token present)' : 'Mode: keyless fallback (Microlink + unavatar). Set APIFY_TOKEN for HD Apify pulls.');
  const manifest = {};
  const queue = [...PEOPLE];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const person = queue.shift();
      console.log(`… ${person.id}`);
      const got = TOKEN ? await viaApify(person) : await viaFree(person);
      if (!Object.keys(got).length && TOKEN) Object.assign(got, await viaFree(person)); // backfill
      manifest[person.id] = got;
      console.log(`  ✓ ${person.id}: ${JSON.stringify(got) || 'no face (initials fallback)'}`);
    }
  });
  await Promise.all(workers);
  const hits = Object.values(manifest).filter((v) => Object.keys(v).length).length;
  writeFileSync(MANIFEST, `// Auto-generated by scripts/fetch-avatars.mjs — do not hand-edit.\nexport const AVATARS: Record<string, { ig?: string; li?: string }> = ${JSON.stringify(manifest, null, 2)};\n`);
  console.log(`\nDone: ${hits}/${PEOPLE.length} people have at least one photo. Manifest → src/data/avatars.ts`);
}

main();
