// Optional BYOK AI layer. No key → deterministic engine (default, always works).
// With a key → richer profile analysis + livelier date lines. Every call falls back.
import type { AgentProfile, ChatMessage, DateResult, PersonInput } from './types';
import { analyzePerson } from './analyzer';

export interface AISettings { key: string; baseUrl: string; model: string; }
const LS_AI = 'undate.ai.v1';

export const AI_PRESETS = [
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
];

export function getAI(): AISettings | null {
  try {
    const raw = localStorage.getItem(LS_AI);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s.key) return null;
    return s;
  } catch { return null; }
}

export function saveAI(s: AISettings) { try { localStorage.setItem(LS_AI, JSON.stringify(s)); } catch {} }
export function clearAI() { try { localStorage.removeItem(LS_AI); } catch {} }

async function chatJSON(ai: AISettings, system: string, user: string): Promise<any> {
  const res = await fetch(`${ai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ai.key}` },
    body: JSON.stringify({
      model: ai.model,
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}`);
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || '{}';
  return JSON.parse(text);
}

/** Upgrade a deterministic profile with an LLM read of the same two bios. Falls back silently. */
export async function aiEnhanceProfile(p: PersonInput, ai?: AISettings | null): Promise<AgentProfile> {
  const base = analyzePerson(p);
  const s = ai ?? getAI();
  if (!s) return base;
  try {
    const out = await chatJSON(s,
      'You are a warm, precise matchmaker. Read ONLY the two bios given (LinkedIn = work self, Instagram = evening self). Return JSON with keys: tagline, needs[4], hobbies[5], interests[5], values[4], loveLanguage, attachmentStyle, idealMatch, dealbreakers[2], dateIdeas[3]. Short vivid phrases, no emojis.',
      `Name: ${p.name}, ${p.age}. Occupation: ${p.occupation}. Location: ${p.location}.\nLINKEDIN BIO: ${p.linkedinBio || ''}\nINSTAGRAM BIO: ${p.instagramBio || ''}`);
    return {
      ...base,
      tagline: out.tagline || base.tagline,
      needs: out.needs?.slice(0, 4) || base.needs,
      hobbies: out.hobbies?.slice(0, 5) || base.hobbies,
      interests: out.interests?.slice(0, 5) || base.interests,
      values: out.values?.slice(0, 4) || base.values,
      loveLanguage: out.loveLanguage || base.loveLanguage,
      attachmentStyle: out.attachmentStyle || base.attachmentStyle,
      idealMatch: out.idealMatch || base.idealMatch,
      dealbreakers: out.dealbreakers?.slice(0, 2) || base.dealbreakers,
      dateIdeas: out.dateIdeas?.slice(0, 3) || base.dateIdeas,
      confidence: Math.min(97, base.confidence + 6),
      aiEnhanced: true,
    };
  } catch { return base; }
}

/** Remix one date transcript with AI voices. Returns null → keep deterministic lines. */
export async function aiRemixDate(d: DateResult, pa: PersonInput, pb: PersonInput, aprof: AgentProfile, bprof: AgentProfile, ai?: AISettings | null): Promise<ChatMessage[] | null> {
  const s = ai ?? getAI();
  if (!s) return null;
  try {
    const out = await chatJSON(s,
      'You write short dating-show dialogue as two agents, each speaking for their person. Return JSON: {"lines":[{"who":"A"|"B","thinking":"short private agent reasoning","text":"one or two sentences, warm, specific, no emojis"}]} with exactly 8 lines alternating A,B,A,B... Flirt through specifics from the bios, one gentle 2am-truth moment, end with a clear yes or kind no.',
      `${pa.name} (${pa.age}): ${aprof.tagline}. Needs ${aprof.needs.join(', ')}. Loves ${aprof.hobbies.join(', ')}. Values ${aprof.values.join(', ')}.\n${pb.name} (${pb.age}): ${bprof.tagline}. Needs ${bprof.needs.join(', ')}. Loves ${bprof.hobbies.join(', ')}. Values ${bprof.values.join(', ')}.\nMutual score ${d.score}.`);
    const lines = out.lines?.slice(0, 8) || [];
    if (!lines.length) return null;
    let ts = Date.now();
    const t: ChatMessage[] = [{ from: 'system', fromName: 'Harness', text: `First date: ${pa.name.split(' ')[0]} × ${pb.name.split(' ')[0]}, voiced by AI. Mutual ${d.score}.`, ts: ts += 1000 }];
    lines.forEach((l: any, i: number) => {
      const isA = l.who !== 'B';
      t.push({ from: isA ? pa.id : pb.id, fromName: `${(isA ? pa : pb).name.split(' ')[0]}'s agent`, text: String(l.text || '').slice(0, 400), thinking: l.thinking ? String(l.thinking).slice(0, 220) : undefined, ts: ts += 60000 });
      void i;
    });
    return t;
  } catch { return null; }
}
