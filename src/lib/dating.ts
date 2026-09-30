import type { AgentProfile, ChatMessage, DateResult, PersonInput } from './types';

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0.2;
  const A = new Set(a.map(s => s.toLowerCase()));
  const B = new Set(b.map(s => s.toLowerCase()));
  let inter = 0;
  A.forEach(x => { if (B.has(x)) inter++; });
  return inter / Math.max(A.size, B.size);
}

export function compatibility(a: AgentProfile, b: AgentProfile, pa: PersonInput, pb: PersonInput): { score: number; chemistry: number; valuesFit: number; lifestyleFit: number; highlights: string[]; frictions: string[]; verdict: string } {
  const intOverlap = jaccard([...a.interests, ...a.hobbies], [...b.interests, ...b.hobbies]);
  const valOverlap = jaccard(a.values, b.values);
  const needOverlap = jaccard(a.needs, b.needs);
  const ageGap = Math.abs(pa.age - pb.age);
  const ageFit = ageGap <= 5 ? 1 : ageGap <= 10 ? 0.85 : ageGap <= 18 ? 0.65 : 0.45;
  const locBonus = pa.location.split(',')[1]?.trim() === pb.location.split(',')[1]?.trim() ? 0.06 : 0;

  const chemistry = Math.round((0.55 * intOverlap + 0.25 * needOverlap + 0.2 * ageFit) * 100);
  const valuesFit = Math.round((0.6 * valOverlap + 0.25 * needOverlap + 0.15 * ageFit) * 100);
  const lifestyleFit = Math.round((0.5 * ageFit + 0.3 * intOverlap + 0.2 * valOverlap) * 100);
  let score = Math.round(chemistry * 0.4 + valuesFit * 0.35 + lifestyleFit * 0.25 + locBonus * 100);
  score = Math.max(38, Math.min(98, score + ((pa.id.length + pb.id.length) % 7) - 3));

  const shared = [...a.interests, ...a.hobbies].filter(x => [...b.interests, ...b.hobbies].map(y => y.toLowerCase()).includes(x.toLowerCase()));
  const sharedV = a.values.filter(x => b.values.map(y => y.toLowerCase()).includes(x.toLowerCase()));
  const highlights: string[] = [];
  if (shared.length) highlights.push(`Shared spark: ${shared.slice(0, 3).join(', ')}`);
  if (sharedV.length) highlights.push(`Same compass: ${sharedV.slice(0, 2).join(', ')}`);
  if (ageGap <= 8) highlights.push(`Easy rhythm — ages ${pa.age} & ${pb.age} want similar seasons`);
  if (!highlights.length) highlights.push(`Complementary curiosity — ${a.personality[0]} meets ${b.personality[0]}`);
  highlights.push(`Date idea both would love: ${a.dateIdeas[0]}`);

  const frictions: string[] = [];
  if (ageGap > 15) frictions.push(`Age-season gap (${ageGap}y) — different daily tempo to navigate`);
  if (!sharedV.length) frictions.push('Values need explicit conversation early');
  frictions.push(`${pa.name.split(' ')[0]}'s dealbreaker to watch: ${a.dealbreakers[0]}`);

  const verdict = score >= 85 ? 'Electric — meet this week.' : score >= 72 ? 'Strong — second date highly likely.' : score >= 60 ? 'Warm maybe — one great date, then decide.' : 'Kind pass — better as friends.';
  return { score, chemistry, valuesFit, lifestyleFit, highlights, frictions, verdict };
}

const OPENERS = [
  (n: string, h: string) => `Okay, agent-briefed confession: I stalked your Instagram (with love) — that ${h} thing? Tell me the story behind it. — ${n}`,
  (n: string, h: string) => `${n} here (via my agent, who apparently now knows me better than I do). My LinkedIn says serious, my IG says ${h}. Which one is lying?`,
  (n: string, h: string) => `My agent told me to ask about ${h} and NOT to talk about work for 5 minutes. So… ${h}. Go. — ${n}`,
];

const REPLIES = [
  (n: string, h: string, v: string) => `Ha — ${h} is my reset button. Work is ${v} most days, but ${h} keeps me human. What keeps *you* human, then? — ${n}`,
  (n: string, h: string, v: string) => `Honestly? ${h} started as a hobby and became a value — ${v}. My agent nailed that. What's something your agent got spookily right about you? — ${n}`,
  (n: string, h: string) => `I love that your agent led with ${h}. Mine keeps pushing me to be brave about love languages — mine's ${h}. Too much for date one? — ${n}`,
];

