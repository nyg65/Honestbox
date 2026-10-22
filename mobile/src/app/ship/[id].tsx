import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AddressForm, useAddress } from '../../components/AddressForm';
import { Button, H1, Loading, Muted, Notice, Screen } from '../../components/ui';
import { api, ApiError, type Pull } from '../../lib/api';
import { usd } from '../../lib/format';
import { useSession } from '../../lib/session';
import { useLoad } from '../../lib/useLoad';

export default function Ship() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { account, refresh } = useSession();
  const { data: p, error } = useLoad(() => api<Pull>(`pulls/${id}`));
  const addr = useAddress(account?.user.name, account?.user.state);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (!p) return <Screen><Notice text={error} />{!error && <Loading />}</Screen>;
  if (!p.watch || p.status !== 'vault') return <Screen><Notice text="This pull can't be shipped." /></Screen>;
  const fee = p.shipFeeCents ?? 0;

  async function ship() {
    setBusy(true); setMsg(null);
    try {
      await api(`pulls/${id}/ship`, { method: 'POST', body: addr.address });
      await refresh();
      router.back();
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not request shipping.'); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <H1 style={{ fontSize: 24 }}>Ship your {p.watch.brand} {p.watch.model}</H1>
      <Muted>
        Insured for its full value of {usd(p.watch.marketCents)}, signature required.{' '}
        {fee > 0 ? `Shipping is ${usd(fee)} for watches under $250, paid from your credit. Or sell it back for ${usd(p.buyback!.creditCents)} in credit.` : 'Free shipping in the US.'}
      </Muted>
      <Notice text={msg} />
      <AddressForm {...addr} />
      <Button title={fee > 0 ? `Ship it to me for ${usd(fee)}` : 'Ship it to me'} onPress={ship} busy={busy} disabled={!addr.complete} />
    </Screen>
  );
}
