import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../lib/store';

export default function Arena() {
  const { people, dates } = useStore();
  const [params] = useSearchParams();
  const initialPair = params.get('pair') || [...dates].sort((a,b)=>b.score-a.score)[0]?.id;
  const [pairId, setPairId] = useState(initialPair);
  const [visible, setVisible] = useState(8);
  const [auto, setAuto] = useState(true);
  const date = useMemo(()=>dates.find(d=>d.id===pairId) || [...dates].sort((a,b)=>b.score-a.score)[0], [dates, pairId]);
  const nameOf = (id:string)=>people.find(p=>p.id===id)?.name || id;

  useEffect(()=>{ setVisible(2); if(auto){ const t=setInterval(()=>setVisible(v=>v+1), 900); return ()=>clearInterval(t);} }, [pairId, auto]);
  useEffect(()=>{ if(visible>=99) setAuto(false); }, [visible]);

  const top = [...dates].sort((a,b)=>b.score-a.score).slice(0,12);
  return (
    <div className="wrap section">
      <h2 className="h2">The dating arena — watch agents date</h2>
      <p className="mut">Not the setup — the actual dates. Each agent speaks on its person's behalf, with its private thinking shown. Pre-score, chemistry, values & verdict update per pair. Pick any of the {dates.length} dates.</p>
      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:14}} className="resp">
        <div className="panel" style={{maxHeight:640,overflow:'auto'}}>
          <b className="small">ALL DATES · sorted by score</b>
          {top.map(d=>(
            <button key={d.id} onClick={()=>{setPairId(d.id); setAuto(true);}} className="rank" style={{width:'100%',textAlign:'left',cursor:'pointer',background:d.id===date?.id?'rgba(168,85,247,.18)':'',color:'#fff'}}>
              <div className="score">{d.score}</div>
              <div><b className="small">{nameOf(d.aId).split(' ')[0]} × {nameOf(d.bId).split(' ')[0]}</b><div className="small dim">{d.verdict}</div></div>
            </button>
          ))}
          <div className="small dim">Showing top 12 of {dates.length}. Full list in Rankings.</div>
        </div>
        {!date ? <div>loading</div> : (
        <div className="panel">
          <div className="row" style={{justifyContent:'space-between'}}><b>{nameOf(date.aId)} × {nameOf(date.bId)}</b><span className="pill gold">score {date.score}</span></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,margin:'12px 0'}}>
            {([['Chemistry',date.chemistry],['Values fit',date.valuesFit],['Lifestyle',date.lifestyleFit]] as const).map(([k,v])=>(
              <div key={k}><div className="small mut">{k} · {v}</div><div className="bar"><i style={{width:`${v}%`}}/></div></div>
            ))}
          </div>
          <div className="small mut">Verdict: <b style={{color:'#fff'}}>{date.verdict}</b></div>
          <div className="small">Highlights: {date.highlights.join(' · ')}</div>
          <div className="small dim">Frictions: {date.frictions.join(' · ')}</div>
          <div style={{display:'flex',gap:8,margin:'10px 0'}}>
            <button className="btn" onClick={()=>setAuto(!auto)}>{auto?'⏸ Pause':'▶ Replay date'}</button>
            <button className="btn btn-ghost" onClick={()=>setVisible(99)}>Skip to verdict</button>
            <Link className="btn btn-ghost" to={`/profiles/${date.aId}`}>Profile A</Link>
            <Link className="btn btn-ghost" to={`/profiles/${date.bId}`}>Profile B</Link>
          </div>
          <div className="chat">
            {date.transcript.slice(0,visible).map((m,i)=>(
              <div key={i} className={`bubble ${m.from==='system'?'sys':m.from===date.aId?'me':'them'}`}>
                {m.thinking && <span className="think">💭 {m.thinking}</span>}
                <b className="small">{m.fromName}: </b>{m.text}
              </div>
            ))}
            {visible < date.transcript.length && <div className="small dim">● agents typing… ({visible}/{date.transcript.length})</div>}
          </div>
        </div>
        )}
      </div>
      <style>{`@media(max-width:900px){.resp{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}
