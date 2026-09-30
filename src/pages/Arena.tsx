import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { aiRemixDate, getAI } from '../lib/ai';
import type { ChatMessage } from '../lib/types';

export default function Arena() {
  const { people, profiles, dates, finalists } = useStore();
  const [params] = useSearchParams();
  const sorted = useMemo(() => [...dates].sort((a, b) => b.score - a.score), [dates]);
  const [pairId, setPairId] = useState(params.get('pair') || sorted[0]?.id);
  const [visible, setVisible] = useState(8);
  const [auto, setAuto] = useState(true);
  const [round, setRound] = useState<1 | 2>(1);
  const [remix, setRemix] = useState<ChatMessage[] | null>(null);
  const [remixing, setRemixing] = useState(false);
  const date = useMemo(() => dates.find(d => d.id === pairId) || sorted[0], [dates, pairId, sorted]);
  const nameOf = (id: string) => people.find(p => p.id === id)?.name || id;

  useEffect(() => { setVisible(2); setRound(1); setRemix(null); if (!auto) setAuto(true); }, [pairId]); // eslint-disable-line
  useEffect(() => { if (auto) { const t = setInterval(() => setVisible(v => v + 1), 900); return () => clearInterval(t); } }, [auto]);
  useEffect(() => { if (visible >= 99) setAuto(false); }, [visible]);

  if (!date) return <div className="wrap section">loading</div>;
  const lines = remix || (round === 2 && date.round2 ? date.round2 : date.transcript);
  const shown = lines.slice(0, visible);

  const doRemix = async () => {
    if (!getAI()) { alert('Add your AI key on the + Add page first. The deterministic date below already plays.'); return; }
    setRemixing(true);
    const t = await aiRemixDate(date, people.find(p => p.id === date.aId)!, people.find(p => p.id === date.bId)!, profiles[date.aId], profiles[date.bId], getAI());
    if (t) { setRemix(t); setVisible(2); setAuto(true); } else alert('AI was unreachable — kept the deterministic date.');
    setRemixing(false);
  };

  return (
    <div className="wrap section">
      <span className="kicker"><i />The dating room · {dates.length} first dates · {finalists.length} second dates</span>
      <h2 className="h2">Your agent meets theirs, <span className="it">before you ever do.</span></h2>
      <p className="mut">Not the setup — the dates themselves. Thinking shown, both directions scored. Finalists earned a second date.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14 }} className="resp">
        <div className="panel" style={{ maxHeight: 640, overflow: 'auto' }}>
          <b className="small">FINALISTS · second dates {finalists.length}</b>
          {[...finalists].sort((a, b) => b.score - a.score).slice(0, 6).map(d => (
            <button key={d.id} onClick={() => setPairId(d.id)} className="rank" style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: d.id === date?.id ? 'rgba(224,85,99,.14)' : '', color: '#f6ecdd' }}>
              <div className="score">{d.score}</div>
              <div><b className="small">{nameOf(d.aId).split(' ')[0]} × {nameOf(d.bId).split(' ')[0]}</b><div className="small dim">{d.status === 'introduced' ? '★ introduced' : 'finalist'}</div></div>
            </button>
          ))}
          <b className="small" style={{ display: 'block', marginTop: 10 }}>TOP FIRST DATES</b>
          {sorted.slice(0, 8).map(d => (
            <button key={d.id} onClick={() => setPairId(d.id)} className="rank" style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: d.id === date?.id ? 'rgba(224,85,99,.14)' : '', color: '#f6ecdd' }}>
              <div className="score">{d.score}</div>
              <div><b className="small">{nameOf(d.aId).split(' ')[0]} × {nameOf(d.bId).split(' ')[0]}</b><div className="small dim">{d.verdict}</div></div>
            </button>
          ))}
        </div>
        <div className="panel">
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <b className="serif" style={{ fontSize: 22, fontWeight: 500 }}>{nameOf(date.aId)} × {nameOf(date.bId)}</b>
            <span>{date.status !== 'first' ? <span className="badge">{date.status === 'introduced' ? '★ introduced' : date.status}</span> : <span className="badge plain">first date</span>}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '12px 0' }}>
            <div><div className="small mut">{nameOf(date.aId).split(' ')[0]} → {nameOf(date.bId).split(' ')[0]} · {date.scoreAB}</div><div className="bar"><i style={{ width: `${date.scoreAB}%` }} /></div></div>
            <div><div className="small mut">{nameOf(date.bId).split(' ')[0]} → {nameOf(date.aId).split(' ')[0]} · {date.scoreBA}</div><div className="bar"><i style={{ width: `${date.scoreBA}%` }} /></div></div>
          </div>
          <div className="small mut">{date.asymmetry}</div>
          <div className="small mut">Verdict: <b style={{ color: '#f6ecdd' }}>{date.verdict}</b></div>
          <div style={{ display: 'flex', gap: 8, margin: '10px 0', flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => setAuto(!auto)}>{auto ? '⏸ Pause' : '▶ Replay'}</button>
            {date.round2 && <button className="btn btn-ghost" onClick={() => { setRound(round === 1 ? 2 : 1); setRemix(null); setVisible(2); setAuto(true); }}>{round === 1 ? '→ Watch date two' : '← Back to date one'}</button>}
            <button className="btn btn-ghost" onClick={() => setVisible(99)}>Skip to verdict</button>
            <button className="btn btn-ghost" disabled={remixing} onClick={doRemix}>{remixing ? 'AI writing…' : '✦ AI voices'}</button>
            {remix && <button className="btn btn-ghost" onClick={() => { setRemix(null); setVisible(2); }}>Original</button>}
          </div>
          <div className="chat">
            {shown.map((m, i) => (
              <div key={i} className={`bubble ${m.from === 'system' ? 'sys' : m.from === date.aId ? 'me' : 'them'}`}>
                {m.thinking && <span className="think">{m.thinking}</span>}
                <b className="small">{m.fromName}: </b>{m.text}
              </div>
            ))}
            {visible < lines.length && <div className="small dim typing">agents talking <span><i /><i /><i /></span> ({Math.min(visible, lines.length)}/{lines.length})</div>}
          </div>
          {round === 2 && date.round2Verdict && visible >= lines.length && <div className="small" style={{ marginTop: 8 }}><span className="badge">{date.round2Verdict}</span></div>}
          <div className="small" style={{ marginTop: 8 }}>Highlights: {date.highlights.join(' · ')}</div>
          <div className="small dim">Frictions: {date.frictions.join(' · ')}</div>
        </div>
      </div>
      <style>{`@media(max-width:900px){.resp{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}
