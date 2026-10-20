import { notFound } from 'next/navigation';
import { Shell } from '@/components/Shell.tsx';
import { settings, num, excludedStates } from '@/lib/engine.ts';
import { usd } from '@/lib/money.ts';

export const dynamic = 'force-dynamic';

const TITLES: Record<string, string> = {
  rules: 'Official rules and odds', 'free-entry': 'Free entry method', buyback: 'Buyback terms', terms: 'Terms of service', privacy: 'Privacy policy',
};

export default async function Legal({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!TITLES[page]) notFound();
  const s = settings();
  return (
    <Shell>
      <div className="narrow page stack" style={{ gap: 18, maxWidth: 720 }}>
        <h1 style={{ fontSize: '2.3rem' }}>{TITLES[page]}</h1>
        <div className="flash flash-error">Draft for HonestBox&apos;s attorney to replace. This page is not legal terms yet.</div>
        {page === 'rules' && <>
          <p>Each box lists every prize band, its value and its exact odds on the box page. Odds always add up to 100%, and a box cannot be opened unless every prize band is in stock.</p>
          <p>Eligibility: {num(s, 'min_age')} or older, US residents only. Boxes are not offered to residents of {excludedStates(s).join(', ') || 'no excluded states'}.</p>
        </>}
        {page === 'free-entry' && <p>[Attorney to write: the free, no-purchase way to enter, such as a mailed request, with limits per person and the same odds as a paid entry.]</p>}
        {page === 'buyback' && <>
          <p>You can sell any pull back while it is in your vault: {num(s, 'buyback_credit_bp') / 100}% of its market value as HonestBox credit, paid instantly, or {num(s, 'buyback_cash_bp') / 100}% as cash after review.</p>
          <p>Cash payouts over {usd(num(s, 'cash_id_threshold_cents'))} need a verified ID. You have {num(s, 'hold_days')} days from a pull to sell it back or ship it.</p>
        </>}
        {page === 'terms' && <p>[Attorney to write.]</p>}
        {page === 'privacy' && <p>[Attorney to write. HonestBox stores your name, email, state, shipping addresses and your credit history. It does not sell personal data.]</p>}
      </div>
    </Shell>
  );
}
