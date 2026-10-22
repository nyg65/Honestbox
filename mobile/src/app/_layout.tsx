import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '../lib/session';
import { C, F } from '../lib/theme';

void SplashScreen.preventAutoHideAsync();

function Root() {
  const { ready } = useSession();
  const [fonts] = useFonts({
    'OldStandard-Bold': require('../../assets/fonts/OldStandard-Bold.ttf'),
    'OldStandard-Italic': require('../../assets/fonts/OldStandard-Italic.ttf'),
    IBMPlexSans: require('../../assets/fonts/IBMPlexSans.ttf'),
    'IBMPlexMono-Regular': require('../../assets/fonts/IBMPlexMono-Regular.ttf'),
    'IBMPlexMono-Medium': require('../../assets/fonts/IBMPlexMono-Medium.ttf'),
  });
  const loaded = ready && fonts;
  useEffect(() => { if (loaded) void SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.green },
        headerTintColor: C.brass,
        headerTitleStyle: { fontFamily: F.serif, color: C.ivory, fontSize: 18 },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: C.green },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="signin" options={{ title: 'Sign in' }} />
      <Stack.Screen name="signup" options={{ title: 'Join HonestBox' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="box/[slug]" options={{ title: '' }} />
      <Stack.Screen name="pull/[id]" options={{ title: 'Your pull' }} />
      <Stack.Screen name="sell/[id]" options={{ title: 'Buyback offer', presentation: 'modal' }} />
      <Stack.Screen name="ship/[id]" options={{ title: 'Ship it to me', presentation: 'modal' }} />
      <Stack.Screen name="drop/[id]" options={{ title: '' }} />
      <Stack.Screen name="ledger" options={{ title: 'The Honest Ledger' }} />
      <Stack.Screen name="fair" options={{ title: 'Provably fair' }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <Root />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
