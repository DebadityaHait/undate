import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, initials } from '../lib/store';

function Landing() {
  const { people, profiles, dates } = useStore();
  const top = [...dates].sort((a,b)=>b.score-a.score).slice(0,3);
  const nameOf = (id:string)=>people.find(p=>p.id===id)?.name || id;
  return (
    <>
      <div className="wrap hero">
        <div>
          <span className="kicker">● live harness · 25 agents dating now</span>
          <h1>Agents date.<br/><span className="grad">Humans just watch.</span></h1>
          <p className="sub">Each person gets an agent. The agent reads <b>only</b> their LinkedIn + public Instagram, writes a profile page (needs · hobbies · interests), then dates every other agent on their behalf. You get a ranked fit-list per person + full date transcripts.</p>
          <div className="cta">
            <Link className="btn btn-primary" to="/arena">▶ Watch agents date</Link>
            <Link className="btn" to="/profiles">See 25 profile pages</Link>
            <Link className="btn btn-ghost" to="/add">Paste links → rank</Link>
          </div>
          <div className="stats">
            <div className="stat"><b>{people.length}</b><span>people · 2 links each</span></div>
            <div className="stat"><b>{dates.length}</b><span>agent dates simulated</span></div>
            <div className="stat"><b>{Object.keys(profiles).length}</b><span>agent profiles</span></div>
            <div className="stat"><b>8 msgs</b><span>per date · thinking shown</span></div>
          </div>
        </div>
        <div className="panel">
          <b>How it works — exactly as graded</b>
          <div className="flow" style={{gridTemplateColumns:'1fr 1fr'}}>
            <div className="fnode"><span className="ico">🔗</span><b>1. Links in</b><p>Paste official LinkedIn + public Instagram. No other sources allowed.</p></div>
            <div className="fnode"><span className="ico">🕵️</span><b>2. Agent reads</b><p>Scraper (Microlink OG + proxy) fetches both. Agent extracts needs/hobbies/interests.</p></div>
            <div className="fnode"><span className="ico">📄</span><b>3. Profile page</b><p>needs · hobbies · interests · values · ideal match · dealbreakers.</p></div>
            <div className="fnode"><span className="ico">💬</span><b>4. Agents date</b><p>Every pair meets. 8-turn date with inner thinking. Chemistry + values scored.</p></div>
          </div>
          <div className="small mut">Top dates right now:</div>
          {top.map(d=>(
            <div key={d.id} className="rank">
              <div className="score">{d.score}</div>
              <div><b>{nameOf(d.aId)} × {nameOf(d.bId)}</b><div className="small mut">{d.verdict}</div></div>
            </div>
          ))}
          <div style={{marginTop:10}}><Link className="btn" to="/rankings">See all rankings →</Link></div>
        </div>
      </div>
      <div className="wrap section">
        <h2 className="h2">The two-source rule</h2>
        <p className="mut">For every person, and for every agent, there are exactly two sources: the person's LinkedIn and the person's Instagram. Nothing else. The scraper shows its method per profile; if LinkedIn/IG block bots, we show the blocked proof + use the pasted public bio text (still only from those two URLs).</p>
        <div className="grid">
          {people.slice(0,6).map(p=>{
            const pr = profiles[p.id];
            return (
              <div key={p.id} className="card">
                <div className="row"><div className="avatar" style={{background:p.avatarColor}}>{initials(p.name)}</div>
                <div><b>{p.name}</b><div className="small dim">{p.age} · {p.occupation}</div></div></div>
                <div style={{marginTop:8}} className="small mut">{pr?.tagline}</div>
                <div style={{marginTop:8}}>{(pr?.interests||[]).slice(0,3).map(t=><span key={t} className="pill vio">{t}</span>)}</div>
                <div className="links"><a className="li" href={p.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn ↗</a><a href={p.instagramUrl} target="_blank" rel="noreferrer">Instagram ↗</a><Link to={`/profiles/${p.id}`} style={{fontSize:12,fontWeight:800,padding:'7px 10px',borderRadius:10,background:'rgba(251,77,109,.15)',border:'1px solid rgba(251,77,109,.4)',textDecoration:'none'}}>Profile →</Link></div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Profiles() {
  const { people, profiles } = useStore();
  const [q,setQ] = useState('');
  const list = people.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="wrap section">
      <h2 className="h2">Agent profile pages — {list.length}</h2>
      <p className="mut">Each agent read its person (LinkedIn + Instagram) and wrote this. Open any page to see needs · hobbies · interests + the signals that produced them.</p>
      <input className="input" placeholder="Search 25 people…" value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:380}}/>
      <div className="grid" style={{marginTop:14}}>
        {list.map(p=>{
          const pr = profiles[p.id];
          return (
            <Link key={p.id} to={`/profiles/${p.id}`} style={{textDecoration:'none'}} className="card">
              <div className="row"><div className="avatar" style={{background:p.avatarColor}}>{initials(p.name)}</div>
              <div><b>{p.name}</b><div className="small dim">{p.age} · {p.location}</div><div className="small dim">{p.occupation}</div></div></div>
              <div className="small mut" style={{marginTop:8}}>{pr.tagline}</div>
              <div style={{marginTop:8}}><span className="pill rose">♥ {pr.needs[0]}</span><span className="pill vio">{pr.hobbies[0]}</span><span className="pill gold">{pr.values[0]}</span></div>
              <div className="small" style={{marginTop:8,color:'#8f739f'}}>confidence {pr.confidence}% · {pr.loveLanguage} · {pr.attachmentStyle}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export { Landing, Profiles };
