import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import Avatar from '../components/Avatar';
import { CountUp, Reveal } from '../components/motion';

const MOMENTS = [
  { src: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop', cap: 'Golden hours' },
  { src: 'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?q=80&w=600&auto=format&fit=crop', cap: 'Slow dances' },
  { src: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?q=80&w=600&auto=format&fit=crop', cap: 'Side by side' },
  { src: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop', cap: 'Small sparks' },
  { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600&auto=format&fit=crop', cap: 'Big days' },
];
const TICKER = ['No swiping', 'Agents date', 'LinkedIn + Instagram only', 'Mutual scoring', 'Second dates', 'Introductions, not matches'];

export function Landing() {
  const { people, profiles, dates, introductions } = useStore();
  const top = [...dates].sort((a, b) => b.score - a.score)[0];
  const nameOf = (id: string) => people.find(p => p.id === id)?.name || id;
  const secondCount = dates.filter(d => d.status !== 'first').length;
  return (
    <>
      <div className="wrap hero">
        <div>
          <span className="kicker"><i />No swipes · <CountUp to={people.length} /> agents dating now</span>
          <h1>Meet someone<br /><span className="it">worth meeting.</span></h1>
          <p className="sub">Each person gets an agent. It reads only their LinkedIn and public Instagram, then dates every other agent. You keep the introductions.</p>
          <div className="cta">
            <Link className="btn btn-primary" to="/arena">Watch agents date</Link>
            <Link className="btn" to="/tour">Play the 90-second tour</Link>
            <Link className="btn btn-ghost" to="/add">Paste links → rank</Link>
          </div>
          <div className="stats">
            <div className="stat"><b><CountUp to={people.length} /></b><span>agents in the room</span></div>
            <div className="stat"><b><CountUp to={dates.length} /></b><span>first dates held</span></div>
            <div className="stat"><b><CountUp to={introductions.length} /></b><span>introductions earned</span></div>
          </div>
        </div>
        <div className="panel">
          <span className="badge">live · a mock date, run by two agents</span>
          {top && (
            <div style={{ marginTop: 12 }}>
              <b className="serif" style={{ fontSize: 19, fontWeight: 500 }}>{nameOf(top.aId).split(' ')[0]} × {nameOf(top.bId).split(' ')[0]} <span className="mut">· mutual {top.score}</span></b>
              <div className="chat" style={{ maxHeight: 300, marginTop: 10 }}>
                {top.transcript.slice(0, 5).map((m, i) => (
                  <div key={i} className={`bubble ${m.from === 'system' ? 'sys' : m.from === top.aId ? 'me' : 'them'}`}>
                    <b className="small">{m.fromName}: </b>{m.text}
                  </div>
                ))}
              </div>
              <div className="small mut" style={{ marginTop: 8 }}>{top.asymmetry}</div>
              <div style={{ marginTop: 10 }}><Link className="btn" to={`/arena?pair=${top.id}`}>Watch the full date →</Link></div>
            </div>
          )}
        </div>
      </div>

      <div className="marquee"><div className="marquee-track">{[...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}</span>)}<span>·</span>{[...TICKER, ...TICKER].map((t, i) => <span key={'b' + i}>{t}</span>)}</div></div>

      <div className="wrap section">
        <Reveal><h2 className="h2">Four unhurried steps. <span className="it">No swiping, no games.</span></h2></Reveal>
        <div className="steps4">
          {[['01', 'Links in', 'Paste the official LinkedIn and the public Instagram. Those two pages are the only sources. Nothing else.'], ['02', 'The agent reads', 'Work-self from LinkedIn, evening-self from Instagram. Needs, hobbies, interests, values — each with its receipt.'], ['03', 'The agents date', 'Every pair meets. Mutual scoring both ways, then finalists get a second date where dealbreakers are stress-tested.'], ['04', 'Humans take over', `One ranked list per person, full transcripts, and ${introductions.length} introductions earned. The rest is you.`]].map(([n, b, p], i) => (
            <Reveal key={n} delay={i * 90}><div className="step"><span className="n">{n}</span><b>{b}</b><p>{p}</p></div></Reveal>
          ))}
        </div>
      </div>

      <div className="wrap section">
        <Reveal><h2 className="h2">The point was never the app. <span className="it">It was the evening after.</span></h2>
          <p className="mut">What the introductions are for.</p></Reveal>
        <div className="moments" style={{ marginTop: 14 }}>
          {MOMENTS.map(m => (
            <figure key={m.src} className="moment"><img src={m.src} alt={m.cap} loading="lazy" /><figcaption>{m.cap}</figcaption></figure>
          ))}
        </div>
        <div className="small dim">Photos: Unsplash.</div>
      </div>

      <div className="wrap section">
        <Reveal><h2 className="h2">Introduced, <span className="it">not matched.</span></h2>
          <p className="mut" style={{ maxWidth: '44rem' }}>An introduction is earned: high mutual score, a survived second date, and nobody introduced twice. Here is this cycle's list.</p></Reveal>
        <div className="grid" style={{ marginTop: 14 }}>
          {introductions.slice(0, 6).map(it => {
            const pa = people.find(p => p.id === it.aId)!;
            const pb = people.find(p => p.id === it.bId)!;
            return (
              <Reveal key={it.dateId}><div className="card">
                <div className="row">
                  <Avatar person={pa} size={46} />
                  <div style={{ marginLeft: -18 }}><Avatar person={pb} size={46} /></div>
                  <div style={{ marginLeft: 6 }}><b>{nameOf(it.aId).split(' ')[0]} × {nameOf(it.bId).split(' ')[0]}</b><div className="small dim">mutual {it.score}</div></div>
                </div>
                <div className="small mut" style={{ marginTop: 8 }}>{it.note}</div>
                <div className="links"><Link to={`/arena?pair=${it.dateId}`}>Their dates →</Link></div>
              </div></Reveal>
            );
          })}
        </div>
      </div>

      <div className="wrap section">
        <Reveal><h2 className="h2">The honest FAQ.</h2>
          <div className="faq">
            <details><summary>Is this a swiping app?</summary><p>No. There is no feed, no like counts, no leaderboard. Agents hold the dates in the background; you receive ranked introductions and transcripts.</p></details>
            <details><summary>What do the agents actually read?</summary><p>Two pages per person: the public LinkedIn and the public Instagram. The profile page shows which trait came from which source, quote included. Profile photos are pulled the same way, once, at build time.</p></details>
            <details><summary>Can it predict who I will fall for?</summary><p>No, and it does not pretend to. Its job is subtraction: rule out the clashing goals, the dealbreakers, the quiet mismatches, so the evenings you spend are on people worth an evening.</p></details>
            <details><summary>Do I need an AI key?</summary><p>No. The harness runs fully deterministic out of the box. If you add your own key, profiles and date dialogue get an AI voice — but the site never requires it.</p></details>
            <details><summary>How many dates is that, really?</summary><p>{people.length} agents, {dates.length} first dates, {secondCount} second dates, {introductions.length} introductions. Every one watchable.</p></details>
          </div></Reveal>
      </div>

      <div className="wrap section">
        <Reveal><h2 className="h2">The room. <span className="it">25 agents.</span></h2></Reveal>
        <div className="grid">
          {people.slice(0, 6).map(p => {
            const pr = profiles[p.id];
            return (
              <div key={p.id} className="card">
                <div className="row"><Avatar person={p} size={52} />
                  <div><b>{p.name}</b><div className="small dim">{p.age} · {p.occupation}</div></div></div>
                <div className="small mut" style={{ marginTop: 8 }}>{pr?.tagline}</div>
                <div className="links"><a href={p.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn ↗</a><a href={p.instagramUrl} target="_blank" rel="noreferrer">Instagram ↗</a><Link to={`/profiles/${p.id}`}>Profile →</Link></div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14 }}><Link className="btn" to="/profiles">Meet all {people.length} →</Link></div>
      </div>
    </>
  );
}

export function Profiles() {
  const { people, profiles } = useStore();
  const [q, setQ] = useState('');
  const list = people.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="wrap section">
      <h2 className="h2">Agent profile pages <span className="it">— {list.length}.</span></h2>
      <p className="mut">Each agent read its person (LinkedIn + Instagram) and wrote this. Open any page for needs, hobbies, interests — with receipts.</p>
      <input className="input" placeholder="Search the room…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 380 }} />
      <div className="grid" style={{ marginTop: 14 }}>
        {list.map(p => {
          const pr = profiles[p.id];
          return (
            <Link key={p.id} to={`/profiles/${p.id}`} style={{ textDecoration: 'none' }} className="card">
              <div className="row"><Avatar person={p} size={52} />
                <div><b>{p.name}</b><div className="small dim">{p.age} · {p.location}</div><div className="small dim">{p.occupation}</div></div></div>
              <div className="small mut" style={{ marginTop: 8 }}>{pr.tagline}</div>
              <div style={{ marginTop: 8 }}><span className="pill rose">{pr.needs[0]}</span><span className="pill">{pr.hobbies[0]}</span><span className="pill">{pr.values[0]}</span></div>
              <div className="small" style={{ marginTop: 8, color: '#9a8468' }}>{pr.aiEnhanced ? '✦ AI-voiced' : 'deterministic'} · {pr.loveLanguage} · {pr.attachmentStyle}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
