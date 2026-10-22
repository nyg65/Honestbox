// The reveal: tap the stovepipe hat, it tips off, and the watch rises into view.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Hat } from './art';
import { Body, Italic, Muted } from './ui';
import { C, F } from '../lib/theme';

export function HatReveal({ revealed, onReveal, children }: { revealed: boolean; onReveal: () => Promise<void>; children: React.ReactNode }) {
  const [open, setOpen] = useState(revealed);
  const [busy, setBusy] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;
  const tip = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  const reduce = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduce.current = v; });
    const loop = Animated.loop(Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    if (!open) loop.start();
    return () => loop.stop();
  }, [glow, open]);

  async function lift() {
    if (busy) return;
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const work = onReveal().catch(() => undefined);
    if (!reduce.current) await new Promise<void>((r) => Animated.timing(tip, { toValue: 1, duration: 750, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => r()));
    await work;
    setOpen(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(rise, { toValue: 1, duration: reduce.current ? 0 : 650, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start();
  }

  if (open) {
    return (
      <Animated.View style={{ opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }, { scale: rise.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }}>
        {children}
      </Animated.View>
    );
  }

  const ring = { transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }], opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }) };
  const hatMove = {
    transform: [
      { translateX: tip.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) },
      { translateY: tip.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, -10, -110] }) },
      { rotate: tip.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: ['0deg', '-8deg', '6deg', '-32deg'] }) },
    ],
    opacity: tip.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
  };

  return (
    <View style={{ alignItems: 'center', gap: 26, paddingVertical: 30 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Lift the hat to reveal your watch" onPress={lift} disabled={busy}>
        <View style={{ width: 230, height: 230, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ position: 'absolute', width: 230, height: 230, borderRadius: 30, borderWidth: 2, borderColor: C.brass }, ring]} />
          <View style={{ width: 230, height: 230, borderRadius: 30, borderWidth: 2, borderColor: C.brass, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={hatMove}><Hat size={150} /></Animated.View>
          </View>
        </View>
      </Pressable>
      <View style={{ alignItems: 'center', gap: 8, maxWidth: 300 }}>
        <Body style={{ fontFamily: F.serif, fontSize: 28 }}>Tap to reveal</Body>
        <Italic style={{ textAlign: 'center' }}>Lincoln kept his most important papers in his hat. We keep your pull in ours.</Italic>
        <Muted style={{ fontSize: 12 }}>Your result was logged before you opened it.</Muted>
      </View>
    </View>
  );
}
