import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { ResearchLink } from '@/components/Research';
import { Button, Overline, Screen } from '@/components/ui';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { radii, type, useTheme } from '@/lib/theme';
import { Panel } from '@/real/ui';

/** The bedtime brain dump: a specific to-do list for tomorrow, written in five minutes before sleep. */
export default function Dump() {
  const t = useTheme();
  const { state, saveDump } = useStore();
  const today = dayKey();
  const saved = state.dumps?.[today];
  const [text, setText] = useState(saved ? saved.items.join('\n') : '');
  const [done, setDone] = useState(!!saved);
  const items = text.split('\n').map((x) => x.trim()).filter(Boolean);

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline color={t.lavender}>Bedtime brain dump</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          Out of your head, onto the page.
        </Text>
        <Text style={[type.body, { color: t.muted }]}>
          Unfinished tasks keep the mind busy at night. In a sleep-laboratory study, people who spent five minutes writing a specific to-do list for the
          coming days fell asleep faster than people who wrote about what they had already done. The more specific the list, the faster they fell
          asleep.
        </Text>
      </View>

      <Panel>
        <Overline>Tomorrow and the next few days</Overline>
        <TextInput
          accessibilityLabel="Your to-do list, one item per line"
          multiline
          value={text}
          onChangeText={(v) => {
            setText(v);
            setDone(false);
          }}
          placeholder={'Email Sam the revised figures by 10\nBook the dentist for next week\nBuy a birthday card for Mum'}
          placeholderTextColor={t.muted}
          style={{ minHeight: 180, color: t.text, borderWidth: 1, borderColor: t.border, borderRadius: radii.sm, backgroundColor: t.bg, padding: 12, fontSize: 16, textAlignVertical: 'top' }}
        />
        <Text style={[type.caption, { color: t.muted }]}>One task per line. Be specific: what, for whom and when.</Text>
        <Button
          label={done ? 'Saved for tonight' : 'Save and close the day'}
          disabled={!items.length || done}
          onPress={() => {
            saveDump(items);
            setDone(true);
          }}
        />
        {done ? <Text style={[type.caption, { color: t.teal }]}>{items.length} {items.length === 1 ? 'task' : 'tasks'} written down. They will keep until morning.</Text> : null}
      </Panel>

      <ResearchLink id="dump" />
    </Screen>
  );
}
