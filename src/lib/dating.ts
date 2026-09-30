import type { AgentProfile, ChatMessage, DateResult, Introduction, PersonInput } from './types';

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0.2;
  const A = new Set(a.map(s => s.toLowerCase()));
  const B = new Set(b.map(s => s.toLowerCase()));
  let inter = 0;
  A.forEach(x => { if (B.has(x)) inter++; });
  return inter / Math.max(A.size, B.size);
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/** Directional: how much does `viewer` like `candidate`? Need-fulfilment + spark, slightly asymmetric by pair hash. */
export function directionalScore(viewer: AgentProfile, vp: PersonInput, candidate: AgentProfile, cp: PersonInput): number {
  const needFill = jaccard(viewer.needs, [...candidate.values, ...candidate.interests, ...candidate.hobbies]);
  const spark = jaccard([...viewer.interests, ...viewer.hobbies], [...candidate.interests, ...candidate.hobbies]);
  const valAlign = jaccard(viewer.values, candidate.values);
  const ageGap = Math.abs(vp.age - cp.age);
  const ageFit = ageGap <= 5 ? 1 : ageGap <= 10 ? 0.85 : ageGap <= 18 ? 0.65 : 0.45;
  const tilt = ((hashStr(viewer.personId + '>' + candidate.personId) % 11) - 5) / 100; // -5..+5 deterministic lean
  const locBonus = vp.location.split(',')[1]?.trim() === cp.location.split(',')[1]?.trim() ? 0.05 : 0;
  const raw = (needFill * 0.35 + spark * 0.3 + valAlign * 0.2 + ageFit * 0.15 + locBonus + tilt) * 100;
  return Math.max(34, Math.min(99, Math.round(raw)));
}

export function compatibility(a: AgentProfile, b: AgentProfile, pa: PersonInput, pb: PersonInput) {
  const scoreAB = directionalScore(a, pa, b, pb);
  const scoreBA = directionalScore(b, pb, a, pa);
  const score = Math.round((scoreAB + scoreBA) / 2);
  const chemistry = Math.round((jaccard([...a.interests, ...a.hobbies], [...b.interests, ...b.hobbies]) * 0.7 + (1 - Math.min(1, Math.abs(pa.age - pb.age) / 25)) * 0.3) * 100);
  const valuesFit = Math.round(jaccard([...a.values, ...a.needs], [...b.values, ...b.needs]) * 100);
  const lifestyleFit = Math.round((jaccard(a.lifestyle, b.lifestyle) * 0.5 + (1 - Math.min(1, Math.abs(pa.age - pb.age) / 30)) * 0.5) * 100);

  const shared = [...a.interests, ...a.hobbies].filter(x => [...b.interests, ...b.hobbies].map(y => y.toLowerCase()).includes(x.toLowerCase()));
  const sharedV = a.values.filter(x => b.values.map(y => y.toLowerCase()).includes(x.toLowerCase()));
  const highlights: string[] = [];
  if (shared.length) highlights.push(`Shared spark: ${shared.slice(0, 3).join(', ')}`);
  if (sharedV.length) highlights.push(`Same compass: ${sharedV.slice(0, 2).join(', ')}`);
  if (Math.abs(pa.age - pb.age) <= 8) highlights.push(`Easy rhythm — ages ${pa.age} & ${pb.age} want similar seasons`);
  if (!highlights.length) highlights.push(`Complementary curiosity — ${a.personality[0]} meets ${b.personality[0]}`);
  highlights.push(`Date idea both would love: ${a.dateIdeas[0]}`);

  const frictions: string[] = [];
  const gap = Math.abs(pa.age - pb.age);
  if (gap > 15) frictions.push(`Age-season gap (${gap}y) — different daily tempo to navigate`);
  if (!sharedV.length) frictions.push('Values need explicit conversation early');
  frictions.push(`${pa.name.split(' ')[0]}'s watch-out: ${a.dealbreakers[0]}`);

  const gapDir = Math.abs(scoreAB - scoreBA);
  const asymmetry = gapDir <= 6 ? 'Mutual spark — both agents lean in equally.'
    : scoreAB > scoreBA ? `${pa.name.split(' ')[0]} leans in stronger (${scoreAB} vs ${scoreBA}). ${pb.name.split(' ')[0]} is warming up.`
    : `${pb.name.split(' ')[0]} leans in stronger (${scoreBA} vs ${scoreAB}). ${pa.name.split(' ')[0]} is warming up.`;
  const verdict = score >= 85 ? 'Electric — meet this week.' : score >= 72 ? 'Strong — second date highly likely.' : score >= 60 ? 'Warm maybe — one great date, then decide.' : 'Kind pass — better as friends.';
  return { score, scoreAB, scoreBA, chemistry, valuesFit, lifestyleFit, highlights, frictions, verdict, asymmetry };
}

