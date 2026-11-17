'use client';
// The box opening: the box shakes, the lid flies off, a reel of watches streams out and slows to a stop on the
// pull, then the watch rises out of the box in its value tier's colour. The pull itself is the server's
// provably fair roll (onSpin returns it); the reel is decoration built around that result: every other tile
// is an independent draw at the box's real odds, and where the marker stops inside the winning tile is
// random within its middle 60%, so no near-misses are staged.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BoxArt, RisingWatch, TierWatchIcon, TIER_LIGHT } from './BoxArt.tsx';
import { BoxContents } from './BoxContents.tsx';
import { type Pocket, landedIndex, tierOf, PPM } from '@/lib/wheel.ts';

const usd = (c: number) => `$${Math.round(c / 100).toLocaleString('en-US')}`;
const oneIn = (ppm: number) => { const n = PPM / ppm; return `1 in ${n >= 100 ? Math.round(n).toLocaleString('en-US') : n >= 10 ? n.toFixed(0) : n.toFixed(1)}`; };
const ease = (t: number) => 1 - Math.pow(1 - t, 3.2);
const N = 42, W = 33, PITCH = 120, TILE = 112;

type Phase = 'ready' | 'charging' | 'reeling' | 'landed' | 'reveal' | 'done';

function drawIndex(pockets: Pocket[]) {
  const buf = new Uint32Array(1); crypto.getRandomValues(buf);
  return landedIndex(pockets, Math.floor((buf[0] / 4294967296) * PPM));
}

