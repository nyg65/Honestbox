import { useState } from 'react';
import { Share, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Body, Button, Card, Cert, H1, H2, Mono, Muted, Notice, Row, Rule, Screen } from '../../components/ui';
import { api, API_URL } from '../../lib/api';
import { usd } from '../../lib/format';
import { useSession } from '../../lib/session';
import { C } from '../../lib/theme';
import { useLoad } from '../../lib/useLoad';

type Entry = { id: number; kind: string; amountCents: number; memo: string; createdAt: string };

export default function AccountTab() {
  const { account, refresh, signOut } = useSession();
  const history = useLoad(async () => { await refresh(); return api<{ entries: Entry[] }>('me/ledger'); });
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  if (!account) return null;
  const r = account.referral;
  const link = `${API_URL}/signup?ref=${r.code}`;

  async function addCredit(cents: number) {
    setBusy(cents);
    try { await api('me/test-credit', { method: 'POST', body: { cents } }); await history.reload(); setMsg({ text: `Added ${usd(cents)} of test credit.`, kind: 'ok' }); }
    catch (e) { setMsg({ text: (e as Error).message, kind: 'error' }); }
    finally { setBusy(null); }
  }

  return (
    <Screen refreshing={history.refreshing} onRefresh={() => history.reload(true)}>
      <View style={{ gap: 2 }}>
        <H1 style={{ fontSize: 26 }}>{account.user.name}</H1>
        <Muted style={{ fontSize: 13 }}>{account.user.email} · {account.user.state} · ID {account.user.idVerified ? 'verified' : 'not verified'}</Muted>
      </View>
      <Notice text={msg?.text} kind={msg?.kind} />
      <Cert>
        <Row><Muted>HonestBox credit</Muted><Mono style={{ fontSize: 26 }}>{usd(account.balanceCents, { cents: true })}</Mono></Row>
        {account.testMode ? (
          <>
            <Muted style={{ fontSize: 13 }}>Test mode. Add pretend credit to try the app:</Muted>
            <Row style={{ gap: 8 }}>
              {[50000, 100000, 250000].map((c) => <Button key={c} title={usd(c)} kind="outline" busy={busy === c} onPress={() => addCredit(c)} style={{ flex: 1, minHeight: 44 }} />)}
            </Row>
          </>
        ) : <Muted style={{ fontSize: 13 }}>Adding credit with a card opens once payments are connected.</Muted>}
      </Cert>

      <Card>
        <Row><H2>Refer a collector</H2><Mono style={{ color: C.brass, fontSize: 18 }}>{r.code}</Mono></Row>
        <Muted style={{ fontSize: 14 }}>
          Earn {r.l1Pct}% of every box your referrals open in their first {r.windowDays} days, plus {r.l2Pct}% on the people they refer. Commissions become credit after {r.clearDays} days, up to {usd(r.monthlyCapCents)} a month. Your own boxes never count.
        </Muted>
        <Row style={{ gap: 8 }}>
          <Button title="Share link" onPress={() => Share.share({ message: `Join me on HonestBox, luxury watches with published odds: ${link} (I earn a referral commission)` })} style={{ flex: 1 }} />
          <Button title="Copy" kind="outline" onPress={async () => { await Clipboard.setStringAsync(link); setMsg({ text: 'Referral link copied.', kind: 'ok' }); }} style={{ flex: 1 }} />
        </Row>
        <Row><Muted style={{ fontSize: 13 }}>Referred by you · by them</Muted><Mono>{r.level1} · {r.level2}</Mono></Row>
        <Row><Muted style={{ fontSize: 13 }}>Clearing · paid to credit</Muted><Mono>{usd(r.pending, { cents: true })} · {usd(r.paid, { cents: true })}</Mono></Row>
        <Muted style={{ fontSize: 12, color: C.quiet }}>When you post your link, say you earn a commission (for example, #ad). FTC rules require it.</Muted>
      </Card>

      <Card style={{ gap: 0 }}>
        <H2 style={{ marginBottom: 8 }}>Credit history</H2>
        {(history.data?.entries ?? []).slice(0, 30).map((e, i) => (
          <View key={e.id}>
            {i > 0 && <Rule />}
            <Row style={{ paddingVertical: 10, alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}><Body style={{ fontSize: 14 }}>{e.memo}</Body><Muted style={{ fontSize: 12 }}>{e.createdAt.slice(0, 10)}</Muted></View>
              <Mono style={{ color: e.amountCents > 0 ? C.good : C.ivory }}>{e.amountCents > 0 ? '+' : ''}{usd(e.amountCents, { cents: true })}</Mono>
            </Row>
          </View>
        ))}
      </Card>

      <Button title="The Honest Ledger" kind="outline" onPress={() => router.push('/ledger')} />
      <Button title="Provably fair settings" kind="outline" onPress={() => router.push('/fair')} />
      <Button title="Sign out" kind="plain" onPress={async () => { await signOut(); router.replace('/welcome'); }} />
    </Screen>
  );
}
