import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { WatchArt } from '../../components/art';
import { Body, Card, Cert, Eyebrow, H1, Loading, Mono, Muted, Notice, Pill, Row, Screen } from '../../components/ui';
import { api, type Drop } from '../../lib/api';
import { timeLeft, usd } from '../../lib/format';
import { C, F } from '../../lib/theme';
import { useLoad } from '../../lib/useLoad';

const STATUS = { available: 'Available', held: 'Someone is checking out', held_by_you: 'Held for you', sold: 'Sold' } as const;

export default function Drops() {
  const { data, error, refreshing, reload } = useLoad(() => api<{ drop: Drop | null }>('drop'));
  const drop = data?.drop;
  return (
    <Screen refreshing={refreshing} onRefresh={() => reload(true)}>
      <Notice text={error} />
      {!data ? <Loading /> : !drop ? (
        <Card><H1 style={{ fontSize: 24 }}>The next drop is on its way.</H1><Muted>Drops open weekly. Check back soon.</Muted></Card>
      ) : (
        <>
          <Row>
            <View style={{ gap: 4 }}><Eyebrow>{drop.title}</Eyebrow><H1 style={{ fontSize: 26 }}>This week&apos;s drop</H1></View>
            <Pill text={timeLeft(drop.endsAt)} />
          </Row>
          <Muted>No box, no odds. One fixed honest price per piece, at or under the average of its recent sales. Hold a piece for 10 minutes while you check out.</Muted>
          {drop.items.map((it) => (
            <Pressable key={it.id} accessibilityRole="button" onPress={() => router.push(`/drop/${it.id}`)} style={{ opacity: it.status === 'sold' ? 0.55 : 1 }}>
              <Cert>
                <View style={{ alignItems: 'center' }}><WatchArt brand={it.brand} size={120} /></View>
                <Body style={{ fontFamily: F.serif, fontSize: 20 }}>{it.brand} {it.model}</Body>
                <Muted style={{ fontSize: 13 }}>{[it.reference && `Ref. ${it.reference}`, it.year, it.papers].filter(Boolean).join(' · ')}</Muted>
                <Row><Muted style={{ fontSize: 13 }}>Honest price</Muted><Mono style={{ fontSize: 20, color: C.brass }}>{usd(it.priceCents)}</Mono></Row>
                <Row><Muted style={{ fontSize: 13 }}>Recent sales average</Muted><Mono>{usd(it.marketCents)}</Mono></Row>
                <Pill text={STATUS[it.status]} gold={it.status === 'held_by_you'} />
              </Cert>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}
