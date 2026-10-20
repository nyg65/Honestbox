'use client';
import { useState } from 'react';
import { Hat } from './Mark.tsx';

export function Reveal({ revealed, onReveal, children }: { revealed: boolean; onReveal: () => Promise<void>; children: React.ReactNode }) {
  const [open, setOpen] = useState(revealed);
  const [tipping, setTipping] = useState(false);
  if (open) return <div className="rise">{children}</div>;
  return (
    <div className="stack" style={{ alignItems: 'center', gap: 26, paddingBlock: 30, textAlign: 'center' }}>
      <button
        type="button"
        className={`hat${tipping ? ' tipping' : ''}`}
        aria-label="Lift the hat to reveal your watch"
        disabled={tipping}
        onClick={async () => {
          setTipping(true);
          const done = onReveal().catch(() => undefined);
          await new Promise((r) => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800));
          await done;
          setOpen(true);
        }}
      >
        <Hat size={150} />
      </button>
      <div className="stack" style={{ gap: 8, alignItems: 'center' }}>
        <span className="serif" style={{ fontSize: '1.9rem', fontWeight: 700 }}>Tap to reveal</span>
        <span className="italic brass" style={{ maxWidth: 300, fontSize: '1.05rem', lineHeight: 1.4 }}>Lincoln kept his most important papers in his hat. We keep your pull in ours.</span>
      </div>
    </div>
  );
}
