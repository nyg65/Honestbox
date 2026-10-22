import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Mark, WatchArt } from '../../components/art';
import { Body, Button, Card, Cert, H1, Loading, Mono, Muted, Notice, Pill, Row, Screen } from '../../components/ui';
import { api, type Pull } from '../../lib/api';
import { daysLeft, usd } from '../../lib/format';
import { C, F } from '../../lib/theme';
import { useLoad } from '../../lib/useLoad';

const LABEL: Record<Pull['status'], string> = { vault: 'In your vault', sold_back: 'Sold back', ship_requested: 'Shipping requested', shipped: 'Shipped' };

export default function Vault() {
  const { data, error, refreshing, reload } = useLoad(() => api<{ pulls: Pull[] }>('pulls'));
  const held = data?.pulls.filter((p) => p.status === 'vault') ?? [];
  const worth = held.reduce((a, p) => a + (p.lockedCents ?? p.watch?.marketCents ?? 0), 0);
  return (
    <Screen refreshing={refreshing} onRefresh={() => reload(true)}>
      <Notice text={error} />
      {!data ? <Loading /> : data.pulls.length === 0 ? (
        <Card style={{ alignItems: 'flex-start' }}>
          <H1 style={{ fontSize: 24 }}>Nothing here yet.</H1>
          <Muted>Watches you pull show up in your vault.</Muted>
          <Button title="Open your first box" onPress={() => router.push('/(tabs)')} style={{ alignSelf: 'stretch' }} />
        </Card>
      ) : (
        <>
          {held.length > 0 && <Row><Muted>{held.length} watch{held.length === 1 ? '' : 'es'} in your vault</Muted><Mono style={{ color: C.brass }}>{usd(worth)}</Mono></Row>}
          {data.pulls.map((p) => {
            const Wrap = p.status === 'vault' ? Cert : Card;
            const w = p.watch;
            const move = w && p.valueAtPullCents ? w.marketCents - p.valueAtPullCents : 0;
            return (
              <Pressable key={p.id} accessibilityRole="button" onPress={() => router.push(`/pull/${p.id}`)}>
                <Wrap style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                  {w ? <WatchArt brand={w.brand} size={72} /> : <Mark size={72} />}
                  <View style={{ flex: 1, gap: 3 }}>
                    <Body style={{ fontFamily: F.serif, fontSize: 17 }}>{w ? `${w.brand} ${w.model}` : 'Sealed: tap to reveal'}</Body>
                    {w && <Mono style={{ color: C.brass }}>{usd(p.lockedCents ?? w.marketCents)}</Mono>}
                    {w && p.status === 'vault' && (p.lockedCents != null ? <Pill text="Locked" gold /> : move !== 0 ? (
                      <Mono style={{ fontSize: 12.5, color: move > 0 ? C.good : C.bad }}>{move > 0 ? '▲' : '▼'} {((move / p.valueAtPullCents!) * 100).toFixed(1)}% since pulled</Mono>
                    ) : <Muted style={{ fontSize: 12.5 }}>Floating with the market</Muted>)}
                    <Muted style={{ fontSize: 12 }}>{p.box.name} · {LABEL[p.status]}{p.status === 'vault' ? ` · ${daysLeft(p.holdUntil)} days left` : ''}</Muted>
                  </View>
                </Wrap>
              </Pressable>
            );
          })}
        </>
      )}
    </Screen>
  );
}
