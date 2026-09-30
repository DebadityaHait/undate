import { useState } from 'react';
import { AVATARS } from '../data/avatars';
import { initials } from '../lib/store';
import type { PersonInput } from '../lib/types';

/** Real face when the pipeline found one, elegant initials when not. */
export default function Avatar({ person, size = 52, ring = false }: { person: PersonInput; size?: number; ring?: boolean }) {
  const [err, setErr] = useState(false);
  const src = AVATARS[person.id]?.ig || AVATARS[person.id]?.li;
  const style: React.CSSProperties = {
    width: size, height: size, fontSize: Math.max(13, size * 0.34),
    marginLeft: undefined,
  };
  if (src && !err) {
    return (
      <img
        src={src}
        alt={person.name}
        loading="lazy"
        onError={() => setErr(true)}
        className="avatar-img"
        style={{ width: size, height: size, border: ring ? '2px solid rgba(224,85,99,.6)' : '1px solid rgba(246,236,221,.2)' }}
      />
    );
  }
  return <div className="avatar" style={{ ...style, background: person.avatarColor }}>{initials(person.name)}</div>;
}
