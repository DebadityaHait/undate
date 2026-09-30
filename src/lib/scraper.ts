// Scraper stack: Microlink (free OG/metadata) + CORS-proxy HTML fallback + manual paste.
// Only two sources per person: LinkedIn URL + Instagram URL. Nothing else.
export interface ScrapeResult {
  url: string;
  source: 'linkedin' | 'instagram';
  title: string;
  description: string;
  image?: string;
  author?: string;
  ok: boolean;
  method: string;
  raw?: string;
}

function detectSource(url: string): 'linkedin' | 'instagram' {
  return url.toLowerCase().includes('instagram') ? 'instagram' : 'linkedin';
}

export function validateLinks(linkedinUrl: string, instagramUrl: string): string | null {
  try {
    const li = new URL(linkedinUrl);
    const ig = new URL(instagramUrl);
    if (!li.hostname.includes('linkedin.com')) return 'LinkedIn URL must be a linkedin.com link';
    if (!ig.hostname.includes('instagram.com')) return 'Instagram URL must be an instagram.com link';
    if (!/^https?:/.test(linkedinUrl) || !/^https?:/.test(instagramUrl)) return 'Links must start with https://';
    return null;
  } catch {
    return 'Both links must be valid https URLs';
  }
}

async function viaMicrolink(url: string): Promise<Partial<ScrapeResult>> {
  const api = `https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true&insights=true`;
  const res = await fetch(api);
  if (!res.ok) throw new Error(`microlink ${res.status}`);
  const json = await res.json();
  const d = json?.data || {};
  return {
    title: d.title || d.publisher || '',
    description: d.description || '',
    image: d.image?.url || d.logo?.url,
    author: d.author || d.publisher || '',
  };
}

async function viaAllOrigins(url: string): Promise<string> {
  const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const res = await fetch(prox);
  if (!res.ok) throw new Error(`proxy ${res.status}`);
  const text = await res.text();
  return text.slice(0, 20000);
}

function parseOG(html: string): { title: string; description: string; image?: string } {
  const pick = (re: RegExp) => {
    const m = html.match(re);
    return m ? m[1].slice(0, 500) : '';
  };
  const title =
    pick(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    pick(/<title>([^<]+)<\/title>/i);
  const description =
    pick(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
    pick(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const image = pick(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || undefined;
  return { title, description, image };
}

export async function scrapeUrl(url: string, manualFallback?: string): Promise<ScrapeResult> {
  const source = detectSource(url);
  // 1) Microlink
  try {
    const m = await viaMicrolink(url);
    if (m.title || m.description) {
      return { url, source, title: m.title || url, description: m.description || manualFallback || '', image: m.image, author: m.author, ok: true, method: 'microlink:opengraph+insights (no key)' };
    }
  } catch { /* fall through */ }
  // 2) CORS proxy + OG parse
  try {
    const html = await viaAllOrigins(url);
    const og = parseOG(html);
    if (og.title || og.description) {
      return { url, source, title: og.title || url, description: og.description || manualFallback || '', image: og.image, ok: true, method: 'allorigins-cors-proxy + opengraph parse' };
    }
  } catch { /* fall through */ }
  // 3) manual / cached fallback — still only from those two URLs' pasted content
  if (manualFallback) {
    return { url, source, title: url, description: manualFallback, ok: true, method: 'manual-paste (sites block bots, user pastes public bio)' };
  }
  return { url, source, title: url, description: '', ok: false, method: 'blocked (LinkedIn/IG anti-bot) — paste public bio to continue' };
}

export async function scrapePerson(linkedinUrl: string, instagramUrl: string, liFallback = '', igFallback = '') {
  const [li, ig] = await Promise.all([
    scrapeUrl(linkedinUrl, liFallback),
    scrapeUrl(instagramUrl, igFallback),
  ]);
  return { li, ig };
}
