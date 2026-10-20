import { US_STATES } from '@/lib/auth.ts';

export function AddressFields({ name, state }: { name?: string; state?: string }) {
  return (
    <>
      <label htmlFor="a-name">Full name<input id="a-name" name="name" autoComplete="name" defaultValue={name} required /></label>
      <label htmlFor="a-line1">Street address<input id="a-line1" name="line1" autoComplete="address-line1" required /></label>
      <label htmlFor="a-line2">Apartment, suite (optional)<input id="a-line2" name="line2" autoComplete="address-line2" /></label>
      <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
        <label htmlFor="a-city" style={{ flex: '2 1 180px' }}>City<input id="a-city" name="city" autoComplete="address-level2" required /></label>
        <label htmlFor="a-state" style={{ flex: '1 1 90px' }}>State
          <select id="a-state" name="state" defaultValue={state} required>{US_STATES.map((s) => <option key={s}>{s}</option>)}</select>
        </label>
        <label htmlFor="a-zip" style={{ flex: '1 1 110px' }}>ZIP<input id="a-zip" name="zip" autoComplete="postal-code" inputMode="numeric" pattern="\d{5}(-\d{4})?" required /></label>
      </div>
    </>
  );
}
