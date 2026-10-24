'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mark } from './Mark.tsx';
import { type Pocket, slices, slicePath, pointAt, shortLabel, landedIndex, landingRotation } from '@/lib/wheel.ts';

const usd = (c: number) => `$${Math.round(c / 100).toLocaleString('en-US')}`;
const odds = (ppm: number) => (ppm >= 100_000 ? `${(ppm / 10_000).toFixed(0)}%` : ppm >= 10_000 ? `${(ppm / 10_000).toFixed(1)}%` : `${(ppm / 10_000).toFixed(2)}%`);

export function WheelFace({ pockets, rotation, spinning, size = 340, highlight }: { pockets: Pocket[]; rotation: number; spinning: boolean; size?: number; highlight?: number | null }) {
  const S = slices(pockets); const C = 160; const CY = 180; const R = 150;
  return (
    <div className="wheel" style={{ width: size, maxWidth: '100%' }}>
      <svg viewBox="0 0 320 340" role="img" aria-label={`Roulette wheel with ${pockets.length} watches, each slice sized to its odds`}>
        {/* pointer */}
        <path d="M 160 30 L 148 6 L 172 6 Z" fill="#E2C67F" stroke="#10261F" strokeWidth="1.5" />
        <g>
          <g className={spinning ? 'wheel-rotor spinning' : 'wheel-rotor'} style={{ transform: `rotate(${rotation}deg)`, transformBox: 'view-box', transformOrigin: `${C}px ${CY}px` }}>
            <circle cx={C} cy={CY} r={R + 6} fill="#0B1D17" stroke="#C9A85C" strokeWidth="2" />
            {S.map((s) => (
              <path key={s.index} d={slicePath(C, CY, R, s.start, s.end)} fill={s.fill}
                stroke={highlight === s.index ? '#F1EDE3' : '#0B1D17'} strokeWidth={highlight === s.index ? 2.5 : 0.8} />
            ))}
            {S.map((s) => {
              const span = s.end - s.start;
              if (span < 7) {
                const [x, y] = pointAt(C, CY, R + 1, s.mid);
                return <circle key={`t${s.index}`} cx={x} cy={y} r="3.2" fill="#E2C67F" stroke="#0B1D17" strokeWidth="1" />;
              }
              // Labels run radially from the rim toward the hub, like the numbers on a real wheel, so they read the same way wherever the wheel stops.
              const rotate = s.mid - 90; const flip = false;
              const fs = span > 30 ? 10.5 : span > 14 ? 9.5 : 8;
              return (
                <text key={`l${s.index}`} transform={`rotate(${rotate} ${C} ${CY})`} x={flip ? C - R + 10 : C + R - 10} y={CY + fs * 0.35}
                  textAnchor={flip ? 'start' : 'end'} fontSize={fs} fill={s.ink} fontFamily="IBM Plex Sans, sans-serif" fontWeight={s.rank < 3 ? 700 : 500}>
                  {shortLabel(s.label, span > 14 ? 17 : 13)}
                </text>
              );
            })}
            <circle cx={C} cy={CY} r="38" fill="#10261F" stroke="#C9A85C" strokeWidth="2" />
          </g>
          <foreignObject x={C - 30} y={CY - 30} width="60" height="60"><div style={{ display: 'grid', placeItems: 'center', width: 60, height: 60 }}><Mark size={56} /></div></foreignObject>
        </g>
      </svg>
    </div>
  );
}

export function Roulette({ pockets, onSpin }: { pockets: Pocket[]; onSpin: () => Promise<number> }) {
  const router = useRouter();
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'landed'>('ready');
  const [landed, setLanded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const finish = () => {
    if (done.current) return; done.current = true;
    setPhase('landed');
    try { navigator.vibrate?.([30, 40, 60]); } catch { /* not supported */ }
    setTimeout(() => router.refresh(), 1400);
  };

  useEffect(() => {
    if (phase !== 'spinning') return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(finish, reduce ? 700 : 6200); // fallback if transitionend never fires
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const spin = async () => {
    setError(null); setPhase('spinning');
    try {
      const roll = await onSpin();
      setLanded(landedIndex(pockets, roll));
      setRotation(landingRotation(roll));
    } catch {
      setPhase('ready'); setError('Something went wrong. Your pull is safe; try again.');
    }
  };

  const legend = slices(pockets).sort((a, b) => b.valueCents - a.valueCents);
  const hit = landed != null ? pockets[landed] : null;

  return (
    <div className="stack" style={{ alignItems: 'center', gap: 18, textAlign: 'center' }}>
      <div onTransitionEnd={(e) => { if (e.propertyName === 'transform' && landed != null) finish(); }}>
        <WheelFace pockets={pockets} rotation={rotation} spinning={phase !== 'ready'} highlight={phase === 'landed' ? landed : null} />
      </div>
      <div aria-live="polite" className="stack" style={{ gap: 6, alignItems: 'center', minHeight: 64 }}>
        {phase === 'landed' && hit ? (
          <>
            <span className="eyebrow">The pointer stopped on</span>
            <span className="serif" style={{ fontSize: '1.8rem', fontWeight: 700 }}>{hit.label}</span>
            <span className="mono brass">{usd(hit.valueCents)}</span>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-gold" style={{ minWidth: 220 }} disabled={phase !== 'ready'} onClick={spin}>
              {phase === 'spinning' ? 'Spinning…' : 'Spin the wheel'}
            </button>
            <span className="muted" style={{ fontSize: '0.88rem', maxWidth: 340 }}>Every watch in this box is on the wheel. Slices are drawn to the real odds, and where the pointer stops is your verifiable roll.</span>
          </>
        )}
        {error && <span style={{ color: 'var(--bad)' }}>{error}</span>}
      </div>
      <details className="card" style={{ width: '100%', textAlign: 'left' }}>
        <summary style={{ cursor: 'pointer' }}>The {pockets.length} watches on this wheel</summary>
        <ul className="legend">
          {legend.map((s) => (
            <li key={s.index} className={landed === s.index && phase === 'landed' ? 'hit' : ''}>
              <span className="swatch" style={{ background: s.fill }} />
              <span className="name">{s.label}</span>
              <span className="mono">{usd(s.valueCents)}</span>
              <span className="mono muted">{odds(s.oddsPpm)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
