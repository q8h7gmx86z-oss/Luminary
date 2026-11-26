import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ResearchLink } from '@/components/Research';
import { Button, Field, Overline, Screen } from '@/components/ui';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { dueCards, INTERVALS, learned } from '@/real/recall';
import { Panel } from '@/real/ui';

/** The recall deck: what you want to remember, tested on a widening schedule. */
export default function Recall() {
  const t = useTheme();
  const { state, addRecallCard, reviewRecallCard, removeRecallCard } = useStore();
  const cards = state.recall?.cards ?? [];
  const today = dayKey();
  const due = dueCards(cards, today);
  const [shown, setShown] = useState(false);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [manage, setManage] = useState(false);
  const reviewedToday = state.recall?.reviews[today] ?? 0;
  const card = due[0];

  const mark = (correct: boolean) => {
    if (!card) return;
    reviewRecallCard(card.id, correct);
    setShown(false);
  };

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Overline color={t.teal}>Recall deck</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          {card ? `${due.length} ${due.length === 1 ? 'card' : 'cards'} due today.` : cards.length ? 'Nothing due today.' : 'Your recall deck.'}
        </Text>
        <Text style={[type.body, { color: t.muted }]}>
          Answer in your head, reveal, then mark yourself honestly. Cards you know return after longer and longer gaps: {INTERVALS.join(', ')} days.
        </Text>
      </View>

      {card ? (
        <Panel tone={t.teal + '55'} gap={14}>
          <Overline>Question</Overline>
          <Text style={{ color: t.text, fontFamily: fonts.display, fontSize: 24 }}>{card.q}</Text>
          {shown ? (
            <>
              <View style={{ height: 1, backgroundColor: t.border }} />
              <Overline>Answer</Overline>
              <Text accessibilityLiveRegion="polite" style={{ color: t.teal, fontFamily: fonts.display, fontSize: 22 }}>
                {card.a}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button label="Not yet" kind="secondary" onPress={() => mark(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="I knew it" onPress={() => mark(true)} />
                </View>
              </View>
            </>
          ) : (
            <Button label="Reveal the answer" onPress={() => setShown(true)} />
          )}
        </Panel>
      ) : cards.length ? (
        <Panel>
          <Text style={[type.body, { color: t.text }]}>
            {reviewedToday ? `${reviewedToday} ${reviewedToday === 1 ? 'review' : 'reviews'} today. ` : ''}
            {learned(cards)} of {cards.length} {cards.length === 1 ? 'card is' : 'cards are'} in the top box, which means well learned.
          </Text>
          <Text style={[type.caption, { color: t.muted }]}>
            Next review: {cards.map((c) => c.due).sort()[0] === today ? 'today' : new Date(cards.map((c) => c.due).sort()[0] + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}.
          </Text>
        </Panel>
      ) : null}

      <Panel>
        <Overline>Add a card</Overline>
        <Field label="Question" value={q} onChangeText={setQ} placeholder="The new neighbour’s name" />
        <Field label="Answer" value={a} onChangeText={setA} placeholder="Priya, who teaches the cello" />
        <Button
          label="Add to deck"
          disabled={!q.trim() || !a.trim()}
          onPress={() => {
            addRecallCard(q, a);
            setQ('');
            setA('');
          }}
        />
        <Text style={[type.caption, { color: t.muted }]}>New cards are first tested tomorrow: a short gap before the first test helps a memory last.</Text>
      </Panel>

      {cards.length ? (
        <Panel>
          <Pressable accessibilityRole="button" onPress={() => setManage(!manage)}>
            <Text style={{ color: t.lavender, fontFamily: fonts.semibold }}>{manage ? 'Hide your cards' : `Show all ${cards.length} cards`}</Text>
          </Pressable>
          {manage
            ? cards.map((c) => (
                <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text }}>{c.q}</Text>
                    <Text style={[type.caption, { color: t.muted }]}>
                      Box {c.box + 1} of {INTERVALS.length} · due {c.due}
                    </Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Delete card: ${c.q}`} onPress={() => removeRecallCard(c.id)} hitSlop={8} style={{ padding: 6, borderRadius: radii.sm }}>
                    <Text style={{ color: t.muted, fontSize: 18 }}>✕</Text>
                  </Pressable>
                </View>
              ))
            : null}
        </Panel>
      ) : null}

      <ResearchLink id="recall" />
    </Screen>
  );
}
