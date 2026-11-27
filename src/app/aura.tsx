import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import AuraOrb, { AuraState } from '@/aura/AuraOrb';
import { askAura, ChatTurn, researchLibrary } from '@/aura/chat';
import { AURA_ENDPOINT, AURA_KEY } from '@/aura/config';
import { useAuraContext } from '@/aura/useAuraContext';
import { emmaRetry, EmmaStatus, emmaStatus, emmaWarm, onEmmaStatus } from '@/aura/emma';
import { diagLines, onDiag } from '@/aura/diag';
import { primeAura, soundCheck, speakAura, stopAura } from '@/aura/voice';
import { Icon } from '@/components/Icon';
import { useReducedMotion } from '@/components/motion';
import { Overline } from '@/components/ui';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';


const STARTERS = [
  'What should I focus on this week?',
  'Why does training at the right difficulty matter?',
  'How does sleep affect my results?',
  'What does my performance score actually measure?',
];

const FAILURE: Record<string, string> = {
  offline: 'I can’t reach the server just now. Check your connection and ask again.',
  busy: 'A lot of people are asking at once. Give it a moment and ask again.',
  unavailable: 'Something went wrong on my side. Ask again in a moment.',
  'not-configured': 'Conversation with Aura is being set up and isn’t live yet. The guidance across the app works as normal.',
};

/** What Emma's voice is doing, shown just above the question box so it stays in view. */
function voiceNote(e: EmmaStatus): string {
  if (e.state === 'loading') {
    if (e.pct >= 99) return 'Getting Emma’s voice ready: almost there.';
    return `Getting Emma’s voice ready${e.pct ? `: ${e.pct}%` : ''}.${e.pct < 50 ? ' The first time is a one-off download of about 115 MB.' : ''} A standard voice reads until she’s ready.`;
  }
  if (e.state === 'failed') return `Emma’s voice couldn’t start on this device${e.err ? ` (${e.err})` : ''}, so a standard voice reads instead.`;
  if (e.making) return 'Emma is preparing the answer.';
  if (e.err === 'blocked') return 'Your phone paused the sound. Tap Listen under the answer to hear Emma.';
  if (e.err) return `Emma couldn’t read that answer (${e.err}). Tap Listen to try again.`;
  return '';
}

