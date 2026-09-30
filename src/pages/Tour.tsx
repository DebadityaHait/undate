import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';

const STEP_SECONDS = 9;

export default function Tour() {
  const { people, profiles, dates, introductions, getRanks } = useStore();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const top = [...dates].sort((a, b) => b.score - a.score)[0];
  const nameOf = (id: string) => people.find(p => p.id === id)?.name || id;
  const sample = people[9]; // Serena
  const sampleRanks = getRanks(sample.id).slice(0, 3);
  const total = 4;

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStep(s => (s + 1) % total), STEP_SECONDS * 1000);
    return () => clearInterval(t);
  }, [playing]);

  return (
    <div className="wrap section" style={{ maxWidth: 860 }}>
      <span className="kicker"><i />The 90-second tour · hands-free</span>
      <h2 className="h2">Watch the whole harness <span className="it">without touching anything.</span></h2>
      <p className="mut">Auto-plays the full arc: links → profile → date → rankings. Record this for the video, or send it to a skeptic.</p>
      <div className="tourbar"><i style={{ width: `${((step + 1) / total) * 100}%` }} /></div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className="btn" onClick={() => setPlaying(!playing)}>{playing ? '⏸ Pause' : '▶ Play'}</button>
        <button className="btn btn-ghost" onClick={() => setStep((step + total - 1) % total)}>← Back</button>
        <button className="btn btn-ghost" onClick={() => setStep((step + 1) % total)}>Next →</button>
        <span className="small dim" style={{ alignSelf: 'center' }}>scene {step + 1} of {total}</span>
      </div>

      {step === 0 && (
        <div className="panel">
          <span className="badge">01 · links in</span>
          <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, margin: '10px 0' }}>Two links. <span className="it">Nothing else.</span></h3>
          <p className="mut">Every person enters as an official LinkedIn and a public Instagram. The scraper fetches only those two pages — Microlink first, proxy fallback, paste if the bots win.</p>
          <div className="card" style={{ marginTop: 12 }}>
            <div className="small dim">linkedin.com/in/serenawilliams</div>
            <div className="small dim">instagram.com/serenawilliams</div>
            <div className="small" style={{ marginTop: 8 }}>↓ agent reads both ↓</div>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="panel">
          <span className="badge">02 · the profile page</span>
          <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, margin: '10px 0' }}>{sample.name}, <span className="it">read by her agent.</span></h3>
          <div className="small mut">{profiles[sample.id].tagline}</div>
          <div style={{ marginTop: 10 }}><b>Needs</b><div>{profiles[sample.id].needs.map(n => <span key={n} className="pill rose">{n}</span>)}</div></div>
          <div style={{ marginTop: 8 }}><b>Hobbies</b><div>{profiles[sample.id].hobbies.slice(0, 3).map(n => <span key={n} className="pill">{n}</span>)}</div></div>
          <div style={{ marginTop: 8 }}><b>Interests</b><div>{profiles[sample.id].interests.slice(0, 3).map(n => <span key={n} className="pill">{n}</span>)}</div></div>
          <div style={{ marginTop: 10 }}><Link className="btn btn-ghost" to={`/profiles/${sample.id}`}>Open the full page →</Link></div>
        </div>
      )}
      {step === 2 && top && (
        <div className="panel">
          <span className="badge">03 · the agents date</span>
          <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, margin: '10px 0' }}>{nameOf(top.aId).split(' ')[0]} × {nameOf(top.bId).split(' ')[0]} <span className="it">· mutual {top.score}</span></h3>
          <div className="chat" style={{ maxHeight: 320 }}>
            {top.transcript.slice(0, 6).map((m, i) => (
              <div key={i} className={`bubble ${m.from === 'system' ? 'sys' : m.from === top.aId ? 'me' : 'them'}`}>
                {m.thinking && <span className="think">{m.thinking}</span>}
                <b className="small">{m.fromName}: </b>{m.text}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}><Link className="btn btn-ghost" to={`/arena?pair=${top.id}`}>Watch it breathe →</Link></div>
        </div>
      )}
      {step === 3 && (
        <div className="panel">
          <span className="badge">04 · rankings + introductions</span>
          <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, margin: '10px 0' }}>Who fits <span className="it">{sample.name.split(' ')[0]} best?</span></h3>
          {sampleRanks.map((r, i) => (
            <div key={r.personId} className="rank"><div className="score">#{i + 1}</div><div><b>{nameOf(r.personId)}</b><div className="small mut">{r.reason}</div></div></div>
          ))}
          <div className="small mut" style={{ marginTop: 8 }}>{introductions.length} introductions earned this cycle. Then the humans take over.</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link className="btn btn-primary" to="/rankings">All rankings →</Link><Link className="btn btn-ghost" to="/add">Try your own links →</Link></div>
        </div>
      )}
    </div>
  );
}
