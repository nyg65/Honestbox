import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mark } from '../components/art';
import { Body, Button, H1, Italic, Muted, Eyebrow } from '../components/ui';
import { C, F } from '../lib/theme';
import { Text } from 'react-native';

export default function Welcome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.green }} edges={['top', 'bottom']}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', gap: 22, paddingTop: 30 }}>
          <Mark size={200} detail />
          <Text style={{ fontFamily: F.serif, fontSize: 30, letterSpacing: 6, color: C.ivory }}>HONEST<Text style={{ color: C.brass }}>BOX</Text></Text>
          <Eyebrow>Luxury watches · published odds</Eyebrow>
        </View>
        <View style={{ gap: 14 }}>
          <H1 style={{ textAlign: 'center' }}>The honest way to collect luxury watches.</H1>
          <Muted style={{ textAlign: 'center' }}>Every value from real sales. Every house edge printed. Every pull can be sold back at a fair price.</Muted>
          <Italic style={{ textAlign: 'center' }}>Named for the man they called Honest Abe.</Italic>
        </View>
        <View style={{ gap: 12 }}>
          <Button title="Join HonestBox" onPress={() => router.push('/signup')} />
          <Button title="Sign in" kind="outline" onPress={() => router.push('/signin')} />
          <Body style={{ textAlign: 'center', fontSize: 12, color: C.quiet }}>18+ · US only · No purchase necessary to enter</Body>
        </View>
      </View>
    </SafeAreaView>
  );
}