/** Talk to Aura. The conversation stays in memory only and is gone when you leave this screen. */
export default function AuraChat() {
  const t = useTheme();
  const still = useReducedMotion();
  const { state, setSetting } = useStore();
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const context = useAuraContext();
  const library = useMemo(researchLibrary, []);
  // Failure notes are shown but never sent back to Aura as part of the conversation.
  const [turns, setTurns] = useState<(ChatTurn & { failed?: boolean })[]>([]);
  const [draft, setDraft] = useState('');
  const [orb, setOrb] = useState<AuraState>('idle');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const voiceOn = state.settings.auraVoice;

  const [emma, setEmma] = useState<EmmaStatus>(emmaStatus);
  useEffect(() => onEmmaStatus(setEmma), []);
  const [log, setLog] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  useEffect(() => onDiag(() => setLog(diagLines())), []);
  useEffect(() => () => stopAura(), []);
  // Get Emma ready as soon as the screen opens, so she is ready by the time Aura answers.
  useEffect(() => {
    if (voiceOn && state.settings.auraChat) emmaWarm();
  }, [voiceOn, state.settings.auraChat]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    stopAura();
    if (voiceOn) primeAura();
    const next = [...turns, { role: 'user' as const, content: q }];
    setTurns(next);
    setDraft('');
    setBusy(true);
    setOrb('thinking');
    const r = await askAura(AURA_ENDPOINT, AURA_KEY, { messages: next.filter((x) => !x.failed), context, topic, library, ageGroup: state.ageGroup });
    setBusy(false);
    if (r.ok) {
      setTurns((ts) => [...ts, { role: 'assistant', content: r.text }]);
      setOrb('explaining');
      if (voiceOn) speakAura(r.text, { done: () => setOrb('idle') });
      else setTimeout(() => setOrb('idle'), 2600);
    } else {
      setTurns((ts) => [...ts, { role: 'assistant', content: FAILURE[r.reason], failed: true }]);
      setOrb('error');
      setTimeout(() => setOrb('idle'), 900);
    }
  };

  if (!state.settings.auraChat) {
    return (
      <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, gap: 16, alignItems: 'center' }}>
        <Stack.Screen options={{ title: 'Aura' }} />
        <AuraOrb state="idle" size={56} still={still} />
        <Text accessibilityRole="header" style={[type.title, { color: t.text, textAlign: 'center' }]}>
          Talk to Aura
        </Text>
        <Text style={[type.body, { color: t.muted, textAlign: 'center', maxWidth: 420 }]}>
          Aura is your performance coach. Ask about your results, what to train next, or the science behind any task, and she answers from Luminary’s
          research library.
        </Text>
        <View style={{ width: '100%', maxWidth: 440, backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 8 }}>
          <Overline color={t.lavender}>Before you start</Overline>
          <Text style={[type.caption, { color: t.text, fontSize: 14, lineHeight: 21 }]}>
            Everything else in Luminary stays on this device. To answer, your question and a short summary of your training (levels, scores, this
            week’s sessions; never your name or check-in notes) are sent to Aura’s server and processed by Anthropic’s Claude. Nothing is stored there,
            and the conversation is gone when you close it.
          </Text>
          <Text style={[type.caption, { color: t.text, fontSize: 14, lineHeight: 21 }]}>
            Aura is a coach, not a doctor. She will not diagnose anything. If you are worried about your memory, attention or mood, your GP is the right
            person to talk to.
          </Text>
          <Text style={[type.caption, { color: t.muted }]}>You can turn this off any time in Training preferences.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setSetting('auraChat', true)}
          style={({ pressed }) => ({ width: '100%', maxWidth: 440, minHeight: 52, borderRadius: radii.button, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.9 : 1, boxShadow: t.primaryGlow })}
        >
          <Text style={{ color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 16 }}>Turn on conversation with Aura</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen
        options={{
          title: 'Aura',
          headerRight: () => (
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Aura reads answers aloud"
              accessibilityState={{ checked: voiceOn }}
              onPress={() => {
                if (voiceOn) stopAura();
                setSetting('auraVoice', !voiceOn);
              }}
              hitSlop={10}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: t.soft }}
            >
              <Text style={{ color: t.text, fontFamily: fonts.medium, fontSize: 13 }}>{voiceOn ? 'Voice on' : 'Voice off'}</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView ref={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: !still })} contentContainerStyle={{ padding: 20, gap: 14, flexGrow: 1 }}>
        <View style={{ alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <AuraOrb state={orb} size={44} still={still} />
          <Text style={[type.overline, { color: t.muted }]}>{busy ? 'Aura is thinking' : 'Aura · performance coach'}</Text>
        </View>

        {turns.length === 0 ? (
          <View style={{ gap: 10 }}>
            <Text style={[type.body, { color: t.text, textAlign: 'center' }]}>
              {topic ? `Ask me anything about ${topic}.` : 'Ask about your results, your next session, or the science behind any task.'}
            </Text>
            {STARTERS.map((s) => (
              <Pressable
                key={s}
                accessibilityRole="button"
                onPress={() => send(s)}
                style={({ pressed }) => ({ borderWidth: 1, borderColor: t.border, borderRadius: radii.row, padding: 14, backgroundColor: t.surface, opacity: pressed ? 0.8 : 1 })}
              >
                <Text style={{ color: t.text, fontFamily: fonts.medium, fontSize: 14.5 }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {turns.map((m, i) =>
          m.role === 'user' ? (
            <View key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: t.soft, borderRadius: radii.row, borderBottomRightRadius: 4, padding: 12 }}>
              <Text style={{ color: t.text, fontFamily: fonts.body, fontSize: 15, lineHeight: 21 }}>{m.content}</Text>
            </View>
          ) : (
            <View key={i} style={{ alignSelf: 'flex-start', maxWidth: '92%', gap: 6 }}>
              <Text style={[type.overline, { color: t.muted, fontSize: 10 }]}>Aura</Text>
              <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: radii.row, borderTopLeftRadius: 4, padding: 14, gap: 8 }}>
                <Text selectable style={{ color: t.text, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }}>
                  {m.content}
                </Text>
                {voiceOn && !m.failed ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Read this answer aloud" onPress={() => { primeAura(); setOrb('explaining'); speakAura(m.content, { done: () => setOrb('idle') }); }} hitSlop={8}>
                    <Text style={{ color: t.lavender, fontFamily: fonts.semibold, fontSize: 13 }}>Listen</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ),
        )}
        <Text style={[type.caption, { color: t.muted, textAlign: 'center', marginTop: 'auto' }]}>Aura coaches; she does not diagnose. Not medical advice.</Text>
      </ScrollView>

      {voiceOn && Platform.OS === 'web' && voiceNote(emma) ? (
        <Pressable
          accessibilityRole={emma.state === 'failed' || emma.err ? 'button' : 'text'}
          accessibilityLiveRegion="polite"
          disabled={!(emma.state === 'failed' || emma.err)}
          onPress={emmaRetry}
          style={{ paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: t.border }}
        >
          <Text style={[type.caption, { color: t.muted, textAlign: 'center' }]}>
            {voiceNote(emma)}
            {emma.state === 'failed' ? <Text style={{ color: t.lavender, fontFamily: fonts.semibold }}> Try Emma again</Text> : null}
          </Text>
        </Pressable>
      ) : null}

      {voiceOn && Platform.OS === 'web' ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderTopWidth: 1, borderTopColor: t.border, gap: 6 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sound check: play a tone and a sentence, and show what the voice is doing"
            onPress={() => { setShowLog(true); soundCheck(); }}
            hitSlop={8}
          >
            <Text style={[type.caption, { color: t.lavender, fontFamily: fonts.semibold, textAlign: 'center' }]}>
              {showLog ? 'Run the sound check again' : 'No sound? Run a sound check'}
            </Text>
          </Pressable>
          {showLog ? (
            <ScrollView style={{ maxHeight: 140 }}>
              <Text selectable style={{ color: t.muted, fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16 }}>
                {(log.length ? log : ['Nothing yet.']).join('\n')}
              </Text>
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: t.border, alignItems: 'flex-end' }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask Aura"
          placeholderTextColor={t.muted}
          multiline
          maxLength={1500}
          accessibilityLabel="Your question for Aura"
          onSubmitEditing={() => send(draft)}
          style={{ flex: 1, minHeight: 46, maxHeight: 120, color: t.text, fontFamily: fonts.body, fontSize: 15, backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderStrong, borderRadius: radii.row, paddingHorizontal: 14, paddingVertical: 12 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={busy || !draft.trim()}
          onPress={() => send(draft)}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', opacity: busy || !draft.trim() ? 0.4 : 1 }}
        >
          <Icon name="arrow" size={20} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
