import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F } from '../lib/theme';

type TP = { children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };
export const H1 = ({ children, style }: TP) => <Text style={[s.h1, style]} accessibilityRole="header">{children}</Text>;
export const H2 = ({ children, style }: TP) => <Text style={[s.h2, style]} accessibilityRole="header">{children}</Text>;
export const Body = ({ children, style, numberOfLines }: TP) => <Text style={[s.body, style]} numberOfLines={numberOfLines}>{children}</Text>;
export const Muted = ({ children, style, numberOfLines }: TP) => <Text style={[s.body, s.muted, style]} numberOfLines={numberOfLines}>{children}</Text>;
export const Mono = ({ children, style }: TP) => <Text style={[s.mono, style]}>{children}</Text>;
export const Italic = ({ children, style }: TP) => <Text style={[s.italic, style]}>{children}</Text>;
export const Eyebrow = ({ children, style }: TP) => <Text style={[s.eyebrow, style]}>{children}</Text>;

export function Screen({ children, refreshing, onRefresh, scroll = true, edges }: { children: React.ReactNode; refreshing?: boolean; onRefresh?: () => void; scroll?: boolean; edges?: ('top' | 'bottom')[] }) {
  const inner = <View style={s.inner}>{children}</View>;
  return (
    <SafeAreaView style={s.screen} edges={edges ?? []}>
      {scroll ? (
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.brass} /> : undefined}>
          {inner}
        </ScrollView>
      ) : inner}
    </SafeAreaView>
  );
}

export const Card = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[s.card, style]}>{children}</View>;

/** The engraved double-ruled frame used for featured items, like an old certificate. */
export const Cert = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={s.certOuter}><View style={[s.certInner, style]}>{children}</View></View>
);

export function Button({ title, onPress, kind = 'gold', disabled, busy, right, style }: {
  title: string; onPress: () => void; kind?: 'gold' | 'outline' | 'plain'; disabled?: boolean; busy?: boolean; right?: string; style?: StyleProp<ViewStyle>;
}) {
  const gold = kind === 'gold';
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!(disabled || busy) }} onPress={onPress} disabled={disabled || busy}
      style={({ pressed }) => [s.btn, gold ? s.btnGold : kind === 'outline' ? s.btnOutline : s.btnPlain, (disabled || busy) && { opacity: 0.45 }, pressed && { opacity: 0.8 }, right ? { justifyContent: 'space-between' } : null, style]}>
      {busy ? <ActivityIndicator color={gold ? C.green : C.brass} /> : (
        <>
          <Text style={[s.btnText, { color: gold ? C.green : kind === 'plain' ? C.muted : C.ivory }]}>{title}</Text>
          {right ? <Text style={[s.btnRight, { color: gold ? C.green : C.muted }]}>{right}</Text> : null}
        </>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[s.body, s.muted, { fontSize: 13 }]}>{label}</Text>
      <TextInput placeholderTextColor={C.quiet} style={s.input} accessibilityLabel={label} {...props} />
    </View>
  );
}

export function Notice({ text, kind = 'error' }: { text: string | null | undefined; kind?: 'error' | 'ok' }) {
  if (!text) return null;
  return (
    <View accessibilityLiveRegion="polite" style={[s.notice, kind === 'error' ? s.noticeErr : s.noticeOk]}>
      <Text style={[s.body, { color: kind === 'error' ? '#F6C9C1' : '#CDEBD8', fontSize: 14 }]}>{text}</Text>
    </View>
  );
}

export const Row = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[s.row, style]}>{children}</View>;
export const Rule = () => <View style={s.rule} />;
export const Pill = ({ text, gold }: { text: string; gold?: boolean }) => (
  <View style={[s.pill, gold && { backgroundColor: C.brass, borderColor: C.brass }]}><Text style={[s.pillText, gold && { color: C.green, fontFamily: F.sans, fontWeight: '600' }]}>{text}</Text></View>
);
export const Loading = () => <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={C.brass} /></View>;

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.green },
  scroll: { flexGrow: 1 },
  inner: { padding: 18, gap: 16, paddingBottom: 40 },
  h1: { fontFamily: F.serif, fontSize: 30, lineHeight: 34, color: C.ivory },
  h2: { fontFamily: F.serif, fontSize: 21, lineHeight: 26, color: C.ivory },
  body: { fontFamily: F.sans, fontSize: 15, lineHeight: 22, color: C.ivory },
  muted: { color: C.muted },
  mono: { fontFamily: F.mono, fontSize: 15, color: C.ivory, fontVariant: ['tabular-nums'] },
  italic: { fontFamily: F.italic, fontSize: 16, lineHeight: 22, color: C.brass },
  eyebrow: { fontFamily: F.sans, fontWeight: '600', fontSize: 11.5, letterSpacing: 1.8, textTransform: 'uppercase', color: C.brass },
  card: { backgroundColor: C.panel, borderColor: C.rule, borderWidth: 1, borderRadius: 12, padding: 16, gap: 10 },
  certOuter: { borderColor: C.brass, borderWidth: 1, borderRadius: 6, padding: 3 },
  certInner: { backgroundColor: C.panel, borderColor: C.brass, borderWidth: 1, borderRadius: 4, padding: 16, gap: 10 },
  btn: { minHeight: 50, borderRadius: 12, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnGold: { backgroundColor: C.brass },
  btnOutline: { borderWidth: 1, borderColor: C.brass },
  btnPlain: { minHeight: 44 },
  btnText: { fontFamily: F.sans, fontWeight: '600', fontSize: 16 },
  btnRight: { fontFamily: F.monoMed, fontSize: 15 },
  input: { fontFamily: F.sans, fontSize: 16, color: C.ivory, backgroundColor: C.deep, borderColor: C.rule, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, minHeight: 48 },
  notice: { borderRadius: 10, borderWidth: 1, padding: 12 },
  noticeErr: { backgroundColor: 'rgba(229,138,124,0.12)', borderColor: C.bad },
  noticeOk: { backgroundColor: 'rgba(127,199,154,0.12)', borderColor: C.good },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rule: { height: 1, backgroundColor: C.rule },
  pill: { alignSelf: 'flex-start', borderColor: C.rule, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: F.sans, fontSize: 12, color: C.ivory },
});
