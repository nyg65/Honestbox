// Roulette-wheel geometry shared by the website (and mirrored in mobile/src/lib/wheel.ts).
// Each pocket's slice is drawn to its real odds, in the box's wheel order, clockwise from the top.
// The pointer sits at the top; the wheel stops with the pointer exactly at roll / 1,000,000 of a turn,
// which is the same cumulative walk pickBand() uses. So where the pointer stops is the verifiable roll.

export type Pocket = { bandId: number; label: string; valueCents: number; oddsPpm: number };
export type Slice = Pocket & { index: number; start: number; end: number; mid: number; fill: string; ink: string; rank: number };

export const PPM = 1_000_000;

export function pocketsOf(snapshot: string): Pocket[] {
  return (JSON.parse(snapshot) as { id: number; label: string; value_cents: number; odds_ppm: number }[])
    .filter((b) => b.odds_ppm > 0)
    .map((b) => ({ bandId: b.id, label: b.label, valueCents: b.value_cents, oddsPpm: b.odds_ppm }));
}

export function slices(pockets: Pocket[]): Slice[] {
  const order = [...pockets].map((p, i) => [p.valueCents, i] as const).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
  let acc = 0;
  return pockets.map((p, index) => {
    const start = (acc / PPM) * 360; acc += p.oddsPpm; const end = (acc / PPM) * 360;
    const rank = order.indexOf(index);
    const top = rank < 3;
    return { ...p, index, start, end, mid: (start + end) / 2, rank,
      fill: top ? ['#C9A85C', '#B8954A', '#A8853F'][rank] : index % 2 ? '#183329' : '#23493B',
      ink: top ? '#10261F' : '#F1EDE3' };
  });
}

export function landedIndex(pockets: Pocket[], rollPpm: number): number {
  let acc = 0;
  for (let i = 0; i < pockets.length; i++) { acc += pockets[i].oddsPpm; if (rollPpm < acc) return i; }
  return pockets.length - 1;
}

/** Clockwise rotation in degrees that brings the roll's angle under the top pointer, after `turns` full turns. */
export function landingRotation(rollPpm: number, turns = 6): number {
  return turns * 360 - (rollPpm / PPM) * 360;
}

const pt = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)] as const;
};

export function slicePath(cx: number, cy: number, r: number, start: number, end: number): string {
  if (end - start >= 359.999) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  const [x0, y0] = pt(cx, cy, r, start); const [x1, y1] = pt(cx, cy, r, end);
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

export function pointAt(cx: number, cy: number, r: number, deg: number) { return pt(cx, cy, r, deg); }

/** Radial label placement: text runs outward from the hub, flipped on the left half so it never reads upside down. */
export function labelTransform(cx: number, cy: number, mid: number): { rotate: number; flip: boolean } {
  const flip = mid > 180;
  return { rotate: flip ? mid + 90 : mid - 90, flip };
}

export function shortLabel(label: string, max = 15): string {
  return label.length <= max ? label : `${label.slice(0, max - 1).trimEnd()}…`;
}
