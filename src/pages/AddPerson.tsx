import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateLinks, scrapePerson } from '../lib/scraper';
import { useStore } from '../lib/store';
import { analysisSteps } from '../lib/analyzer';

export default function AddPerson() {
  const { addPerson } = useStore();
  const nav = useNavigate();
  const [name,setName]=useState(''); const [age,setAge]=useState('30');
  const [gender,setGender]=useState('F'); const [location,setLocation]=useState('');
  const [occupation,setOccupation]=useState(''); const [li,setLi]=useState(''); const [ig,setIg]=useState('');
  const [liBio,setLiBio]=useState(''); const [igBio,setIgBio]=useState('');
  const [log,setLog]=useState<string[]>([]); const [busy,setBusy]=useState(false); const [err,setErr]=useState('');

  const run = async () => {
    setErr('');
    if (!name.trim()) { setErr('Name is required'); return; }
    const v = validateLinks(li.trim(), ig.trim());
    if (v) { setErr(v); return; }
    setBusy(true); setLog([]);
    const steps = analysisSteps();
    for (const s of steps) { setLog(prev=>[...prev, s]); await new Promise(r=>setTimeout(r, 550)); }
    try {
      const { li: lir, ig: igr } = await scrapePerson(li.trim(), ig.trim(), liBio, igBio);
      setLog(prev=>[...prev, `✓ LinkedIn: ${lir.method} — "${(lir.title||'').slice(0,80)}"`]);
      setLog(prev=>[...prev, `✓ Instagram: ${igr.method} — "${(igr.title||'').slice(0,80)}"`]);
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-' + Date.now().toString(36);
      addPerson({
        id, name: name.trim(), age: parseInt(age)||30, gender, location: location||'Unknown',
        occupation: occupation||'—', linkedinUrl: li.trim(), instagramUrl: ig.trim(),
        linkedinBio: lir.description || liBio || `${occupation} — LinkedIn public profile`,
        instagramBio: igr.description || igBio || 'Public Instagram',
        avatarColor: '#a855f7',
      });
      setLog(prev=>[...prev, `✓ Agent profile written. Dating against ${'everyone'}…`]);
      await new Promise(r=>setTimeout(r, 700));
      nav(`/profiles/${id}`);
    } catch(e:any){ setErr(String(e?.message||e)); }
    setBusy(false);
  };

  return (
    <div className="wrap section">
      <h2 className="h2">Paste links → profile → rankings</h2>
      <p className="mut">This is the exact flow the video demos. Paste the two official links. We scrape live (Microlink OG, no key → CORS-proxy OG parse → manual paste if blocked). Then the agent analyzes and dates everyone.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}} className="resp">
        <div className="panel">
          <label>Full name *</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex Rivera"/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            <div><label>Age</label><input className="input" value={age} onChange={e=>setAge(e.target.value)}/></div>
            <div><label>Gender</label><select value={gender} onChange={e=>setGender(e.target.value)}><option>M</option><option>F</option><option>X</option></select></div>
            <div><label>Location</label><input className="input" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Austin, USA"/></div>
          </div>
          <label>Occupation / headline</label><input className="input" value={occupation} onChange={e=>setOccupation(e.target.value)} placeholder="Founder, …"/>
          <label>LinkedIn URL (official) *</label><input className="input" value={li} onChange={e=>setLi(e.target.value)} placeholder="https://www.linkedin.com/in/…"/>
          <label>Instagram URL (public) *</label><input className="input" value={ig} onChange={e=>setIg(e.target.value)} placeholder="https://www.instagram.com/…"/>
          <label>LinkedIn bio paste (optional — used if anti-bot blocks live fetch)</label><textarea rows={2} value={liBio} onChange={e=>setLiBio(e.target.value)} placeholder="Paste public headline/about if fetch is blocked"/>
          <label>Instagram bio paste (optional)</label><textarea rows={2} value={igBio} onChange={e=>setIgBio(e.target.value)} placeholder="Paste public bio/caption sample"/>
          {err && <div className="small" style={{color:'#ff8fa3',marginTop:8}}>⚠ {err}</div>}
          <div style={{marginTop:12,display:'flex',gap:8}}><button className="btn btn-primary" disabled={busy} onClick={run}>{busy?'Agent reading…':'Analyze + date everyone'}</button></div>
        </div>
        <div className="panel">
          <b>Harness log</b>
          <div className="small mut">Watch the agent read, then get redirected to the new profile page with rankings.</div>
          <ul className="steps small">{log.map((l,i)=><li key={i}>{l}</li>)}{!log.length && <li>Awaiting links…</li>}</ul>
          <div className="card small mut" style={{marginTop:10}}>Scrape stack: <code>Microlink API (free, no key)</code> → <code>AllOrigins CORS proxy + OG parse</code> → <code>manual paste fallback</code>. Only LinkedIn + Instagram are ever fetched. Method is shown per profile for audit.</div>
        </div>
      </div>
      <style>{`@media(max-width:900px){.resp{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}
