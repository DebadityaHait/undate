import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import Avatar from '../components/Avatar';
import { aiEnhanceProfile, getAI } from '../lib/ai';

export default function ProfileDetail() {
  const { id } = useParams();
  const { people, profiles, getRanks, enhanceProfile } = useStore();
  const [enhancing, setEnhancing] = useState(false);
  const [aiMsg, setAiMsg] = useState('');
  const p = people.find(x => x.id === id);
  if (!p) return <div className="wrap section">Not found. <Link to="/profiles">Back</Link></div>;
  const pr = profiles[p.id];
  const ranks = getRanks(p.id).slice(0, 8);
  const nameOf = (pid: string) => people.find(x => x.id === pid);

  const enhance = async () => {
    if (!getAI()) { setAiMsg('Add your AI key on the + Add page first — the deterministic profile below is already live.'); return; }
    setEnhancing(true); setAiMsg('');
    const upgraded = await aiEnhanceProfile(p, getAI());
    enhanceProfile(p.id, upgraded);
    setAiMsg(upgraded.aiEnhanced ? '✦ AI-voiced profile live. Remove the key any time; the deterministic read stays underneath.' : 'AI was unreachable — kept the deterministic profile.');
    setEnhancing(false);
  };

  return (
    <div className="wrap section">
      <Link to="/profiles" className="small mut" style={{ textDecoration: 'none' }}>← the room</Link>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 16, marginTop: 12 }} className="resp">
        <div className="panel">
          <div className="row"><Avatar person={p} size={64} ring />
            <div><h2 className="h2" style={{ margin: 0 }}>{p.name}, {p.age}</h2><div className="mut">{p.occupation} · {p.location}</div><div className="small dim">{pr.tagline}</div></div></div>
          <div style={{ marginTop: 8 }}>{pr.aiEnhanced ? <span className="badge">✦ AI-voiced</span> : <span className="badge plain">deterministic read</span>}</div>
          <div className="links"><a href={p.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn — official ↗</a><a href={p.instagramUrl} target="_blank" rel="noreferrer">Instagram — public ↗</a></div>
          <div style={{ marginTop: 14 }}>
            <b>Needs</b><div>{pr.needs.map(n => <span key={n} className="pill rose">{n}</span>)}</div>
          </div>
          <div style={{ marginTop: 10 }}><b>Hobbies</b><div>{pr.hobbies.map(n => <span key={n} className="pill">{n}</span>)}</div></div>
          <div style={{ marginTop: 10 }}><b>Interests</b><div>{pr.interests.map(n => <span key={n} className="pill">{n}</span>)}</div></div>
          <div style={{ marginTop: 10 }}><b>Values</b><div>{pr.values.map(n => <span key={n} className="pill">{n}</span>)}</div></div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 14 }}>
            <div className="card"><b className="small">HOW THEY LOVE</b><div className="small mut">{pr.loveLanguage} · {pr.attachmentStyle}</div><div className="small mut" style={{ marginTop: 6 }}>{pr.lifestyle.join(' · ')}</div></div>
            <div className="card"><b className="small">IDEAL MATCH</b><div className="small mut">{pr.idealMatch}</div><div className="small" style={{ marginTop: 6 }}>Ruled out: {pr.dealbreakers.join(' · ')}</div></div>
          </div>
          <div className="card" style={{ marginTop: 12 }}><b className="small">RECEIPTS — every trait, its source</b>
            {pr.evidence.map((e, i) => (
              <div key={i} className="evidence"><div className="small dim">{e.tag} · from {e.source} · <code>{e.source === 'linkedin' ? p.linkedinUrl : p.instagramUrl}</code></div><div className="q">{e.quote}</div></div>
            ))}
            <div className="small dim" style={{ marginTop: 8 }}>Only these two pages were read. Confidence {pr.confidence}%. Evenings: {pr.dateIdeas.join(' · ')}</div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn" disabled={enhancing} onClick={enhance}>{enhancing ? 'AI reading…' : '✦ Enhance with AI'}</button>
            {aiMsg && <span className="small mut">{aiMsg}</span>}
          </div>
        </div>
        <div>
          <div className="panel"><b className="serif" style={{ fontSize: 20, fontWeight: 500 }}>Who fits {p.name.split(' ')[0]} best</b><div className="small mut">Mutual scoring — your number, their number, both shown.</div>
            {ranks.map((r, i) => {
              const o = nameOf(r.personId);
              return (
                <div key={r.personId} className="rank">
                  <div className="score">#{i + 1}<div style={{ fontSize: 16 }}>{r.score}</div></div>
                  <div style={{ flex: 1 }}><b>{o?.name}</b> {r.mutual && <span className="badge">mutual top-3</span>}<div className="small mut">{r.reason}</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 8 }}><Link className="small" to={`/arena?pair=${r.dateId}`}>Watch date →</Link><Link className="small" to={`/profiles/${r.personId}`}>Their profile →</Link></div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:900px){.resp{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}
