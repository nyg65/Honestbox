// Brand drawings: the Lincoln medallion (an original silhouette, not a coin or banknote engraving), the stovepipe hat and watch faces.
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg';
import { C } from '../lib/theme';

const SIL = [
  'M57 8 L93 8 L96 51 L54 51 Z',
  'M40 51 Q76 45.5 110 51 L110 56.5 Q76 51.5 40 56.5 Z',
  'M55 56 L96 56 C97 62 98 67 97 72 C100 77 103 82 106 88 C104 90 102 91 99 92 C100 95 100 97 99 99 C100 101 100 103 98 105 C102 109 104 115 102 121 C99 129 91 133 83 132 C78 131 75 129 72 127 L73 133 C84 136 100 141 114 148 L120 154 L120 170 L24 170 L24 154 C32 143 44 136 56 132 L56 120 C50 113 47 102 47 90 C47 77 50 64 55 56 Z',
];

export function Mark({ size = 40, detail = false }: { size?: number; detail?: boolean }) {
  const id = `m${size}${detail ? 'd' : ''}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs><ClipPath id={id}><Circle cx="80" cy="80" r={detail ? 66 : 68} /></ClipPath></Defs>
      <Circle cx="80" cy="80" r="76" fill={C.deep} stroke={C.brass} strokeWidth={detail ? 2.5 : 5} />
      {detail && <Circle cx="80" cy="80" r="70" fill="none" stroke={C.brass} strokeWidth="1" strokeDasharray="1.5 2.5" />}
      <G clipPath={`url(#${id})`}>{SIL.map((d) => <Path key={d} d={d} fill={C.brass} />)}</G>
      <Rect x="55" y="45.5" width="41" height="4.5" fill={C.deep} />
    </Svg>
  );
}

export function Hat({ size = 150, color = C.brass }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 130 130">
      <Path d="M38 12 L92 12 L96 92 L34 92 Z" fill={color} />
      <Rect x="35" y="76" width="60" height="9" fill={C.panel} />
      <Path d="M10 92 Q65 83 120 92 L120 101 Q65 93 10 101 Z" fill={color} />
    </Svg>
  );
}

const ART: Record<string, { dial: string; bezel: string }> = {
  Rolex: { dial: '#0B1D17', bezel: '#14532D' }, Omega: { dial: '#111111', bezel: '#3A3A3A' }, Tudor: { dial: '#111111', bezel: '#8A1F2A' },
  Cartier: { dial: '#EDE6D6', bezel: '#C9A85C' }, Tissot: { dial: '#1C3B5A', bezel: '#A9B5AC' }, Hamilton: { dial: '#2B3A2A', bezel: '#A9B5AC' },
  Seiko: { dial: '#1C2B4A', bezel: '#2E4C40' }, Citizen: { dial: '#14324A', bezel: '#1E5F8A' }, Orient: { dial: '#EDE6D6', bezel: '#A9B5AC' },
  Casio: { dial: '#1A1A1A', bezel: '#3A3A3A' }, Timex: { dial: '#EDE6D6', bezel: '#6F857A' },
};

export function WatchArt({ brand, size = 140 }: { brand: string; size?: number }) {
  const a = ART[brand] || { dial: C.deep, bezel: C.brass };
  return (
    <Svg width={size} height={size} viewBox="0 0 150 150">
      <Rect x="56" y="4" width="38" height="30" rx="6" fill={C.rule} />
      <Rect x="56" y="116" width="38" height="30" rx="6" fill={C.rule} />
      <Circle cx="75" cy="75" r="48" fill={C.deep} stroke={a.bezel} strokeWidth="8" />
      <Circle cx="75" cy="75" r="38" fill={a.dial} />
      <G stroke={C.ivory} strokeWidth="2">
        <Line x1="75" y1="41" x2="75" y2="47" /><Line x1="109" y1="75" x2="103" y2="75" /><Line x1="75" y1="109" x2="75" y2="103" /><Line x1="41" y1="75" x2="47" y2="75" />
      </G>
      <Line x1="75" y1="75" x2="75" y2="50" stroke={C.ivory} strokeWidth="3" strokeLinecap="round" />
      <Line x1="75" y1="75" x2="94" y2="84" stroke={C.ivory} strokeWidth="3" strokeLinecap="round" />
      <Circle cx="75" cy="75" r="3.5" fill={C.brass} />
    </Svg>
  );
}
