import { useState } from 'react';
import { router } from 'expo-router';
import { Button, Field, Muted, Notice, Screen } from '../components/ui';
import { ApiError } from '../lib/api';
import { useSession } from '../lib/session';

export default function SignIn() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true); setError(null);
    try { await signIn(email, password); router.replace('/(tabs)'); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not sign in.'); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Notice text={error} />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={go} />
      <Button title="Sign in" onPress={go} busy={busy} disabled={!email || !password} />
      <Button title="New here? Create an account" kind="plain" onPress={() => router.replace('/signup')} />
      <Muted style={{ fontSize: 13 }}>Test account: demo@honestbox.test / demo-1234</Muted>
    </Screen>
  );
}
