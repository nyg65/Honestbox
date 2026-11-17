// A HonestBox box in its own metal finish, sealed with the Lincoln wax seal.
// Pure markup (no hooks), so it renders on the server and inside the client-side opening sequence.
import type { CSSProperties, ReactNode } from 'react';

const FINISH: Record<string, [string, string, string, string]> = {
  railsplitter: ['#F0B98A', '#B0703F', '#5E361C', '#0D2219'], // bronze
  postmaster: ['#FFFFFF', '#BFC9CC', '#6B777B', '#0D2219'], // silver
  counselor: ['#9BE8C4', '#2E8C64', '#0E3F2B', '#E2BF66'], // emerald, gold ribbon
  statesman: ['#FFF1C4', '#D9B261', '#7E5B20', '#0D2219'], // gold
  president: ['#FFFFFF', '#DCE9E5', '#8EA7A0', '#14503A'], // platinum
};

export const TIER_LIGHT: Record<string, string> = { copper: '#E9A77A', silver: '#E6EEF0', gold: '#F0D58A', platinum: '#9EF0CF' };

function Wax({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true">
      <circle cx="80" cy="80" r="76" fill="#07150F" stroke="#D4AF5A" strokeWidth="7" />
      <clipPath id={id}><circle cx="80" cy="80" r="66" /></clipPath>
      <g clipPath={`url(#${id})`} fill="#D4AF5A">
        <path d="M57 8 L93 8 L96 51 L54 51 Z" />
        <path d="M40 51 Q76 45.5 110 51 L110 56.5 Q76 51.5 40 56.5 Z" />
        <path d="M55 56 L96 56 C97 62 98 67 97 72 C100 77 103 82 106 88 C104 90 102 91 99 92 C100 95 100 97 99 99 C100 101 100 103 98 105 C102 109 104 115 102 121 C99 129 91 133 83 132 C78 131 75 129 72 127 L73 133 C84 136 100 141 114 148 L120 154 L120 170 L24 170 L24 154 C32 143 44 136 56 132 L56 120 C50 113 47 102 47 90 C47 77 50 64 55 56 Z" />
      </g>
      <rect x="55" y="45.5" width="41" height="4.5" fill="#07150F" />
    </svg>
  );
}

/** state: 'idle' floats gently; 'charging' shakes; 'open' lid gone; 'open reveal' the watch has risen out. */
export function BoxArt({ slug, size = 'sm', state = '', light, riser }: {
  slug: string; size?: 'sm' | 'md' | 'lg'; state?: string; light?: string; riser?: ReactNode;
}) {
  const f = FINISH[slug] || FINISH.statesman;
  const style = { '--m1': f[0], '--m2': f[1], '--m3': f[2], '--rb': f[3], ...(light ? { '--tc': light } : {}) } as CSSProperties;
  return (
    <div className={`box3d ${size} ${state}`} style={style} aria-hidden="true">
      <span className="floor" /><span className="rays" /><span className="pillar" />
      <div className="cube">
        <div className="f back" /><div className="f left" /><div className="f bottom" /><div className="f inside" /><div className="f right" />
        <div className="f front"><span className="wax"><Wax id={`wax-${slug}-${size}`} /></span></div>
        <div className="lid"><div className="lf back" /><div className="lf left" /><div className="lf right" /><div className="lf front" /><div className="lf top" /></div>
      </div>
      <span className="riser">{riser}</span>
    </div>
  );
}

/** The big watch that rises out of an opened box, ringed in its value tier's colour. */
export function RisingWatch({ tier }: { tier: string }) {
  const c = TIER_LIGHT[tier] || TIER_LIGHT.gold;
  return (
    <svg viewBox="0 0 120 160" aria-hidden="true">
      <rect x="40" y="0" width="40" height="160" rx="8" fill="#23493B" />
      <rect x="44" y="4" width="32" height="152" rx="6" fill="none" stroke="rgba(255,255,255,.12)" />
      <circle cx="60" cy="80" r="48" fill={c} /><circle cx="60" cy="80" r="41" fill="#07150F" />
      <circle cx="60" cy="80" r="36" fill="#0D2219" stroke={c} strokeOpacity=".5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6, r1 = i % 3 ? 31 : 28;
        return <line key={i} x1={60 + Math.sin(a) * r1} y1={80 - Math.cos(a) * r1} x2={60 + Math.sin(a) * 34} y2={80 - Math.cos(a) * 34} stroke="#F3EEE2" strokeWidth={i % 3 ? 1.5 : 3} />;
      })}
      <path d="M60 80V58M60 80L75 89" stroke="#F3EEE2" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="80" r="3" fill={c} /><rect x="106" y="74" width="8" height="12" rx="2" fill={c} />
    </svg>
  );
}

/** Small watch icon ringed in the tier colour, for tiles and the contents list. */
export function TierWatchIcon({ tier }: { tier: string }) {
  const stroke = tier === 'copper' ? '#C47A48' : tier === 'silver' ? '#B7C1C4' : '#E2BF66';
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="14" y="2" width="12" height="36" rx="3" fill="#2B4A3D" />
      <circle cx="20" cy="20" r="12" fill="#07150F" stroke={stroke} strokeWidth="2.5" />
      <path d="M20 12v8l5 3" stroke="#F3EEE2" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
