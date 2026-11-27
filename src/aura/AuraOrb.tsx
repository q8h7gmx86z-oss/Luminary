// lib/AuraOrb.tsx
//
// Luminary copy of Aura, the companion shared across Sandra's apps. The look and the five states
// are unchanged from her v3 source. One addition: an optional `still` prop for reduced motion
// (device setting, calm mode or minimal visuals). When set, the idle loops and the success ring
// stay off; colour changes for thinking and the brief error dim still show. Default behaviour is
// identical to the shared component.
//
// v3 — REBUILT WITH react-native-svg. The previous two versions used
// stacked flat Views to fake a glow, which fundamentally cannot produce
// a true soft blur — no matter how many layers or how gently the opacity
// steps, a flat-colored circle always has a hard edge where it ends,
// which is exactly why v2 still read as "concentric circles" rather than
// a genuine soft glow. This version uses SVG RadialGradient instead,
// which renders a real, continuous, edge-free glow — the same technique
// actual design tools use. This is a real quality fix, not another
// patch on the same underlying approach.
//
// Requires react-native-svg — bundled by default in virtually every
// Expo project already (needed for most icon libraries), so this should
// not require adding a new dependency. If it's somehow missing:
//   npx expo install react-native-svg
//
// STATES: idle / explaining / thinking / success / error — unchanged
// from previous versions, still driven by the real request lifecycle.
// ANIMATIONS: floating, breathing, glow pulse, slow rotation — all
// still pure Animated API, now animating SVG props via
// Animated.createAnimatedComponent instead of plain View opacity/scale.
//
// COLOR CHOICE: dedicated warm gold — not reused from the locked
// crimson/green/turquoise/purple palette, each of which already has one
// locked job elsewhere in the app.

import React, { useEffect, useId, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type AuraState = 'idle' | 'explaining' | 'thinking' | 'success' | 'error';

const GOLD_CORE = '#f5c518';
const GOLD_BRIGHT = '#fffbea';
const GOLD_DEEP = '#e8a93a';
const THINKING_BLUE_CORE = '#6EA8DC';
const THINKING_BLUE_BRIGHT = '#f0f9ff';
const THINKING_BLUE_DEEP = '#4a8fc9';

type Props = {
  state?: AuraState;
  size?: number;
  /** Reduced motion: no floating, breathing, pulsing or rotation. Colour states still show. */
  still?: boolean;
};

export default function AuraOrb({ state = 'idle', size = 48, still = false }: Props) {
  const instanceId = useId().replace(/:/g, '');
  const floatAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const thinkingBlend = useRef(new Animated.Value(0)).current;
  const successRing = useRef(new Animated.Value(0)).current;
  const errorDim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (still) {
      floatAnim.setValue(0.5);
      breatheAnim.setValue(0.5);
      glowAnim.setValue(0.5);
      rotateAnim.setValue(0.5);
      return;
    }
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    const rotateLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    floatLoop.start();
    breatheLoop.start();
    glowLoop.start();
    rotateLoop.start();
    return () => {
      floatLoop.stop();
      breatheLoop.stop();
      glowLoop.stop();
      rotateLoop.stop();
    };
  }, [still]);

  useEffect(() => {
    Animated.timing(thinkingBlend, {
      toValue: state === 'thinking' ? 1 : 0,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [state]);

  useEffect(() => {
    if (state === 'success' && !still) {
      successRing.setValue(0);
      Animated.timing(successRing, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [state]);

  useEffect(() => {
    if (state === 'error') {
      errorDim.setValue(0);
      Animated.sequence([
        Animated.timing(errorDim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(errorDim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });
  const scale = breatheAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] });
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.85] });
  const dimOpacity = errorDim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
  const ringScale = successRing.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ringOpacity = successRing.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.55, 0] });

  // Since react-native-svg gradient stop colors can't be smoothly
  // interpolated via Animated, the gold/blue transition is done by
  // cross-fading two complete SVG renders (gold and blue) via opacity —
  // same reliable technique as before, just applied to real SVG output
  // instead of flat Views.
  const canvasSize = size * 2.6;
  const center = canvasSize / 2;

  const renderOrb = (coreColor: string, brightColor: string, deepColor: string, keyPrefix: string) => (
    <Svg width={canvasSize} height={canvasSize} viewBox={`0 0 ${canvasSize} ${canvasSize}`}>
      <Defs>
        <RadialGradient id={`glow-${keyPrefix}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={brightColor} stopOpacity={0.65} />
          <Stop offset="55%" stopColor={coreColor} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={coreColor} stopOpacity={0} />
        </RadialGradient>
        {/* Core: shading now fades toward a lighter, partly translucent
            edge rather than an opaque dark tone — this is the change that
            actually removes the "solid lit sphere / rock" look, since a
            real light source has no fully opaque shadow side. */}
        <RadialGradient id={`core-${keyPrefix}`} cx="42%" cy="38%" r="70%">
          <Stop offset="0%" stopColor={brightColor} stopOpacity={1} />
          <Stop offset="45%" stopColor={coreColor} stopOpacity={0.95} />
          <Stop offset="100%" stopColor={deepColor} stopOpacity={0.55} />
        </RadialGradient>
        <RadialGradient id={`highlight-${keyPrefix}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* Outer glow — wider and brighter now, so light reads as the
          dominant quality rather than a thin rim around a solid ball. */}
      <AnimatedCircle cx={center} cy={center} r={size * 1.3} fill={`url(#glow-${keyPrefix})`} opacity={glowOpacity as unknown as number} />
      {/* Core — softened shading, partly translucent at the edge */}
      <Circle cx={center} cy={center} r={size / 2} fill={`url(#core-${keyPrefix})`} />
      {/* Soft, larger catch-light — less like a hard reflective glint off a solid surface */}
      <Circle cx={center - size * 0.1} cy={center - size * 0.12} r={size * 0.16} fill={`url(#highlight-${keyPrefix})`} />
    </Svg>
  );

  return (
    <View style={{ width: canvasSize, height: canvasSize, alignItems: 'center', justifyContent: 'center' }}>
      {/* Success ring */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: GOLD_CORE,
          transform: [{ scale: ringScale }],
          opacity: ringOpacity,
        }}
      />
      <Animated.View style={{ transform: [{ translateY }, { scale }, { rotate }], opacity: dimOpacity }}>
        {/* Gold render, fades out when thinking */}
        <Animated.View style={{ opacity: thinkingBlend.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
          {renderOrb(state === 'explaining' ? GOLD_BRIGHT : GOLD_CORE, GOLD_BRIGHT, GOLD_DEEP, `${instanceId}-gold`)}
        </Animated.View>
        {/* Blue render, fades in when thinking, stacked on top */}
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, opacity: thinkingBlend }}>
          {renderOrb(THINKING_BLUE_CORE, THINKING_BLUE_BRIGHT, THINKING_BLUE_DEEP, `${instanceId}-blue`)}
        </Animated.View>
      </Animated.View>
    </View>
  );
}
