import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useReducedMotion } from '@/components/motion';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';

import AuraOrb, { AuraState } from './AuraOrb';
import type { AuraLine } from './script';

// Aura, the companion across Sandra's apps, as it appears in Luminary.
// The skill network stays the hero visual; Aura sits beside the work as a guide.
//
// States follow real events:
//   explaining  new guidance appears (Today, game intro, research)
//   success     an answer is right, a level goes up, a record or a challenge is cleared
//   error       an answer is wrong (a brief dim, never a scold)
//   thinking    the app is loading your saved training
//   idle        everything else

/** How long a state from an event shows before Aura settles back to idle. */
const SETTLE_MS = { explaining: 2600, success: 1400, error: 900 } as const;

type Reactor = { state: AuraState; react: (good: boolean) => void };
const ReactionContext = createContext<Reactor | null>(null);

/** Holds Aura's in-game reaction, so every game's right and wrong answers reach the orb in the header. */
export function AuraProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuraState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const react = useCallback((good: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    // Drop to idle for a frame first, so two right answers in a row both trigger the success ring.
    setState('idle');
    requestAnimationFrame(() => setState(good ? 'success' : 'error'));
    timer.current = setTimeout(() => setState('idle'), good ? SETTLE_MS.success : SETTLE_MS.error);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const value = useMemo(() => ({ state, react }), [state, react]);
  return <ReactionContext.Provider value={value}>{children}</ReactionContext.Provider>;
}

/** Tells Aura whether an answer was right. Safe to call outside the provider. */
export function useAuraReact(): (good: boolean) => void {
  return useContext(ReactionContext)?.react ?? noop;
}
const noop = () => {};

/** The person's Aura setting: full (guidance and in-game reactions), guide (guidance only) or off. */
export function useAuraMode() {
  const { state } = useStore();
  return state.settings.aura ?? 'full';
}

/** A state that shows for a moment when `key` changes, then settles to idle. */
function useSettling(target: AuraState, key: string): AuraState {
  const [shown, setShown] = useState<AuraState>(target);
  useEffect(() => {
    setShown(target);
    if (target === 'idle' || target === 'thinking') return;
    const id = setTimeout(() => setShown('idle'), SETTLE_MS[target]);
    return () => clearTimeout(id);
  }, [target, key]);
  return shown;
}

/**
 * Aura with a line of guidance. When the person turns Aura off, the note disappears, or with
 * `essential` the text stays as plain copy, for lines that carry information the screen needs.
 */
export function AuraNote({
  line,
  title = 'Aura',
  framed = true,
  essential = false,
  ask,
}: {
  line: AuraLine;
  title?: string;
  framed?: boolean;
  essential?: boolean;
  /** Shows "Ask Aura", opening the conversation about this topic. */
  ask?: string;
}) {
  const t = useTheme();
  const mode = useAuraMode();
  const still = useReducedMotion();
  const state = useSettling(line.state, line.text);
  if (mode === 'off') {
    return essential ? <Text style={[type.caption, { color: t.muted, textAlign: 'center' }]}>{line.text}</Text> : null;
  }
  return (
    <View
      accessible={!ask}
      accessibilityLabel={ask ? undefined : `${title}: ${line.text}`}
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 4, width: '100%' },
        framed ? { backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, paddingVertical: 10, paddingRight: 16, paddingLeft: 4 } : null,
      ]}
    >
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ marginVertical: -6 }}>
        <AuraOrb state={state} size={22} still={still} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[type.overline, { color: t.muted, fontSize: 10 }]}>{title}</Text>
        <Text style={{ color: t.text, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>{line.text}</Text>
        {ask ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Ask Aura about ${ask}`}
            onPress={() => router.push({ pathname: '/aura', params: { topic: ask } })}
            hitSlop={8}
            style={{ alignSelf: 'flex-start', marginTop: 4 }}
          >
            <Text style={{ color: t.lavender, fontFamily: fonts.semibold, fontSize: 13 }}>Ask Aura</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** The small orb in every game's header. Reacts to right and wrong answers. */
export function AuraInGame() {
  const mode = useAuraMode();
  const still = useReducedMotion();
  const r = useContext(ReactionContext);
  if (mode !== 'full' || !r) return null;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}
    >
      <AuraOrb state={r.state} size={16} still={still} />
    </View>
  );
}

/** Aura while saved training loads. */
export function AuraLoading() {
  const t = useTheme();
  const still = useReducedMotion();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }} accessibilityLabel="Loading" accessible>
      <AuraOrb state="thinking" size={40} still={still} />
    </View>
  );
}
