import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Body, Button, Cert, H1, Italic, Loading, Mono, Muted, Notice, Row, Screen } from '../../components/ui';
import { api, ApiError, type Pull } from '../../lib/api';
import { usd } from '../../lib/format';
import { useSession } from '../../lib/session';
import { C, F } from '../../lib/theme';
import { useLoad } from '../../lib/useLoad';

export default function Sell() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refresh } = useSession();
  const { data: p, error } = useLoad(() => api<Pull>(`pulls/${id}`));
  const [method, setMethod] = useState<'credit' | 'cash'>('credit');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (!p) return <Screen><Notice text={error} />{!error && <Loading />}</Screen>;
  if (!p.watch || !p.buyback || p.status !== 'vault') return <Screen><Notice text="This pull can't be sold back." /></Screen>;
  const w = p.watch, q = p.buyback;

  async function sell() {
    setBusy(true); setMsg(null);
    try {
      await api<{ amountCents: number; pending: boolean }>(`pulls/${id}/sell`, { method: 'POST', body: { method } });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refresh();
      router.back();
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not complete the buyback.'); }
    finally { setBusy(false); }
  }

  const Option = ({ k, title, sub, cents }: { k: 'credit' | 'cash'; title: string; sub: string; cents: number }) => {
    const on = method === k;
    return (
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setMethod(k)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: C.panel, borderWidth: on ? 2 : 1, borderColor: on ? C.brass : C.rule }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.brass, alignItems: 'center', justifyContent: 'center' }}>
          {on && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.brass }} />}
        </View>
        <View style={{ flex: 1 }}><Body style={{ fontWeight: '600' }}>{title}</Body><Muted style={{ fontSize: 12.5 }}>{sub}</Muted></View>
        <Mono style={{ fontSize: 20 }}>{usd(cents)}</Mono>
      </Pressable>
    );
  };

  return (
    <Screen>
      <H1 style={{ fontSize: 26 }}>{w.brand} {w.model}</H1>
      <Muted>Pulled from {p.box.name}</Muted>
      <Notice text={msg} />
      <Cert>
        <Italic>The honest math, in full</Italic>
        <Row><Muted>Value when you pulled it</Muted><Mono>{usd(p.valueAtPullCents!)}</Mono></Row>
        <Row><Muted>Market value today</Muted><Mono>{usd(w.marketCents)}</Mono></Row>
        {p.lockedCents != null && <Row><Muted>Your locked value</Muted><Mono style={{ color: C.brass }}>{usd(p.lockedCents)}</Mono></Row>}
        <Row><Muted>Buyback is based on</Muted><Body style={{ fontFamily: F.mono }}>{q.basis === 'locked' ? 'locked value' : "today's value"}</Body></Row>
      </Cert>
      <Option k="credit" title="HonestBox credit" sub={`${q.creditPct}% of value · instant`} cents={q.creditCents} />
      <Option k="cash" title="Cash to your bank" sub={`${q.cashPct}% of value · reviewed, then 1–2 business days`} cents={q.cashCents} />
      <Muted style={{ fontSize: 13 }}>The watch goes back into the vault and back into its band, so the published odds stay fully stocked.</Muted>
      <Button title={`Sell it back for ${usd(method === 'credit' ? q.creditCents : q.cashCents)}`} onPress={sell} busy={busy} />
    </Screen>
  );
}
