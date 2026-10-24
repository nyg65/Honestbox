// The reveal: every watch in the box is a slice on a roulette wheel, drawn to its real odds.
// Tap Spin; the server returns the roll, and the wheel stops with the pointer exactly at roll / 1,000,000 of a turn.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Mark } from './art';
import { Body, Button, Mono, Muted, Rule, Row } from './ui';
import { C, F } from '../lib/theme';
import { usd } from '../lib/format';
import { type Pocket, slices, slicePath, pointAt, shortLabel, landedIndex, landingRotation, PPM } from '../lib/wheel';

const oddsText = (ppm: number) => (ppm >= 100_000 ? `${(ppm / 10_000).toFixed(0)}%` : ppm >= 10_000 ? `${(ppm / 10_000).toFixed(1)}%` : `${(ppm / 10_000).toFixed(2)}%`);

export function WheelFace({ pockets, rotation, size, highlight }: { pockets: Pocket[]; rotation: Animated.Value | number; size: number; highlight?: number | null }) {
  const S = slices(pockets); const c = size / 2; const R = c - 6;
  const rot = typeof rotation === 'number' ? `${rotation}deg` : rotation.interpolate({ inputRange: [-360, 0, 36000], outputRange: ['-360deg', '0deg', '36000deg'] });
  const hub = Math.round(size * 0.24);
  return (
    <View style={{ width: size, height: size + 14, alignItems: 'center' }} accessibilityRole="image" accessibilityLabel={`Roulette wheel with ${pockets.length} watches, each slice sized to its odds`}>
      <View style={{ marginTop: 14, width: size, height: size }}>
        <Animated.View style={{ width: size, height: size, transform: [{ rotate: rot }] }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Circle cx={c} cy={c} r={c - 1} fill={C.deep} stroke={C.brass} strokeWidth={2} />
            {S.map((s) => (
              <Path key={s.index} d={slicePath(c, c, R, s.start, s.end)} fill={s.fill}
                stroke={highlight === s.index ? C.ivory : C.deep} strokeWidth={highlight === s.index ? 2.5 : 0.8} />
            ))}
            {S.map((s) => {
              const span = s.end - s.start;
              if (span < 7) { const [x, y] = pointAt(c, c, R, s.mid); return <Circle key={`d${s.index}`} cx={x} cy={y} r={3.2} fill="#E2C67F" stroke={C.deep} strokeWidth={1} />; }
              const fs = size * (span > 30 ? 0.034 : span > 14 ? 0.03 : 0.025);
              return (
                <SvgText key={`t${s.index}`} transform={`rotate(${s.mid - 90} ${c} ${c})`} x={c + R - 10} y={c + fs * 0.35} textAnchor="end"
                  fontSize={fs} fill={s.ink} fontFamily={F.sans} fontWeight={s.rank < 3 ? '700' : '500'}>
                  {shortLabel(s.label, span > 14 ? 17 : 13)}
                </SvgText>
              );
            })}
            <Circle cx={c} cy={c} r={hub / 2 + 8} fill={C.green} stroke={C.brass} strokeWidth={2} />
          </Svg>
        </Animated.View>
        <View pointerEvents="none" style={{ position: 'absolute', left: c - hub / 2, top: c - hub / 2 }}><Mark size={hub} /></View>
      </View>
      {/* fixed pointer at the top */}
      <Svg width={26} height={24} style={{ position: 'absolute', top: 0, left: c - 13 }}><Path d="M 13 23 L 1 1 L 25 1 Z" fill="#E2C67F" stroke={C.green} strokeWidth={1.5} /></Svg>
    </View>
  );
}

export function WheelReveal({ pockets, revealed, rollPpm, onSpin, onLanded, children }: {
  pockets: Pocket[]; revealed: boolean; rollPpm: number | null;
  onSpin: () => Promise<number>; onLanded: () => void; children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - 48, 360);
  const rotation = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'landed'>('ready');
  const [landed, setLanded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const reduce = useRef(false);

  useEffect(() => { void AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduce.current = v; }); }, []);
  useEffect(() => { if (revealed) Animated.timing(rise, { toValue: 1, duration: reduce.current ? 0 : 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [revealed, rise]);

  async function spin() {
    if (phase !== 'ready') return;
    setError(null); setPhase('spinning');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let roll: number;
    try { roll = await onSpin(); } catch { setPhase('ready'); setError('Something went wrong. Your pull is safe; try again.'); return; }
    const idx = landedIndex(pockets, roll);
    setLanded(idx);
    Animated.timing(rotation, { toValue: landingRotation(roll), duration: reduce.current ? 600 : 5800, easing: Easing.bezier(0.12, 0.72, 0.14, 1), useNativeDriver: true })
      .start(() => {
        setPhase('landed');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(onLanded, 1300);
      });
  }

  if (revealed && rollPpm != null) {
    const small = Math.min(size, 230);
    return (
      <Animated.View style={{ gap: 16, opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <View style={{ alignItems: 'center' }}><WheelFace pockets={pockets} rotation={-(rollPpm / PPM) * 360} size={small} highlight={landedIndex(pockets, rollPpm)} /></View>
        {children}
      </Animated.View>
    );
  }

  const hit = landed != null ? pockets[landed] : null;
  const legend = slices(pockets).sort((a, b) => b.valueCents - a.valueCents);
  return (
    <View style={{ alignItems: 'center', gap: 18, paddingTop: 6 }}>
      <WheelFace pockets={pockets} rotation={rotation} size={size} highlight={phase === 'landed' ? landed : null} />
      <View style={{ alignItems: 'center', gap: 6, minHeight: 70, alignSelf: 'stretch' }} accessibilityLiveRegion="polite">
        {phase === 'landed' && hit ? (
          <>
            <Muted style={{ fontSize: 12, letterSpacing: 2 }}>THE POINTER STOPPED ON</Muted>
            <Body style={{ fontFamily: F.serif, fontSize: 26, textAlign: 'center' }}>{hit.label}</Body>
            <Mono style={{ color: C.brass, fontSize: 18 }}>{usd(hit.valueCents)}</Mono>
          </>
        ) : (
          <>
            <Button title={phase === 'spinning' ? 'Spinning…' : 'Spin the wheel'} onPress={spin} disabled={phase !== 'ready'} style={{ alignSelf: 'stretch' }} />
            <Muted style={{ textAlign: 'center', fontSize: 13 }}>Every watch in this box is on the wheel. Slices are drawn to the real odds, and where the pointer stops is your verifiable roll.</Muted>
          </>
        )}
        {error && <Body style={{ color: C.bad }}>{error}</Body>}
      </View>
      <Pressable onPress={() => setShowList(!showList)} style={{ alignSelf: 'stretch' }} accessibilityRole="button">
        <Body style={{ color: C.brass }}>{showList ? '▾' : '▸'} The {pockets.length} watches on this wheel</Body>
      </Pressable>
      {showList && (
        <View style={{ alignSelf: 'stretch', gap: 6 }}>
          {legend.map((s) => (
            <View key={s.index} style={{ gap: 6 }}>
              <Rule />
              <Row>
                <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: s.fill, borderWidth: 1, borderColor: C.rule, marginRight: 10 }} />
                <Body style={{ flex: 1, fontSize: 13.5 }}>{s.label}</Body>
                <Mono style={{ width: 70, textAlign: 'right', fontSize: 13 }}>{usd(s.valueCents)}</Mono>
                <Mono style={{ width: 60, textAlign: 'right', fontSize: 13, color: C.muted }}>{oddsText(s.oddsPpm)}</Mono>
              </Row>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
