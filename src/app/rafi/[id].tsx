import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, Field, Heading, Screen, Title } from '@/components/ui';
import { FACTORS, Link, recordFor, STAGES, Status, STATUS } from '@/content/rafi';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

function Links({ items }: { items: Link[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {items.map((l) => (
        <Pressable key={l.url} accessibilityRole="link" onPress={() => Linking.openURL(l.url)} hitSlop={4}>
          <Text style={{ color: t.primary, textDecorationLine: 'underline', fontSize: 15 }}>{l.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const fmtDate = (at: number) => new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** One risk factor in full: what it is, why it matters, the research, what to do, and your own record. */
export default function RafiFactor() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, setRafiStatus, addRafiNote, removeRafiNote } = useStore();
  const [note, setNote] = useState('');
  const f = FACTORS.find((x) => x.id === id) ?? FACTORS[0];
  const r = recordFor(f.id, state.rafiPlan, state.rafi);

  return (
    <Screen>
      <Text style={{ color: t.muted, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>
        {STAGES[f.stage].name.toUpperCase()} · {f.share}% OF CASES WORLDWIDE
      </Text>
      <Title>{f.action}</Title>

      <Card>
        <Heading>What it is</Heading>
        <Body>{f.what}</Body>
        <Heading>Why it matters for your brain</Heading>
        <Body>{f.why}</Body>
      </Card>

      <Card>
        <Heading>What the research shows</Heading>
        <Body>{f.research}</Body>
        <Body muted>
          The {f.share}% is the Commission’s population estimate: the share of cases worldwide that might be avoided if this factor were
          removed everywhere. It is not your personal risk.
        </Body>
        <Links items={f.sources} />
      </Card>

      <Card>
        <Heading>What to do</Heading>
        {f.steps.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
            <Text style={{ color: t.primary, fontWeight: '900', fontSize: 16, width: 20 }}>{i + 1}</Text>
            <Text style={{ color: t.text, fontSize: 16, lineHeight: 23, flex: 1 }}>{s}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Heading>Your record</Heading>
        <View accessibilityRole="radiogroup" accessibilityLabel="Status" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(Object.keys(STATUS) as Status[]).map((s) => {
            const on = r.status === s;
            return (
              <Pressable
                key={s}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => setRafiStatus(f.id, s)}
                style={{
                  flexGrow: 1,
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderColor: on ? t.primary : t.border,
                  backgroundColor: on ? t.soft : t.surface,
                }}
              >
                <Text style={{ color: t.text, fontWeight: on ? '800' : '600' }}>{STATUS[s].label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Body muted>Log what you did and when: a reading, an appointment, a change you made. It stays on this device.</Body>
        <Field
          label="Add a note"
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Hearing test booked for 4 December"
          maxLength={200}
        />
        <Button
          kind="secondary"
          label="Save note"
          disabled={!note.trim()}
          onPress={() => {
            addRafiNote(f.id, note.trim());
            setNote('');
          }}
        />
        {r.log.map((l) => (
          <View
            key={l.at}
            style={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'flex-start',
              paddingVertical: 6,
              borderTopWidth: 1,
              borderTopColor: t.border,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: t.muted, fontSize: 12, fontWeight: '700' }}>{fmtDate(l.at)}</Text>
              <Text style={{ color: t.text, fontSize: 15 }}>{l.text}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete note from ${fmtDate(l.at)}`}
              onPress={() => removeRafiNote(f.id, l.at)}
              hitSlop={8}
            >
              <Text style={{ color: t.muted, fontSize: 13, textDecorationLine: 'underline' }}>Delete</Text>
            </Pressable>
          </View>
        ))}
        <Body muted>Your record tracks actions, not risk. Marking this in place does not change any estimate of your personal risk.</Body>
      </Card>

      <Card>
        <Heading>Help and services</Heading>
        <Links items={f.resources} />
        <Body muted>UK services. Elsewhere, your own health service offers similar checks.</Body>
      </Card>
    </Screen>
  );
}
