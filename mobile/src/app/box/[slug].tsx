import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { WheelFace } from '../../components/WheelReveal';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Body, Button, Card, Eyebrow, H1, Italic, Loading, Mono, Muted, Notice, Row, Rule, Screen } from '../../components/ui';
import { api, ApiError, type BoxDetail } from '../../lib/api';
import { oneIn, pct, usd } from '../../lib/format';
import { useSession } from '../../lib/session';
import { C, F } from '../../lib/theme';
import { useLoad } from '../../lib/useLoad';

export default function BoxScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { account, refresh } = useSession();
  const { data: box, error, refreshing, reload } = useLoad(() => api<BoxDetail>(`boxes/${slug}`));
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  if (!box) return <Screen><Notice text={error} />{!error && <Loading />}</Screen>;
  const maxOdds = Math.max(...box.bands.map((b) => b.oddsPpm));
  const pockets = box.bands.filter((b) => b.oddsPpm > 0).map((b, i) => ({ bandId: i, label: b.label, valueCents: b.valueCents, oddsPpm: b.oddsPpm }));
  const short = (account?.balanceCents ?? 0) < box.priceCents;

  async function open() {
    setBusy(true); setMsg(null);
    try {
      const r = await api<{ pullId: number }>(`boxes/${slug}/open`, { method: 'POST', body: {} });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await refresh();
      router.replace(`/pull/${r.pullId}`);
    } catch (e) { setMsg(e instanceof ApiError ? e.message : 'Could not open the box.'); setConfirming(false); }
    finally { setBusy(false); }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={() => reload(true)}>
      <Stack.Screen options={{ title: box.name }} />
      <Row style={{ alignItems: 'flex-end' }}>
        <View style={{ gap: 4 }}><Eyebrow>Box {box.numeral}</Eyebrow><H1>{box.name}</H1></View>
        <Mono style={{ fontSize: 26 }}>{usd(box.priceCents)}</Mono>
      </Row>
      <Row style={{ gap: 10 }}>
        <Card style={{ flex: 1, padding: 12, gap: 2 }}><Muted style={{ fontSize: 12 }}>Expected value</Muted><Mono style={{ fontSize: 18 }}>{usd(box.expectedValueCents)}</Mono></Card>
        <Card style={{ flex: 1, padding: 12, gap: 2 }}><Muted style={{ fontSize: 12 }}>House edge</Muted><Mono style={{ fontSize: 18, color: C.brass }}>{(box.houseEdge * 100).toFixed(1)}%</Mono></Card>
      </Row>
      <Muted style={{ fontSize: 13 }}>Sell back any pull for {box.buyback.creditPct}% of market value in credit, or {box.buyback.cashPct}% in cash.</Muted>

      <Eyebrow>The wheel: {pockets.length} watches</Eyebrow>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <WheelFace pockets={pockets} rotation={0} size={Math.min(width - 48, 340)} />
        <Muted style={{ fontSize: 13, textAlign: 'center' }}>Every watch in the box is a slice, drawn to its real odds. The rarest pieces are the thin slivers marked with brass dots. Where the pointer stops is your roll.</Muted>
      </View>
      <Eyebrow>What&apos;s inside, highest value first</Eyebrow>
      <View>
        {[...box.bands].sort((a, b) => b.valueCents - a.valueCents).map((b, i) => (
          <View key={b.label} style={{ paddingVertical: 11, gap: 6 }}>
            {i > 0 && <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><Rule /></View>}
            <Row><Body style={{ fontWeight: '600', flex: 1 }}>{b.label}</Body><Mono>{usd(b.valueCents)}</Mono></Row>
            <Row>
              <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: C.deep, overflow: 'hidden' }}>
                <View style={{ width: `${Math.max(2, (b.oddsPpm / maxOdds) * 100)}%`, height: 6, backgroundColor: C.brass }} />
              </View>
              <Mono style={{ fontSize: 12.5, color: C.muted, minWidth: 130, textAlign: 'right' }}>{pct(b.oddsPpm)} · {oneIn(b.oddsPpm)}</Mono>
            </Row>
          </View>
        ))}
      </View>
      <Italic>Nothing hidden. That&apos;s the Honest Abe rule.</Italic>
      <Muted style={{ fontSize: 13 }}>Values are the average of recent verified sales. Every prize on this table is authenticated and in our insured vault before the box can be opened.</Muted>

      <Notice text={msg} />
      {!box.openable ? <Notice text={box.closedReason} /> : !account?.boxesAllowedInState ? (
        <Notice text="Boxes aren't open in your state yet. Drops are." />
      ) : confirming ? (
        <Card>
          <Body>Open {box.name} for <Body style={{ fontFamily: F.monoMed }}>{usd(box.priceCents)}</Body> from your credit?</Body>
          <Button title={`Yes, open for ${usd(box.priceCents)}`} onPress={open} busy={busy} />
          <Button title="Cancel" kind="plain" onPress={() => setConfirming(false)} />
        </Card>
      ) : (
        <>
          <Button title={`Open for ${usd(box.priceCents)}`} onPress={() => setConfirming(true)} disabled={short} />
          {short && <Muted style={{ fontSize: 13, textAlign: 'center' }}>You have {usd(account?.balanceCents ?? 0)} in credit. Add credit in Account.</Muted>}
        </>
      )}
      {box.fair && (
        <Muted style={{ fontSize: 11.5, color: C.quiet }}>
          Provably fair: your next pull uses server seed hash {box.fair.serverSeedHash.slice(0, 16)}…, client seed {box.fair.clientSeed}, nonce {box.fair.nextNonce}.
        </Muted>
      )}
      <Muted style={{ fontSize: 12, textAlign: 'center', color: C.quiet }}>No purchase necessary. Free entry rules on honestbox.com.</Muted>
    </Screen>
  );
}