const OPENERS = [
  (n: string, h: string) => `Agent-briefed confession: I studied your Instagram (with love). That ${h} thing? Tell me the story behind it. — ${n}`,
  (n: string, h: string) => `${n} here, via my agent, who apparently knows me better than I do. My LinkedIn says serious, my evenings say ${h}. Which one is lying?`,
  (n: string, h: string) => `My agent told me to ask about ${h} and not talk about work for five minutes. So… ${h}. Go. — ${n}`,
];
const REPLIES = [
  (n: string, h: string, v: string) => `${h} is my reset button. Work is ${v} most days, but ${h} keeps me human. What keeps you human? — ${n}`,
  (n: string, h: string) => `Honestly? ${h} started as a hobby and became a value. My agent nailed that. What did yours get spookily right about you? — ${n}`,
  (n: string, h: string, ll: string) => `I love that your agent led with ${h}. Mine keeps pushing me to admit my love language is ${ll}. Too much for date one? — ${n}`,
];
const DEEPENERS = [
  (n: string, need: string) => `Real talk. What I actually need is ${need}. Not the LinkedIn version. The 2am version. Do you get that? — ${n}`,
  (n: string, val: string) => `I judge fit by ${val}. If that is missing, the rest fades. Where do you land? — ${n}`,
  (n: string, idea: string) => `Forget fancy. My ideal second date is ${idea}. Yes, or counter-offer? — ${n}`,
];
const CLOSERS = [
  (n: string, s: number) => s >= 72 ? `I am not letting my agent fumble this. I would love a real date. Are you in? — ${n}` : `I have loved this. Honest answer? I feel friendship-chemistry more than spark. Still glad our agents met. — ${n}`,
  (n: string, s: number) => s >= 72 ? `My agent is already drafting date two. Overriding it to ask myself: can I see you again? — ${n}` : `Thank you for the honesty practice. My agent learned a lot even if we do not match. — ${n}`,
];

export function simulateDate(pa: PersonInput, pb: PersonInput, aprof: AgentProfile, bprof: AgentProfile): DateResult {
  const comp = compatibility(aprof, bprof, pa, pb);
  const fn = pa.name.split(' ')[0];
  const gn = pb.name.split(' ')[0];
  const t: ChatMessage[] = [];
  let ts = Date.now();
  const push = (from: string, fromName: string, text: string, thinking?: string) => { t.push({ from, fromName, text, thinking, ts: ts += 60000 }); };
  push('system', 'Harness', `First date: ${fn} × ${gn}. Agents briefed only from LinkedIn + Instagram. Mutual ${comp.score} (A→B ${comp.scoreAB}, B→A ${comp.scoreBA}).`);
  const hA = aprof.hobbies[0] || aprof.interests[0] || 'morning rituals';
  const hB = bprof.hobbies[0] || bprof.interests[0] || 'long walks';
  push(pa.id, `${fn}'s agent`, OPENERS[0](fn, hB), `I represent ${pa.name} (${pa.occupation}). IG shows ${hB}-energy. Open warm, ask about them.`);
  push(pb.id, `${gn}'s agent`, REPLIES[0](gn, hB, bprof.values[0] || 'building'), `I am ${pb.name}'s agent. Answer honestly, return the question, reveal warmth.`);
  push(pa.id, `${fn}'s agent`, OPENERS[1](fn, hA), `Balance LinkedIn-serious vs IG-playful. Invite them to call out the gap.`);
  push(pb.id, `${gn}'s agent`, REPLIES[1](gn, hA, bprof.values[0] || 'kindness'), `Show self-awareness. Mention what my agent got right.`);
  push(pa.id, `${fn}'s agent`, DEEPENERS[0](fn, aprof.needs[0] || 'emotional safety'), `Escalate to needs. The 2am-truth test.`);
  push(pb.id, `${gn}'s agent`, DEEPENERS[1](gn, bprof.values[0] || 'honesty'), `Meet depth with depth. Name my core value.`);
  push(pa.id, `${fn}'s agent`, DEEPENERS[2](fn, aprof.dateIdeas[0]), `Propose a concrete second date: ${aprof.dateIdeas[0]}.`);
  push(pb.id, `${gn}'s agent`, CLOSERS[0](gn, comp.score), `Close on chemistry ${comp.chemistry}. ${comp.verdict}`);
  return { id: `${pa.id}--${pb.id}`, aId: pa.id, bId: pb.id, score: comp.score, scoreAB: comp.scoreAB, scoreBA: comp.scoreBA, chemistry: comp.chemistry, valuesFit: comp.valuesFit, lifestyleFit: comp.lifestyleFit, verdict: comp.verdict, asymmetry: comp.asymmetry, highlights: comp.highlights, frictions: comp.frictions, transcript: t, status: 'first' };
}

