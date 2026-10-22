import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WatchArt } from '../../components/art';
import { AddressForm, useAddress } from '../../components/AddressForm';
import { Body, Button, Card, Cert, H1, Italic, Loading, Mono, Muted, Notice, Pill, Row, Screen } from '../../components/ui';
import { api, ApiError, type DropItem } from '../../lib/api';
import { usd } from '../../lib/format';
import { useSession } from '../../lib/session';
import { C } from '../../lib/theme';
import { useLoad } from '../../lib/useLoad';

export default function DropItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { account, refresh } = useSession();
  const { data: it, setData, error, refreshing, reload } = useLoad(() => api<DropItem>(`drop/items/${id}`));
  const addr = useAddress(account?.user.name, account?.user.state);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 15_000); return () => clearInterval(t); }, []);

  if (!it) return <Screen><Notice text={error} />{!error && <Loading />}</Screen>;
  const mins = it.heldUntil ? Math.max(0, Math.ceil((Date.parse(it.heldUntil) - Date.now()) / 60_000)) : 0;
  const bal = account?.balanceCents ?? 0;
  const under = it.marketCents - it.priceCents;

  const act = async (path: 'hold' | 'release') => {
    setBusy(true); setMsg(null);
    try { setData(await api<DropItem>(`drop/items/${id}/${path}`, { method: 'POST', body: {} })); }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : 'Something went wrong.', kind: 'error' }); await reload(); }
    finally { setBusy(false); }
  };

  async function buy() {
    setBusy(true); setMsg(null);
    try {
      await api(`drop/items/${id}/buy`, { method: 'POST', body: addr.address });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refresh(); await reload();
      setMsg({ text: 'Bought. Your watch ships insured, and we will email tracking.', kind: 'ok' });
    } catch (e) { setMsg({ text: e instanceof ApiError ? e.message : 'Could not complete the purchase.', kind: 'error' }); await reload(); }
    finally { setBusy(false); }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={() => reload(true)}>
      <Stack.Screen options={{ title: it.brand }} />
      <Notice text={msg?.text} kind={msg?.kind} />
      <Cert>
        <View style={{ alignItems: 'center' }}><WatchArt brand={it.brand} size={160} /></View>
        <H1 style={{ fontSize: 26 }}>{it.brand} {it.model}</H1>
        <Muted style={{ fontSize: 13 }}>{[it.reference && `Ref. ${it.reference}`, it.sizeMm && `${it.sizeMm} mm`, it.year].filter(Boolean).join(' · ')}</Muted>
        <Row style={{ alignItems: 'flex-end' }}>
          <View><Muted style={{ fontSize: 12 }}>Honest price</Muted><Mono style={{ fontSize: 28, color: C.brass }}>{usd(it.priceCents)}</Mono></View>
          <View style={{ alignItems: 'flex-end' }}><Muted style={{ fontSize: 12 }}>Avg. of {it.salesCount} recent sales</Muted><Mono>{usd(it.marketCents)}</Mono></View>
        </Row>
        {under > 0 && <Italic>{usd(under)} under the recent sales average.</Italic>}
        <Row style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <Pill text={`${it.condition} condition`} /><Pill text={it.papers} />{it.authenticated && <Pill text="Authenticated" />}
        </Row>
      </Cert>

      {it.status === 'sold' ? (
        <Card><Body>{it.boughtByYou ? 'You bought this piece. It is on its way.' : 'Sold. Another collector got there first.'}</Body></Card>
      ) : it.status === 'held_by_you' ? (
        <View style={{ gap: 12 }}>
          <Card><Body style={{ color: C.brass, fontWeight: '600' }}>Held for you for {mins} more minute{mins === 1 ? '' : 's'}.</Body><Muted style={{ fontSize: 13 }}>Enter your shipping address to buy with your credit ({usd(bal)} available).</Muted></Card>
          <AddressForm {...addr} />
          <Button title={`Buy for ${usd(it.priceCents)}`} onPress={buy} busy={busy} disabled={!addr.complete || bal < it.priceCents} />
          {bal < it.priceCents && <Muted style={{ fontSize: 13, textAlign: 'center' }}>You need {usd(it.priceCents - bal)} more credit.</Muted>}
          <Button title="Release it" kind="plain" onPress={() => act('release')} />
        </View>
      ) : it.status === 'held' ? (
        <Card><Body>Someone is checking out with this piece. If they don&apos;t buy it within a few minutes, it comes back.</Body></Card>
      ) : (
        <Button title="Hold it for 10 minutes" onPress={() => act('hold')} busy={busy} />
      )}
      <Button title="Back to the drop" kind="plain" onPress={() => router.back()} />
    </Screen>
  );
}
