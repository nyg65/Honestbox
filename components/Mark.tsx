// The HonestBox Lincoln medallion. Original silhouette; not based on any coin or banknote engraving.
export function Mark({ size = 40, detail = false, label }: { size?: number; detail?: boolean; label?: string }) {
  const id = `hbclip${size}${detail ? 'd' : ''}`;
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx="80" cy="80" r="76" fill="#0B1D17" stroke="#C9A85C" strokeWidth={detail ? 2 : 5} />
      {detail && <circle cx="80" cy="80" r="70" fill="none" stroke="#C9A85C" strokeWidth="1" strokeDasharray="1.5 2.5" />}
      <clipPath id={id}><circle cx="80" cy="80" r={detail ? 66 : 68} /></clipPath>
      <g clipPath={`url(#${id})`} fill="#C9A85C">
        <path d="M57 8 L93 8 L96 51 L54 51 Z" />
        <path d="M40 51 Q76 45.5 110 51 L110 56.5 Q76 51.5 40 56.5 Z" />
        <path d="M55 56 L96 56 C97 62 98 67 97 72 C100 77 103 82 106 88 C104 90 102 91 99 92 C100 95 100 97 99 99 C100 101 100 103 98 105 C102 109 104 115 102 121 C99 129 91 133 83 132 C78 131 75 129 72 127 L73 133 C84 136 100 141 114 148 L120 154 L120 170 L24 170 L24 154 C32 143 44 136 56 132 L56 120 C50 113 47 102 47 90 C47 77 50 64 55 56 Z" />
      </g>
      <rect x="55" y="45.5" width="41" height="4.5" fill="#0B1D17" />
    </svg>
  );
}

export function Hat({ size = 140 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 130 130" aria-hidden="true">
      <path d="M38 12 L92 12 L96 92 L34 92 Z" fill="currentColor" />
      <rect x="35" y="76" width="60" height="9" fill="#183329" />
      <path d="M10 92 Q65 83 120 92 L120 101 Q65 93 10 101 Z" fill="currentColor" />
    </svg>
  );
}

export function WatchArt({ size = 150, dial = '#0B1D17', bezel = '#C9A85C' }: { size?: number; dial?: string; bezel?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" aria-hidden="true">
      <rect x="56" y="4" width="38" height="30" rx="6" fill="#2E4C40" />
      <rect x="56" y="116" width="38" height="30" rx="6" fill="#2E4C40" />
      <circle cx="75" cy="75" r="48" fill="#0B1D17" stroke={bezel} strokeWidth="8" />
      <circle cx="75" cy="75" r="38" fill={dial} />
      <g stroke="#F1EDE3" strokeWidth="2"><line x1="75" y1="41" x2="75" y2="47" /><line x1="109" y1="75" x2="103" y2="75" /><line x1="75" y1="109" x2="75" y2="103" /><line x1="41" y1="75" x2="47" y2="75" /></g>
      <line x1="75" y1="75" x2="75" y2="50" stroke="#F1EDE3" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="75" x2="94" y2="84" stroke="#F1EDE3" strokeWidth="3" strokeLinecap="round" />
      <circle cx="75" cy="75" r="3.5" fill="#C9A85C" />
    </svg>
  );
}

/** A stable bezel and dial color per brand, so drawings differ without photos. */
export function artFor(brand: string): { dial: string; bezel: string } {
  const m: Record<string, { dial: string; bezel: string }> = {
    Rolex: { dial: '#0B1D17', bezel: '#14532D' }, Omega: { dial: '#111111', bezel: '#3A3A3A' }, Tudor: { dial: '#111111', bezel: '#8A1F2A' },
    Cartier: { dial: '#EDE6D6', bezel: '#C9A85C' }, Tissot: { dial: '#1C3B5A', bezel: '#A9B5AC' }, Hamilton: { dial: '#2B3A2A', bezel: '#A9B5AC' },
    Seiko: { dial: '#1C2B4A', bezel: '#2E4C40' }, Citizen: { dial: '#14324A', bezel: '#1E5F8A' }, Orient: { dial: '#EDE6D6', bezel: '#A9B5AC' },
  };
  return m[brand] || { dial: '#0B1D17', bezel: '#C9A85C' };
}
