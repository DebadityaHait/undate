import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';

export default function Rankings() {
  const { people, getRanks, introductions } = useStore();
  const [sel, setSel] = useState(people[0]?.id);
  const ranks = sel ? getRanks(sel) : [];
  const selPerson = people.find(p => p.id === sel);
  const nameOf = (id: string) => people.find(p => p.id === id);
  return (
    <div className="wrap section">
      <span className="kicker"><i />One list per person · mutual badges where it is returned</span>
      <h2 className="h2">Rankings — <span className="it">who fits whom best.</span></h2>
      <div className="panel" style={{ marginBottom: 14 }}>
        <b className="serif" style={{ fontSize: 20, fontWeight: 500 }}>★ Introduced this cycle ({introductions.length})</b>
        <div className="small mut">High mutual score, survived date two, nobody introduced twice.</div>
        {introductions.map(it => (
          <div key={it.dateId} className="rank">
            <div className="score">{it.score}</div>
            <div style={{ flex: 1 }}><b>{nameOf(it.aId)?.name} × {nameOf(it.bId)?.name}</b><div className="small mut">{it.note}</div>
              <div style={{ marginTop: 4 }}><Link className="small" to={`/arena?pair=${it.dateId}`}>Watch their dates →</Link></div></div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14 }} className="resp">
        <div className="panel" style={{ maxHeight: 700, overflow: 'auto' }}>
          {people.map(p => {
            const top = getRanks(p.id)[0];
            return (
              <button key={p.id} onClick={() => setSel(p.id)} className="rank" style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: p.id === sel ? 'rgba(224,85,99,.13)' : '', color: '#f6ecdd', border: p.id === sel ? '1px solid rgba(224,85,99,.5)' : '' }}>
                <div className="avatar" style={{ background: p.avatarColor, width: 40, height: 40, fontSize: 14 }}>{p.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
                <div><b className="small">{p.name}</b><div className="small dim">top: {top ? `${nameOf(top.personId)?.name} · ${top.score}` : '—'}</div></div>
              </button>
            );
          })}
        </div>
        <div className="panel">
          <b className="serif" style={{ fontSize: 20, fontWeight: 500 }}>{selPerson?.name} — full ranking ({ranks.length})</b>
          {ranks.map((r, i) => {
            const o = nameOf(r.personId);
            return (
              <div key={r.personId} className="rank">
                <div className="score">#{i + 1}<div style={{ fontSize: 15 }}>{r.score}</div></div>
                <div style={{ flex: 1 }}><b>{o?.name}</b> {r.mutual && <span className="badge">mutual top-3</span>} <span className="small dim">· {o?.age} · {o?.occupation}</span><div className="small mut">{r.reason}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 10 }}><Link className="small" to={`/arena?pair=${r.dateId}`}>Watch date →</Link><Link className="small" to={`/profiles/${r.personId}`}>Profile →</Link></div></div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@media(max-width:900px){.resp{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
}