const DEEPENERS = [
  (n: string, need: string) => `Real talk — what I actually need is ${need}. Not the LinkedIn version. The 2am version. Do you get that? — ${n}`,
  (n: string, val: string) => `I think I judge fit by ${val}. If that's missing, the rest fades. Where do you land on that? — ${n}`,
  (n: string, idea: string) => `Forget fancy — my ideal second date is ${idea}. Would you say yes, or counter-offer? — ${n}`,
];

const CLOSERS = [
  (n: string, s: number) => s >= 72 ? `I'm not letting my agent fumble this — I'd love a real date. Are you in? — ${n}` : `I've loved this — honest answer? I feel friendship-chemistry more than spark. Still glad our agents met. — ${n}`,
  (n: string, s: number) => s >= 72 ? `My agent is already drafting date two. Overriding it to ask myself: can I see you again? — ${n}` : `Thank you for the honesty practice. My agent learned a lot even if we don't match. — ${n}`,
];

export function simulateDate(pa: PersonInput, pb: PersonInput, aprof: AgentProfile, bprof: AgentProfile): DateResult {
  const comp = compatibility(aprof, bprof, pa, pb);
  const fn = pa.name.split(' ')[0];
  const gn = pb.name.split(' ')[0];
  const t: ChatMessage[] = [];
  let ts = Date.now();
  const push = (from: string, fromName: string, text: string, thinking?: string) => { t.push({ from, fromName, text, thinking, ts: ts += 60000 }); };

  push('system', 'Harness', `☽ Date ${fn} × ${gn} — agents briefed only from LinkedIn + Instagram. No other sources. Compatibility pre-score ${comp.score}.`);
  const hA = aprof.hobbies[0] || aprof.interests[0] || 'morning rituals';
  const hB = bprof.hobbies[0] || bprof.interests[0] || 'long walks';
  push(pa.id, `${fn}'s agent`, OPENERS[0](fn, hB), `I represent ${pa.name} (${pa.occupation}). From IG I see ${hB}-energy. Open warm, ask about them, not me.`);
  push(pb.id, `${gn}'s agent`, REPLIES[0](gn, hB, bprof.values[0] || 'building'), `I am ${pb.name}'s agent. They asked about ${hB}. Answer honestly, return the question, reveal ${bprof.loveLanguage}.`);
  push(pa.id, `${fn}'s agent`, OPENERS[1](fn, hA), `Balance LinkedIn-serious vs IG-playful. Invite them to call out the gap.`);
  push(pb.id, `${gn}'s agent`, REPLIES[1](gn, hA, bprof.values[0] || 'kindness'), `Show self-awareness. Mention what my agent got right.`);
  push(pa.id, `${fn}'s agent`, DEEPENERS[0](fn, aprof.needs[0] || 'emotional safety'), `Escalate to needs. 2am-truth test.`);
  push(pb.id, `${gn}'s agent`, DEEPENERS[1](gn, bprof.values[0] || 'honesty'), `Meet depth with depth. Name my core value.`);
  push(pa.id, `${fn}'s agent`, DEEPENERS[2](fn, aprof.dateIdeas[0]), `Propose concrete second date: ${aprof.dateIdeas[0]}.`);
  push(pb.id, `${gn}'s agent`, CLOSERS[0](gn, comp.score), `Close based on chemistry ${comp.chemistry}. ${comp.verdict}`);

  return { id: `${pa.id}--${pb.id}`, aId: pa.id, bId: pb.id, score: comp.score, chemistry: comp.chemistry, valuesFit: comp.valuesFit, lifestyleFit: comp.lifestyleFit, verdict: comp.verdict, highlights: comp.highlights, frictions: comp.frictions, transcript: t };
}

export function rankFor(personId: string, dates: DateResult[]): { personId: string; score: number; reason: string; dateId: string }[] {
  return dates
    .filter(d => d.aId === personId || d.bId === personId)
    .map(d => {
      const other = d.aId === personId ? d.bId : d.aId;
      return { personId: other, score: d.score, reason: `${d.verdict} ${d.highlights[0] || ''}`, dateId: d.id };
    })
    .sort((x, y) => y.score - x.score);
}
