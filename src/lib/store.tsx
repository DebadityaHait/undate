import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PEOPLE } from '../data/people';
import type { AgentProfile, DateResult, PersonInput } from './types';
import { analyzePerson } from './analyzer';
import { rankFor, simulateDate } from './dating';

interface Store {
  people: PersonInput[];
  profiles: Record<string, AgentProfile>;
  dates: DateResult[];
  addPerson: (p: PersonInput) => void;
  removePerson: (id: string) => void;
  resetDemo: () => void;
  getRanks: (id: string) => ReturnType<typeof rankFor>;
  analyzedCount: number;
}

const Ctx = createContext<Store | null>(null);

const LS_PEOPLE = 'undate.people.v1';

function buildAll(people: PersonInput[]) {
  const profiles: Record<string, AgentProfile> = {};
  people.forEach(p => { profiles[p.id] = analyzePerson(p); });
  const dates: DateResult[] = [];
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      dates.push(simulateDate(people[i], people[j], profiles[people[i].id], profiles[people[j].id]));
    }
  }
  return { profiles, dates };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<PersonInput[]>(() => {
    try {
      const raw = localStorage.getItem(LS_PEOPLE);
      if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr; }
    } catch {}
    return PEOPLE;
  });

  useEffect(() => { try { localStorage.setItem(LS_PEOPLE, JSON.stringify(people)); } catch {} }, [people]);

  const { profiles, dates } = useMemo(() => buildAll(people), [people]);

  const value: Store = {
    people, profiles, dates,
    addPerson: (p) => setPeople(prev => prev.some(x => x.id === p.id) ? prev : [...prev, p]),
    removePerson: (id) => setPeople(prev => prev.filter(x => x.id !== id)),
    resetDemo: () => setPeople(PEOPLE),
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
