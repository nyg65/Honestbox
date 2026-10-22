import { View } from 'react-native';
import { Body, Card, Cert, H2, Loading, Mono, Muted, Notice, Row, Rule, Screen } from '../components/ui';
import { api, type LedgerBox } from '../lib/api';
import { pct, usd } from '../lib/format';
import { C } from '../lib/theme';
import { useLoad } from '../lib/useLoad';

type Ledger = { boxes: LedgerBox[]; buybacks: { method: string; count: number; totalCents: number }[] };

export default function LedgerScreen() {
  const { data, error, refreshing, reload } = useLoad(() => api<Ledger>('ledger'));
  return (
    <Screen refreshing={refreshing} onRefresh={() => reload(true)}>
      <Muted>Every pull, counted in the band it landed in, next to the odds we published. Small samples swing; over thousands of pulls the actual share should sit close to the published odds.</Muted>
      <Notice text={error} />
      {!data ? <Loading /> : (
        <>
          {data.boxes.map((b) => (
            <Card key={b.slug} style={{ gap: 6 }}>
              <Row><H2 style={{ fontSize: 19 }}>{b.name}</H2><Muted style={{ fontSize: 12.5 }}>{b.pulls.toLocaleString('en-US')} pull{b.pulls === 1 ? '' : 's'} · edge {(b.houseEdge * 100).toFixed(1)}%</Muted></Row>
              <Row><Muted style={{ fontSize: 11, flex: 1 }}>BAND</Muted><Muted style={{ fontSize: 11, width: 70, textAlign: 'right' }}>PUBLISHED</Muted><Muted style={{ fontSize: 11, width: 70, textAlign: 'right' }}>ACTUAL</Muted></Row>
              {b.bands.map((x) => (
                <View key={x.label} style={{ gap: 6 }}>
                  <Rule />
                  <Row>
                    <View style={{ flex: 1 }}><Body style={{ fontSize: 13.5 }}>{x.label}</Body><Mono style={{ fontSize: 12, color: C.muted }}>{usd(x.valueCents)}</Mono></View>
                    <Mono style={{ width: 70, textAlign: 'right', fontSize: 13 }}>{pct(x.oddsPpm)}</Mono>
                    <Mono style={{ width: 70, textAlign: 'right', fontSize: 13 }}>{b.pulls ? pct(Math.round((x.actual / b.pulls) * 1_000_000)) : '—'}</Mono>
                  </Row>
                </View>
              ))}
            </Card>
          ))}
          <Cert>
            <H2 style={{ fontSize: 19 }}>Buybacks paid</H2>
            {data.buybacks.length === 0 ? <Muted>None yet.</Muted> : data.buybacks.map((b) => (
              <Row key={b.method}><Body>{b.method === 'credit' ? 'As HonestBox credit' : 'As cash'} · {b.count}</Body><Mono>{usd(b.totalCents)}</Mono></Row>
            ))}
          </Cert>
        </>
      )}
    </Screen>
  );
}
