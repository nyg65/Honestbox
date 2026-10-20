'use client';
// Live math for the box editor: odds total, expected value and house edge update as you type.
import { useState } from 'react';

type Row = { id: number; label: string; value: string; odds: string; stock: number };
const money = (c: number) => `$${Math.round(c).toLocaleString('en-US')}`;

export function OddsEditor({ price: p0, rows: r0 }: { price: string; rows: Row[] }) {
  const [price, setPrice] = useState(p0);
  const [rows, setRows] = useState(r0);
  const total = rows.reduce((a, r) => a + (parseFloat(r.odds) || 0), 0);
  const ev = rows.reduce((a, r) => a + (parseFloat(r.value.replace(/[$,]/g, '')) || 0) * ((parseFloat(r.odds) || 0) / 100), 0);
  const pr = parseFloat(price.replace(/[$,]/g, '')) || 0;
  const edge = pr ? 1 - ev / pr : 0;
  const ok = Math.abs(total - 100) < 1e-9;
  const set = (i: number, k: 'label' | 'value' | 'odds', v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className="stack" style={{ gap: 14 }}>
      <label htmlFor="price" style={{ maxWidth: 220 }}>Box price ($)<input id="price" name="price" className="mono" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
      <div className="scroll"><table className="data" style={{ minWidth: 640 }}>
        <thead><tr><th>Band name</th><th className="num">Value ($)</th><th className="num">Odds (%)</th><th className="num">In stock</th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.id}>
            <td><input type="hidden" name="band_id" value={r.id} /><input aria-label="Band name" name="label" value={r.label} onChange={(e) => set(i, 'label', e.target.value)} /></td>
            <td><input aria-label="Value in dollars" name="value" className="mono" style={{ textAlign: 'right' }} value={r.value} onChange={(e) => set(i, 'value', e.target.value)} /></td>
            <td><input aria-label="Odds in percent" name="odds" className="mono" style={{ textAlign: 'right' }} value={r.odds} onChange={(e) => set(i, 'odds', e.target.value)} /></td>
            <td className="num" style={{ color: r.stock < 1 && parseFloat(r.odds) > 0 ? 'var(--bad)' : undefined }}>{r.stock}</td>
          </tr>
        ))}</tbody>
      </table></div>
      <div className="row" style={{ gap: 24 }}>
        <span>Odds total: <span className="mono" style={{ color: ok ? 'var(--good)' : 'var(--bad)' }}>{total.toFixed(4)}%</span></span>
        <span>Expected value: <span className="mono">{money(ev)}</span></span>
        <span>House edge: <span className="mono brass">{(edge * 100).toFixed(1)}%</span></span>
      </div>
      {!ok && <p style={{ color: 'var(--bad)' }}>Odds must add up to exactly 100% before you can save.</p>}
      {edge < 0.05 && ok && <p style={{ color: 'var(--bad)' }}>Warning: an edge under 5% will not cover buybacks, shipping and card fees.</p>}
      <button className="btn btn-gold" disabled={!ok} style={{ alignSelf: 'flex-start' }}>Save and publish</button>
    </div>
  );
}