export function BoxOpening({ slug, pockets, priceCents, photos, onSpin }: {
  slug: string; pockets: Pocket[]; priceCents: number; photos?: (string | null)[]; onSpin: () => Promise<number>;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('ready');
  const [win, setWin] = useState<number | null>(null);
  const [tiles, setTiles] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState(true);
  const strip = useRef<HTMLDivElement>(null);
  const reel = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const soundRef = useRef(true);
  useEffect(() => { soundRef.current = sound; }, [sound]);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const tone = (freq: number, dur: number, vol: number, type: OscillatorType = 'triangle') => {
    if (!soundRef.current) return;
    try {
      audio.current = audio.current || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const ctx = audio.current, o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch { /* no audio */ }
  };
  const buzz = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* not supported */ } };

  async function open() {
    if (phase !== 'ready') return;
    setError(null); setPhase('charging'); buzz([20, 60, 20, 60, 30]);
    [0, 450, 800, 1050, 1250].forEach((ms) => setTimeout(() => tone(140 + ms / 8, 0.12, 0.08, 'sine'), ms));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let roll: number;
    try {
      [roll] = await Promise.all([onSpin(), new Promise((r) => setTimeout(r, reduce ? 300 : 1500))]) as [number, unknown];
    } catch {
      setPhase('ready'); setError('Something went wrong opening the box. Your pull is safe; try again.'); return;
    }
    const idx = landedIndex(pockets, roll);
    setWin(idx);
    setTiles(Array.from({ length: N }, (_, i) => (i === W ? idx : drawIndex(pockets))));
    setPhase('reeling'); tone(880, 0.25, 0.07, 'sine');
    setTimeout(() => spinReel(reduce, idx), reduce ? 50 : 350);
  }

  function spinReel(reduce: boolean, idx: number) {
    const el = strip.current, box = reel.current; if (!el || !box) return;
    const winW = box.clientWidth;
    const jitter = (Math.random() - 0.5) * TILE * 0.6;
    const end = -(W * PITCH + TILE / 2 + jitter) + winW / 2, start = winW / 2 - TILE / 2 + 40;
    const dur = reduce ? 700 : 9500;
    let t0: number | null = null, last = -1;
    const frame = (now: number) => {
      if (t0 === null) t0 = now;
      const k = Math.min(1, (now - t0) / dur), x = start + (end - start) * ease(k);
      el.style.transform = `translateX(${x.toFixed(1)}px)`;
      const under = Math.floor((winW / 2 - x) / PITCH);
      if (under !== last && under >= 0) { last = under; tone(2100, 0.03, 0.06, 'square'); if (k > 0.55) buzz(8); }
      if (k < 1) requestAnimationFrame(frame); else land(idx, reduce);
    };
    requestAnimationFrame(frame);
  }

  function land(idx: number, reduce: boolean) {
    const t = tierOf(pockets[idx].valueCents).id, big = t === 'gold' || t === 'platinum';
    setPhase('landed');
    [523, 659, 784, big ? 1047 : 0].filter(Boolean).forEach((f, i) => setTimeout(() => tone(f, big ? 0.9 : 0.5, 0.09, 'sine'), i * 90));
    buzz(big ? [40, 30, 90] : 40);
    setTimeout(() => setPhase('reveal'), reduce ? 150 : 1100);
    setTimeout(() => setPhase('done'), reduce ? 350 : 2400);
    setTimeout(() => router.refresh(), reduce ? 1200 : 5200);
  }

  const hit = win != null ? pockets[win] : null;
  const tier = hit ? tierOf(hit.valueCents) : null;
  const big = !!tier && (tier.id === 'gold' || tier.id === 'platinum');
  const boxState = phase === 'ready' ? 'idle' : phase === 'charging' ? 'charging' : phase === 'reveal' || phase === 'done' ? 'open reveal' : 'open';

  return (
    <div className="sheet" style={{ width: '100%' }}>
      <button className="sound" type="button" aria-pressed={sound} onClick={() => setSound(!sound)}>{sound ? 'Sound on' : 'Sound off'}</button>
      <div className="stage">
        <div ref={reel} className={`reel${phase === 'reeling' || phase === 'landed' ? ' show' : ''}${phase === 'reveal' || phase === 'done' ? ' done' : ''}`} aria-hidden="true">
          <div className="marker" />
          <div ref={strip} className={`strip${phase === 'landed' || phase === 'reveal' || phase === 'done' ? ' landed' : ''}`}>
            {tiles.map((pi, i) => {
              const p = pockets[pi], t = tierOf(p.valueCents).id;
              return (
                <div key={i} className={`tile t-ring-${t}${i === W ? ' win' : ''}`}>
                  <span className="ic">{photos?.[pi] ? <img src={photos[pi]!} alt="" width={52} height={52} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} /> : <TierWatchIcon tier={t} />}</span>
                  <span className="nm">{p.label}</span><span className="vl">{usd(p.valueCents)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <BoxArt slug={slug} size="lg" state={boxState} light={phase === 'reveal' || phase === 'done' ? TIER_LIGHT[tier?.id || 'gold'] : undefined}
          riser={tier ? (win != null && photos?.[win] ? <img src={photos[win]!} alt="" style={{ width: '100%', borderRadius: 16 }} /> : <RisingWatch tier={tier.id} />) : null} />
        {big && (phase === 'reveal' || phase === 'done') && (
          <div className="burst" aria-hidden="true">
            {Array.from({ length: 40 }, (_, i) => {
              const a = (i / 40) * Math.PI * 2 + (i % 3) * 0.2, d = 130 + ((i * 37) % 110);
              return <i key={i} style={{ ['--x' as string]: `${(Math.cos(a) * d).toFixed(0)}px`, ['--y' as string]: `${(Math.sin(a) * d - 50).toFixed(0)}px`, ['--r' as string]: `${((i * 53) % 540) - 270}deg`, ['--d' as string]: `${((i % 6) * 0.04 + 0.15).toFixed(2)}s` }} />;
            })}
          </div>
        )}
      </div>
      <div className="result" aria-live="polite">
        {phase === 'done' && hit && tier ? (
          <>
            {big ? <span className="bigpull">{tier.label} pull</span> : <span className="eyebrow">You pulled</span>}
            <span className="watch">{hit.label}</span>
            <span className="mono" style={{ color: 'var(--brass-hi)' }}>{usd(hit.valueCents)} · {oneIn(hit.oddsPpm)} in this box</span>
            <button type="button" className="btn btn-gold" style={{ marginTop: 6 }} onClick={() => router.refresh()}>See your watch</button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-gold btn-xl" style={{ minWidth: 240 }} disabled={phase !== 'ready'} onClick={open}>
              {phase === 'ready' ? 'Open the box' : 'Opening…'}
            </button>
            <span className="muted" style={{ fontSize: '0.88rem', maxWidth: 380 }}>Every watch that could be inside is listed below with its odds. The watch you get is decided by your provably fair roll.</span>
          </>
        )}
        {error && <span style={{ color: 'var(--bad)' }}>{error}</span>}
      </div>
      <BoxContents pockets={pockets} priceCents={priceCents} hit={phase === 'done' ? win : null} photos={photos} />
      <p className="quiet" style={{ fontSize: '0.8rem' }}>The reel is filled with draws at these same odds, so rare watches pass by rarely, and it stops on your roll without staging near-misses.</p>
    </div>
  );
}

/** The opened box with the pulled watch risen out of it, for the pull page after the reveal. */
export function BoxOpened({ slug, tier, photo }: { slug: string; tier: string; photo?: string | null }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', overflow: 'hidden', marginInline: -20, paddingTop: 50 }}>
      <BoxArt slug={slug} size="md" state="open reveal" light={TIER_LIGHT[tier]} riser={photo ? <img src={photo} alt="" style={{ width: '100%', borderRadius: 16 }} /> : <RisingWatch tier={tier} />} />
    </div>
  );
}
