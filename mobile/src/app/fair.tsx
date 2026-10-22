import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Card, Cert, Field, H2, Loading, Mono, Muted, Notice, Screen } from '../components/ui';
import { api, ApiError } from '../lib/api';
import { C } from '../lib/theme';
import { useLoad } from '../lib/useLoad';

type Fair = { active: { serverSeedHash: string; clientSeed: string; nextNonce: number }; revealed: { serverSeed: string; serverSeedHash: string; clientSeed: string; pulls: number; revealedAt: string }[] };

const STEPS = [
  'Before you open anything, we show you the SHA-256 hash of a secret server seed. That locks in our side of every roll.',
  'You choose the client seed, so we can’t pick a seed pair that favors us.',
  'Each pull computes HMAC-SHA256(server seed, "client seed:nonce"). The first 13 hex digits, scaled to 0–999,999, are the roll. The nonce counts up by one per pull.',
  'The roll lands in one band of the published odds, read top to bottom.',
  'When you rotate your seed, we reveal the old server seed. Check that it hashes to what we showed you, then re-check every pull at honestbox.com/fair.',
];

export default function FairScreen() {
  const { data, error, reload } = useLoad(() => api<Fair>('fair'));
  const [client, setClient] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null);

  async function rotate() {
    setBusy(true); setMsg(null);
    try { await api('fair/rotate', { method: 'POST', body: { clientSeed: client } }); setClient(''); await reload(); setMsg({ text: 'Your old server seed is revealed below, and a new seed pair is active.', kind: 'ok' }); }
    catch (e) { setMsg({ text: e instanceof ApiError ? e.message : 'Could not rotate your seed.', kind: 'error' }); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <View style={{ gap: 8 }}>{STEPS.map((t, i) => <Body key={i} style={{ fontSize: 14 }}>{i + 1}. {t}</Body>)}</View>
      <Notice text={error ?? msg?.text} kind={error ? 'error' : msg?.kind} />
      {!data ? <Loading /> : (
        <>
          <Cert>
            <H2 style={{ fontSize: 19 }}>Your active seed pair</H2>
            <Mono style={{ fontSize: 12, color: C.muted }}>Server seed hash: {data.active.serverSeedHash}</Mono>
            <Mono style={{ fontSize: 12, color: C.muted }}>Client seed: {data.active.clientSeed} · Next nonce: {data.active.nextNonce}</Mono>
            <Field label="New client seed (optional)" value={client} onChangeText={setClient} autoCapitalize="none" placeholder="leave blank for a random one" />
            <Button title="Reveal this seed and start a new pair" kind="outline" onPress={rotate} busy={busy} />
          </Cert>
          {data.revealed.map((o) => (
            <Card key={o.serverSeedHash} style={{ gap: 4 }}>
              <Mono style={{ fontSize: 11.5 }}>Server seed: {o.serverSeed}</Mono>
              <Mono style={{ fontSize: 11.5, color: C.muted }}>Hash shown before use: {o.serverSeedHash}</Mono>
              <Mono style={{ fontSize: 11.5, color: C.muted }}>Client seed: {o.clientSeed} · Nonces 0 to {Math.max(0, o.pulls - 1)}</Mono>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
