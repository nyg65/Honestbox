import Link from 'next/link';

const LINKS: [string, string][] = [
  ['/admin', 'Overview'], ['/admin/inventory', 'Inventory'], ['/admin/boxes/railsplitter', 'Box I'], ['/admin/boxes/statesman', 'Box II'], ['/admin/boxes/president', 'Box III'],
  ['/admin/drops', 'Drops'], ['/admin/payouts', 'Payouts'], ['/admin/shipments', 'Shipping'], ['/admin/settings', 'Settings and affiliates'],
];

export function AdminNav({ here }: { here: string }) {
  return (
    <nav aria-label="Admin" className="row" style={{ gap: 8, borderBottom: '1px solid var(--rule)', paddingBottom: 14 }}>
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} className={`pill ${here === href ? 'pill-brass' : ''}`} style={{ textDecoration: 'none' }}>{label}</Link>
      ))}
    </nav>
  );
}