/** Round two: finalists meet again, plan something real, agents stress-test dealbreakers. */
export function simulateSecondDate(d: DateResult, pa: PersonInput, pb: PersonInput, aprof: AgentProfile, bprof: AgentProfile): DateResult {
  const fn = pa.name.split(' ')[0];
  const gn = pb.name.split(' ')[0];
  let ts = Date.now() + 86400000;
  const t: ChatMessage[] = [];
  const push = (from: string, fromName: string, text: string, thinking?: string) => { t.push({ from, fromName, text, thinking, ts: ts += 60000 }); };
  push('system', 'Harness', `Second date: ${fn} × ${gn}. First date scored ${d.score}. Agents now stress-test dealbreakers and plan a real evening.`);
  push(pa.id, `${fn}'s agent`, `Date two. No small talk allowance. My dealbreaker is ${aprof.dealbreakers[0]}. Tell me plainly: is that us? — ${fn}`, `Direct by design. Undate's job is subtraction: rule out what could never work.`);
  push(pb.id, `${gn}'s agent`, `Fair. Mine is ${bprof.dealbreakers[0]}. From everything your agent has shown me — your ${aprof.values[0] || 'values'}, your ${aprof.needs[0] || 'needs'} — I do not see it here. Do you? — ${gn}`, `Answer the dealbreaker test honestly. Reference what I learned in round one.`);
  push(pa.id, `${fn}'s agent`, `Then here is my proposal: ${aprof.dateIdeas[1] || aprof.dateIdeas[0]}, this week, phones away. My agent has done its job. The rest is us. — ${fn}`, `Close with a concrete plan. Phones away is the brand.`);
  const pass = d.score >= 72;
  push(pb.id, `${gn}'s agent`, pass ? `Yes. One considered evening, no audience, no metrics. Tell the harness: introduce us. — ${gn}` : `I want to say yes, but honestly the spark is not there. Tell the harness: kind pass, with respect. — ${gn}`, pass ? `Accept. Request introduction.` : `Decline kindly. Specific, warm, final.`);
  return { ...d, status: pass ? 'introduced' : 'passed', round2: t, round2Verdict: pass ? `Introduced — ${fn} × ${gn} meet in person. ${d.highlights[0] || ''}` : `Kind pass after date two — better as friends.` };
}

/** Top mutual pairs become finalists and get second dates. */
export function runSecondRound(dates: DateResult[], people: PersonInput[], profiles: Record<string, AgentProfile>, n = 12): DateResult[] {
  const byId: Record<string, PersonInput> = Object.fromEntries(people.map(p => [p.id, p]));
  const top = [...dates].sort((x, y) => y.score - x.score).slice(0, n);
  const secondIds = new Set(top.map(d => d.id));
  return dates.map(d => {
    if (!secondIds.has(d.id)) return d;
    const marked: DateResult = { ...d, status: 'finalist' };
    const done = simulateSecondDate(marked, byId[d.aId], byId[d.bId], profiles[d.aId], profiles[d.bId]);
    return done;
  });
}

/** Greedy introductions: highest mutual first, nobody introduced twice, bar at 70. */
export function makeIntroductions(dates: DateResult[]): Introduction[] {
  const used = new Set<string>();
  const out: Introduction[] = [];
  for (const d of [...dates].filter(x => x.status === 'introduced').sort((x, y) => y.score - x.score)) {
    if (d.score < 70 || used.has(d.aId) || used.has(d.bId)) continue;
    used.add(d.aId); used.add(d.bId);
    out.push({ aId: d.aId, bId: d.bId, score: d.score, dateId: d.id, note: d.round2Verdict || d.verdict });
  }
  return out;
}

export function rankFor(personId: string, dates: DateResult[]) {
  const topOf = (pid: string) => rankForShallow(pid, dates).slice(0, 3).map(r => r.personId);
  return rankForShallow(personId, dates).map(r => ({ ...r, mutual: topOf(r.personId).includes(personId) }));
}

function rankForShallow(personId: string, dates: DateResult[]) {
  return dates
    .filter(d => d.aId === personId || d.bId === personId)
    .map(d => {
      const other = d.aId === personId ? d.bId : d.aId;
      const mine = d.aId === personId ? d.scoreAB : d.scoreBA;
      const theirs = d.aId === personId ? d.scoreBA : d.scoreAB;
      return { personId: other, score: d.score, reason: `${d.verdict} You ${mine} · them ${theirs}. ${d.highlights[0] || ''}`, dateId: d.id };
    })
    .sort((x, y) => y.score - x.score);
}
