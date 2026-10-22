import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { WatchArt } from '../../components/art';
import { HatReveal } from '../../components/HatReveal';
import { Body, Button, Card, Cert, Eyebrow, H1, Loading, Mono, Muted, Notice, Pill, Screen } from '../../components/ui';
import { api, ApiError, type Pull } from '../../lib/api';
import { daysLeft, oneIn, usd } from '../../lib/format';
import { C, F } from '../../lib/theme';
import { useLoad } from '../../lib/useLoad';

export default function PullScreen() {
  const { id, ok } = useLocalSearchParams<{ id: string; ok?: string }>();
  const { data: p, setData, error, refreshing, reload } = useLoad(() => api<Pull>(`pulls/${id}`));
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'error' } | null>(ok ? { text: ok, kind: 'ok' } : null);
  const [busy, setBusy] = useState(false);
  const [showFair, setShowFair] = useState(false);

  if (!p) return <Screen><Notice text={error} />{!error && <Loading />}</Screen>;

  async function reveal() { setData(await api<Pull>(`pulls/${id}/reveal`, { method: 'POST', body: {} })); }

  async function lock() {
    setBusy(true);
    try { const r = await api<{ lockedCents: number; pull: Pull }>(`pulls/${id}/lock`, { method: 'POST', body: {} }); setData(r.pull);
      setMsg({ text: `Locked at ${usd(r.lockedCents)}. Sell it back any time for the locked value minus 10%, even if the market falls.`, kind: 'ok' }); }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : 'Could not lock the value.', kind: 'error' }); }
    finally { setBusy(false); }
  }

  const w = p.watch;
  const move = w && p.valueAtPullCents ? w.marketCents - p.valueAtPullCents : 0;
  const left = daysLeft(p.holdUntil);

  return (
    <Screen refreshing={refreshing} onRefresh={() => reload(true)}>
      <Eyebrow>{p.box.name} · {usd(p.box.priceCents)} · pull #{p.id}</Eyebrow>
      <Notice text={msg?.text} kind={msg?.kind} />
      <HatReveal revealed={p.revealed} onReveal={reveal}>
        {w && (
          <View style={{ gap: 16 }}>
            <Cert style={{ alignItems: 'center', paddingVertical: 22 }}>
              <Pill text={p.band.oddsPpm >= 500_000 ? 'Most common pull' : `${oneIn(p.band.oddsPpm)} pull`} gold />
              <WatchArt brand={w.brand} size={150} />
              <H1 style={{ textAlign: 'center', fontSize: 26 }}>{w.brand} {w.model}</H1>
              <Muted style={{ textAlign: 'center', fontSize: 13 }}>{[w.reference && `Ref. ${w.reference}`, w.sizeMm && `${w.sizeMm} mm`, w.year, w.condition, w.papers].filter(Boolean).join(' · ')}</Muted>
              <Mono style={{ fontSize: 30, color: C.brass }}>{usd(w.marketCents)}</Mono>
              <Muted style={{ fontSize: 12.5, textAlign: 'center' }}>
                {w.salesCount ? `Today's value: average of ${w.salesCount} recent sales, ${usd(w.salesLowCents!)} to ${usd(w.salesHighCents!)}` : "Today's market value"}
              </Muted>
              {move !== 0 && (
                <Mono style={{ fontSize: 13, color: move > 0 ? C.good : C.bad, textAlign: 'center' }}>
                  {move > 0 ? '▲' : '▼'} {usd(Math.abs(move))} ({((move / p.valueAtPullCents!) * 100).toFixed(1)}%) since you pulled it at {usd(p.valueAtPullCents!)}
                </Mono>
              )}
            </Cert>

            {p.status === 'vault' && p.buyback && (
              <View style={{ gap: 10 }}>
                <Button title="Sell it back now" right={usd(p.buyback.creditCents)} onPress={() => router.push(`/sell/${p.id}`)} />
                <Button title="Ship it to me" kind="outline" right={p.shipFeeCents ? `${usd(p.shipFeeCents)} · insured` : 'Free · insured'} onPress={() => router.push(`/ship/${p.id}`)} />
                <Card>
                  <Body style={{ fontFamily: F.serif, fontSize: 18 }}>Keep it in your vault</Body>
                  {p.lockedCents == null ? (
                    <>
                      <Muted style={{ fontSize: 14 }}>
                        Its buyback follows the market. Whenever you sell, you get the market value that day minus 10%. If the watch goes up, so does your payout. You have {left} days; after that we buy it back for credit at that day&apos;s value.
                      </Muted>
                      <Button title="Lock in today's value" right={usd(w.marketCents)} kind="outline" busy={busy} onPress={lock} />
                      <Muted style={{ fontSize: 12, color: C.quiet }}>Locking is permanent: you&apos;re protected if the price falls, but you won&apos;t gain if it rises.</Muted>
                      <Button title="Keep it floating" kind="plain" onPress={() => router.push('/(tabs)/vault')} />
                    </>
                  ) : (
                    <Muted style={{ fontSize: 14 }}>
                      Value locked at {usd(p.lockedCents)} on {new Date(p.lockedAt!).toLocaleDateString('en-US', { dateStyle: 'medium' })}. Sell it back any time in the next {left} days for {usd(p.buyback.creditCents)} in credit, whatever the market does.
                    </Muted>
                  )}
                </Card>
              </View>
            )}
            {p.status === 'sold_back' && <Card><Body>You sold this pull back. Your credit is in Account.</Body></Card>}
            {p.status === 'ship_requested' && <Card><Body>Shipping requested. We&apos;ll email tracking when it leaves the vault.</Body></Card>}
            {p.status === 'shipped' && <Card><Body>Shipped. Check your email for tracking.</Body></Card>}

            <Pressable accessibilityRole="button" onPress={() => setShowFair((v) => !v)}>
              <Card style={{ gap: 6 }}>
                <Body style={{ fontSize: 14 }}>{showFair ? '▾' : '▸'} Verify this pull</Body>
                {showFair && (
                  <>
                    <Mono style={{ fontSize: 11.5, color: C.muted }}>Server seed hash: {p.fair.serverSeedHash}</Mono>
                    <Mono style={{ fontSize: 11.5, color: C.muted }}>Client seed: {p.fair.clientSeed} · Nonce: {p.fair.nonce}</Mono>
                    <Mono style={{ fontSize: 11.5, color: C.muted }}>Roll: {p.fair.rollPpm.toLocaleString('en-US')} of 1,000,000 · Band: {p.band.label}</Mono>
                    <Muted style={{ fontSize: 12 }}>{p.fair.serverSeed ? `Server seed (revealed): ${p.fair.serverSeed}` : 'The server seed is revealed when you rotate your seed in Provably fair.'}</Muted>
                  </>
                )}
              </Card>
            </Pressable>
          </View>
        )}
      </HatReveal>
    </Screen>
  );
}
