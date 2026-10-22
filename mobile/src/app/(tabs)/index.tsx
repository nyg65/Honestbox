import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Mark } from '../../components/art';
import { Body, Card, Cert, Eyebrow, H1, Italic, Loading, Mono, Muted, Notice, Pill, Row, Screen } from '../../components/ui';
import { api, type BoxSummary } from '../../lib/api';
import { oneIn, usd } from '../../lib/format';
import { useSession } from '../../lib/session';
import { C, F } from '../../lib/theme';
import { useLoad } from '../../lib/useLoad';

export default function Boxes() {
  const { account } = useSession();
  const { data, error, refreshing, reload } = useLoad(() => api<{ boxes: BoxSummary[] }>('boxes'));
  return (
    <Screen refreshing={refreshing} onRefresh={() => reload(true)}>
      {account?.testMode && <Pill text="Test mode: no real money" gold />}
      <Row style={{ alignItems: 'center', justifyContent: 'flex-start', gap: 14 }}>
        <Mark size={64} detail />
        <View style={{ flex: 1, gap: 4 }}>
          <H1 style={{ fontSize: 26, lineHeight: 30 }}>Honest odds.{'\n'}Honest prices.</H1>
        </View>
      </Row>
      <Italic>Every value from real sales. Every house edge printed. Abe would approve.</Italic>
      {!account?.boxesAllowedInState && <Notice text="Boxes aren't open in your state yet. Drops are." />}
      <Notice text={error} />
      {!data ? <Loading /> : data.boxes.map((b) => {
        const featured = b.slug === 'statesman';
        const Wrap = featured ? Cert : Card;
        return (
          <Pressable key={b.slug} accessibilityRole="button" accessibilityLabel={`${b.name}, ${usd(b.priceCents)}`} onPress={() => router.push(`/box/${b.slug}`)}>
            <Wrap style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: C.brass, alignItems: 'center', justifyContent: 'center' }}>
                <Body style={{ fontFamily: F.serif, color: C.brass, fontSize: 17 }}>{b.numeral}</Body>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Row><Body style={{ fontFamily: F.serif, fontSize: 18 }}>{b.name}</Body><Mono style={{ fontSize: 17 }}>{usd(b.priceCents)}</Mono></Row>
                <Muted style={{ fontSize: 13 }} numberOfLines={1}>{b.tagline}</Muted>
                {b.top && (
                  <Row>
                    <Mono style={{ fontSize: 12.5, color: C.brass }}>Top {usd(b.top.valueCents)} · {oneIn(b.top.oddsPpm)}</Mono>
                    <Mono style={{ fontSize: 12, color: C.muted }}>edge {Math.round(b.houseEdge * 100)}%</Mono>
                  </Row>
                )}
                {!b.openable && <Muted style={{ fontSize: 12, color: C.bad }}>{b.closedReason}</Muted>}
              </View>
            </Wrap>
          </Pressable>
        );
      })}
      <Pressable accessibilityRole="button" onPress={() => router.push('/ledger')}>
        <Card><Eyebrow>The Honest Ledger</Eyebrow><Muted style={{ fontSize: 14 }}>Every pull counted against the published odds, live.</Muted></Card>
      </Pressable>
    </Screen>
  );
}
