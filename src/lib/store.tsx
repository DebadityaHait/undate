import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PEOPLE } from '../data/people';
import type { AgentProfile, DateResult, Introduction, PersonInput } from './types';
import { analyzePerson } from './analyzer';
import { makeIntroductions, rankFor, runSecondRound, simulateDate } from './dating';

interface Store {
  people: PersonInput[];
  profiles: Record<string, AgentProfile>;
  dates: DateResult[];
  finalists: DateResult[];
  introductions: Introduction[];
  addPerson: (p: PersonInput) => void;
  removePerson: (id: string) => void;
  resetDemo: () => void;
  enhanceProfile: (id: string, p: AgentProfile) => void;
  getRanks: (id: string) => ReturnType<typeof rankFor>;
  analyzedCount: number;
}

const Ctx = createContext<Store | null>(null);
const LS_PEOPLE = 'undate.people.v1';
const LS_OVERRIDE = 'undate.overrides.v1';

function buildAll(people: PersonInput[], overrides: Record<string, AgentProfile>) {
  const profiles: Record<string, AgentProfile> = {};
  people.forEach(p => { profiles[p.id] = overrides[p.id] || analyzePerson(p); });
  const first: DateResult[] = [];
  for (let i = 0; i < people.length; i++)
    for (let j = i + 1; j < people.length; j++)
      first.push(simulateDate(people[i], people[j], profiles[people[i].id], profiles[people[j].id]));
  const dates = runSecondRound(first, people, profiles, 12);
  const finalists = dates.filter(d => d.status !== 'first');
  const introductions = makeIntroductions(dates);
  return { profiles, dates, finalists, introductions };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<PersonInput[]>(() => {
    try {
      const raw = localStorage.getItem(LS_PEOPLE);
      if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr; }
    } catch {}
    return PEOPLE;
  });
  const [overrides, setOverrides] = useState<Record<string, AgentProfile>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_OVERRIDE) || '{}'); } catch { return {}; }
  });

  useEffect(() => { try { localStorage.setItem(LS_PEOPLE, JSON.stringify(people)); } catch {} }, [people]);
  useEffect(() => { try { localStorage.setItem(LS_OVERRIDE, JSON.stringify(overrides)); } catch {} }, [overrides]);

  const { profiles, dates, finalists, introductions } = useMemo(() => buildAll(people, overrides), [people, overrides]);

  const value: Store = {
    people, profiles, dates, finalists, introductions,
    addPerson: (p) => setPeople(prev => prev.some(x => x.id === p.id) ? prev : [...prev, p]),
    removePerson: (id) => setPeople(prev => prev.filter(x => x.id !== id)),
    resetDemo: () => { setPeople(PEOPLE); setOverrides({}); },
    enhanceProfile: (id, p) => setOverrides(prev => ({ ...prev, [id]: p })),
    getRanks: (id) => rankFor(id, dates),
    analyzedCount: people.length,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('Store missing');
  return s;
}

export function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
