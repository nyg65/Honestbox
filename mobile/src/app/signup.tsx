import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Field, Muted, Notice, Screen } from '../components/ui';
import { ApiError } from '../lib/api';
import { useSession } from '../lib/session';
import { C, F } from '../lib/theme';

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

export default function SignUp() {
  const { signUp } = useSession();
  const params = useLocalSearchParams<{ ref?: string }>();
  const [f, setF] = useState({ name: '', email: '', password: '', state: '', ref: (params.ref || '').toUpperCase(), adult: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const stateOk = STATES.includes(f.state);

  async function go() {
    setBusy(true); setError(null);
    try { await signUp(f); router.replace('/(tabs)'); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not create your account.'); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Muted>Open boxes with published odds, buy weekly drops, and sell back any pull at a fair price.</Muted>
      <Notice text={error} />
      <Field label="Full name" value={f.name} onChangeText={set('name')} autoComplete="name" textContentType="name" />
      <Field label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
      <Field label="Password (8 characters or more)" value={f.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <Field label="State you live in (2 letters)" value={f.state} onChangeText={(v) => set('state')(v.toUpperCase().slice(0, 2))} autoCapitalize="characters" maxLength={2} />
      {f.state.length === 2 && !stateOk && <Muted style={{ color: C.bad, fontSize: 13 }}>Use a US state abbreviation, like TX.</Muted>}
      <Field label="Referral code (optional)" value={f.ref} onChangeText={(v) => set('ref')(v.toUpperCase())} autoCapitalize="characters" maxLength={12} />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: f.adult }} onPress={() => setF((x) => ({ ...x, adult: !x.adult }))}
        style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', minHeight: 44, paddingVertical: 4 }}>
        <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: C.brass, backgroundColor: f.adult ? C.brass : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {f.adult && <Text style={{ color: C.green, fontWeight: '700' }}>✓</Text>}
        </View>
        <Text style={{ flex: 1, fontFamily: F.sans, color: C.ivory, fontSize: 14, lineHeight: 20 }}>I am 18 or older and agree to the terms and official rules.</Text>
      </Pressable>
      <Button title="Create account" onPress={go} busy={busy} disabled={!f.name || !f.email || f.password.length < 8 || !stateOk || !f.adult} />
      <Button title="Already a member? Sign in" kind="plain" onPress={() => router.replace('/signin')} />
    </Screen>
  );
}
