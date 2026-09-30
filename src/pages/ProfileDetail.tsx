import { Link, useParams } from 'react-router-dom';
import { useStore, initials } from '../lib/store';

export default function ProfileDetail() {
  const { id } = useParams();
  const { people, profiles, getRanks } = useStore();
  const p = people.find(x=>x.id===id);
  if (!p) return <div className="wrap section">Not found. <Link to="/profiles">Back</Link></div>;
  const pr = profiles[p.id];
  const ranks = getRanks(p.id).slice(0,8);
  const nameOf = (pid:string)=>people.find(x=>x.id===pid);
  return (
    <div className="wrap section">
      <Link to="/profiles" className="small mut" style={{textDecoration:'none'}}>← all profiles</Link>
      <div style={{display:'grid',gridTemplateColumns:'1.1fr .9fr',gap:16,marginTop:12}} className="resp">
        <div className="panel">
          <div className="row"><div className="avatar" style={{background:p.avatarColor,width:64,height:64,fontSize:22}}>{initials(p.name)}</div>
            <div><h2 className="h2" style={{margin:0}}>{p.name}, {p.age}</h2><div className="mut">{p.occupation} · {p.location}</div><div className="small dim">{pr.tagline}</div></div></div>
          <div className="links"><a className="li" href={p.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn — official ↗</a><a href={p.instagramUrl} target="_blank" rel="noreferrer">Instagram — public ↗</a></div>
          <div style={{marginTop:14}}>
            <b>♥ Needs</b><div>{pr.needs.map(n=><span key={n} className="pill rose">{n}</span>)}</div>
          </div>
          <div style={{marginTop:10}}><b>◉ Hobbies</b><div>{pr.hobbies.map(n=><span key={n} className="pill vio">{n}</span>)}</div></div>
          <div style={{marginTop:10}}><b>✦ Interests</b><div>{pr.interests.map(n=><span key={n} className="pill gold">{n}</span>)}</div></div>
          <div style={{marginTop:10}}><b>◆ Values</b><div>{pr.values.map(n=><span key={n} className="pill mint">{n}</span>)}</div></div>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr',marginTop:14}}>
            <div className="card"><b className="small">LIFESTYLE</b><div className="small mut">{pr.lifestyle.join(' · ')}</div><div className="small mut" style={{marginTop:6}}>Love language: <b style={{color:'#fff'}}>{pr.loveLanguage}</b></div><div className="small mut">Attachment: <b style={{color:'#fff'}}>{pr.attachmentStyle}</b></div></div>
            <div className="card"><b className="small">IDEAL MATCH</b><div className="small mut">{pr.idealMatch}</div><div className="small" style={{marginTop:6}}>Avoids: {pr.dealbreakers.join(' · ')}</div></div>
          </div>
          <div className="card" style={{marginTop:12}}><b className="small">HOW THE AGENT READ THEM (source attribution)</b>
            <div style={{marginTop:8}}>{pr.linkedinSignals.map(s=><div key={s} className="small mut">💼 {s} — <code>{p.linkedinUrl}</code></div>)}</div>
            <div style={{marginTop:4}}>{pr.instagramSignals.map(s=><div key={s} className="small mut">📸 {s} — <code>{p.instagramUrl}</code></div>)}</div>
            <div className="small dim" style={{marginTop:8}}>Only these two URLs were read. Confidence {pr.confidence}%. Date ideas: {pr.dateIdeas.join(' · ')}</div>
          </div>
        </div>
        <div>
          <div className="panel"><b>Who fits {p.name.split(' ')[0]} best — agent-ranked</b><div className="small mut">Every other agent dated them. Sorted by harness score.</div>
            {ranks.map((r,i)=>{
              const o = nameOf(r.personId);
              return (
                <div key={r.personId} className="rank">
                  <div className="score">#{i+1}<div style={{fontSize:16}}>{r.score}</div></div>
                  <div style={{flex:1}}><b>{o?.name}</b><div className="small mut">{r.reason}</div>
                  <div style={{marginTop:6,display:'flex',gap:8}}><Link className="small" to={`/arena?pair=${r.dateId}`}>Watch date →</Link><Link className="small" to={`/profiles/${r.personId}`}>Their profile →</Link></div></div>
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
