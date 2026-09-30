import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateLinks, scrapePerson } from '../lib/scraper';
import { useStore } from '../lib/store';
import { analysisSteps } from '../lib/analyzer';
import { AI_PRESETS, getAI, saveAI, clearAI } from '../lib/ai';

export default function AddPerson() {
  const { addPerson } = useStore();
  const nav = useNavigate();
  const [name, setName] = useState(''); const [age, setAge] = useState('30');
  const [gender, setGender] = useState('F'); const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState(''); const [li, setLi] = useState(''); const [ig, setIg] = useState('');
  const [liBio, setLiBio] = useState(''); const [igBio, setIgBio] = useState('');
  const [log, setLog] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [ai, setAi] = useState(() => getAI());
  const [aiKey, setAiKey] = useState(ai?.key || ''); const [aiBase, setAiBase] = useState(ai?.baseUrl || AI_PRESETS[0].baseUrl); const [aiModel, setAiModel] = useState(ai?.model || AI_PRESETS[0].model);

  const run = async () => {
    setErr('');
    if (!name.trim()) { setErr('Name is required'); return; }
    const v = validateLinks(li.trim(), ig.trim());
    if (v) { setErr(v); return; }
    setBusy(true); setLog([]);
    for (const s of analysisSteps()) { setLog(prev => [...prev, s]); await new Promise(r => setTimeout(r, 500)); }
    try {
      const { li: lir, ig: igr } = await scrapePerson(li.trim(), ig.trim(), liBio, igBio);
      setLog(prev => [...prev, `LinkedIn: ${lir.method}`, `Instagram: ${igr.method}`]);
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
      addPerson({
        id, name: name.trim(), age: parseInt(age) || 30, gender, location: location || 'Unknown',
        occupation: occupation || '—', linkedinUrl: li.trim(), instagramUrl: ig.trim(),
        linkedinBio: lir.description || liBio || `${occupation} — LinkedIn public profile`,
        instagramBio: igr.description || igBio || 'Public Instagram',
        avatarColor: '#b23a4a',
      });
      setLog(prev => [...prev, 'Agent profile written. Dating against the whole room…']);
      await new Promise(r => setTimeout(r, 700));
      nav(`/profiles/${id}`);
    } catch (e: any) { setErr(String(e?.message || e)); }
    setBusy(false);
  };

  return (
    <div className="wrap section">
      <span className="kicker"><i />Join the room · two links in</span>
      <h2 className="h2">Paste links. <span className="it">Meet your ranking.</span></h2>
      <p className="mut">The exact flow the video demos. Live scrape, agent read, instant dates against all {''}agents.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="resp">
        <div className="panel">
          <label>Full name *</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex Rivera" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label>Age</label><input className="input" value={age} onChange={e => setAge(e.target.value)} /></div>
            <div><label>Gender</label><select value={gender} onChange={e => setGender(e.target.value)}><option>M</option><option>F</option><option>X</option></select></div>
            <div><label>Location</label><input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Austin, USA" /></div>
          </div>
          <label>Occupation / headline</label><input className="input" value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="Founder, …" />
          <label>LinkedIn URL (official) *</label><input className="input" value={li} onChange={e => setLi(e.target.value)} placeholder="https://www.linkedin.com/in/…" />
          <label>Instagram URL (public) *</label><input className="input" value={ig} onChange={e => setIg(e.target.value)} placeholder="https://www.instagram.com/…" />
          <label>LinkedIn bio paste (optional — if anti-bot blocks the live fetch)</label><textarea rows={2} value={liBio} onChange={e => setLiBio(e.target.value)} placeholder="Paste the public headline/about" />
          <label>Instagram bio paste (optional)</label><textarea rows={2} value={igBio} onChange={e => setIgBio(e.target.value)} placeholder="Paste the public bio" />
          {err && <div className="small" style={{ color: '#f1949f', marginTop: 8 }}>{err}</div>}
          <div style={{ marginTop: 12 }}><button className="btn btn-primary" disabled={busy} onClick={run}>{busy ? 'Agent reading…' : 'Analyze + date everyone'}</button></div>
        </div>
        <div>
          <div className="panel">
            <b className="serif" style={{ fontSize: 19, fontWeight: 500 }}>Harness log</b>
            <ul className="steps small">{log.map((l, i) => <li key={i}>{l}</li>)}{!log.length && <li>Awaiting links…</li>}</ul>
            <div className="card small mut" style={{ marginTop: 10 }}>Scrape: <code>Microlink (no key)</code> → <code>AllOrigins proxy + OG parse</code> → <code>paste fallback</code>. Only those two URLs are ever fetched.</div>
          </div>
          <div className="panel" style={{ marginTop: 12 }}>
            <b className="serif" style={{ fontSize: 19, fontWeight: 500 }}>✦ AI voice <span className="small dim">(optional, yours)</span></b>
            <div className="small mut">Paste a key once and profiles + dates get an AI voice. No key, no change — the harness never needs it. Stored only in your browser.</div>
            <label>Provider</label>
            <select value={aiBase} onChange={e => { const p = AI_PRESETS.find(x => x.baseUrl === e.target.value); setAiBase(e.target.value); if (p) setAiModel(p.model); }}>
              {AI_PRESETS.map(p => <option key={p.name} value={p.baseUrl}>{p.name}</option>)}
            </select>
            <label>Model</label><input className="input" value={aiModel} onChange={e => setAiModel(e.target.value)} />
            <label>API key</label><input className="input" type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} placeholder="sk-…" />
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => { saveAI({ key: aiKey.trim(), baseUrl: aiBase, model: aiModel.trim() || 'gpt-4o-mini' }); setAi(getAI()); }}>Save key</button>
              <button className="btn btn-ghost" onClick={() => { clearAI(); setAi(null); setAiKey(''); }}>Remove</button>
              {ai && <span className="small mut" style={{ alignSelf: 'center' }}>✦ on ({ai.model})</span>}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:900px){.resp{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}
