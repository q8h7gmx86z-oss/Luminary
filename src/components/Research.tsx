import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Evidence, evidenceFor, Paper, PAPERS, paperUrl, pubmedUrl, QUOTES, Verdict, VERDICTS } from '@/content/research';
import { fonts, radii, type, useTheme } from '@/lib/theme';

import { Icon } from './Icon';
import { Overline } from './ui';

/** Each strength of evidence has its own colour. Gold stays reserved for achievements. */
export const VERDICT_COLOR: Record<Verdict, string> = {
  strong: '#4FD1A5',
  moderate: '#A995FF',
  mixed: '#F2A65A',
  early: '#9298B3',
  measure: '#4F8CFF',
};

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const c = VERDICT_COLOR[verdict];
  return (
    <View
      accessibilityLabel={VERDICTS[verdict].label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: c + '55', backgroundColor: c + '14', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} />
      <Text style={{ color: c, fontFamily: fonts.semibold, fontSize: 12 }}>{VERDICTS[verdict].label}</Text>
    </View>
  );
}

function LinkText({ label, url }: { label: string; url: string }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="link" accessibilityHint="Opens the paper in your browser" onPress={() => Linking.openURL(url)} hitSlop={8}>
      {({ pressed }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: pressed ? 0.7 : 1 }}>
          <Text style={{ color: t.lavender, fontFamily: fonts.semibold, fontSize: 13 }}>{label}</Text>
          <Icon name="arrow" size={13} color={t.lavender} />
        </View>
      )}
    </Pressable>
  );
}

export function PaperCard({ paper }: { paper: Paper }) {
  const t = useTheme();
  const pm = pubmedUrl(paper);
  return (
    <View style={{ backgroundColor: t.raised, borderRadius: radii.row, borderWidth: 1, borderColor: t.border, padding: 14, gap: 6 }}>
      <Text style={[type.overline, { color: t.muted, fontSize: 10 }]}>{paper.design}</Text>
      <Text style={{ color: t.text, fontFamily: fonts.semibold, fontSize: 14.5, lineHeight: 20 }}>{paper.title}</Text>
      <Text style={[type.caption, { color: t.muted }]}>
        {paper.authors} · <Text style={{ fontStyle: 'italic' }}>{paper.journal}</Text> {paper.year}; {paper.ref}
      </Text>
      <Text style={[type.caption, { color: t.text, fontSize: 13.5, lineHeight: 20 }]}>{paper.finding}</Text>
      <View style={{ flexDirection: 'row', gap: 18, marginTop: 2, flexWrap: 'wrap' }}>
        <LinkText label={paper.doi ? 'Read the paper' : 'Read on PubMed'} url={paperUrl(paper)} />
        {paper.doi && pm ? <LinkText label="PubMed" url={pm} /> : null}
      </View>
    </View>
  );
}

export function QuoteCard({ id }: { id: string }) {
  const t = useTheme();
  const q = QUOTES[id];
  if (!q) return null;
  return (
    <View style={{ borderLeftWidth: 2, borderLeftColor: t.gold, paddingLeft: 14, paddingVertical: 4, gap: 6 }}>
      <Text style={{ color: t.text, fontFamily: fonts.display, fontSize: 16, lineHeight: 23, letterSpacing: -0.2 }}>“{q.text}”</Text>
      <Text style={[type.caption, { color: t.gold, fontFamily: fonts.semibold }]}>
        {q.who}
        <Text style={{ color: t.muted, fontFamily: fonts.body }}>
          {'  ·  '}
          {q.role}, {q.source}
        </Text>
      </Text>
    </View>
  );
}

/** The full evidence for one game or task: verdict, highlights, the honest part, papers and a quote. */
export function EvidenceDetail({ evidence, showQuote = true }: { evidence: Evidence; showQuote?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 8 }}>
        {evidence.highlights.map((h, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: VERDICT_COLOR[evidence.verdict], marginTop: 8 }} />
            <Text style={[type.body, { color: t.text, flex: 1 }]}>{h}</Text>
          </View>
        ))}
      </View>
      <View style={{ backgroundColor: t.soft, borderRadius: radii.row, padding: 14, gap: 4 }}>
        <Overline color={t.lavender}>The honest part</Overline>
        <Text style={[type.caption, { color: t.text, fontSize: 13.5, lineHeight: 20 }]}>{evidence.limits}</Text>
      </View>
      <View style={{ gap: 10 }}>
        <Overline>
          {evidence.papers.length} peer-reviewed {evidence.papers.length === 1 ? 'paper' : 'papers'}
        </Overline>
        {evidence.papers.map((id) => (PAPERS[id] ? <PaperCard key={id} paper={PAPERS[id]} /> : null))}
      </View>
      {showQuote && evidence.quote ? <QuoteCard id={evidence.quote} /> : null}
    </View>
  );
}

/**
 * "Why this works" panel for a game or task. Collapsed, it shows the verdict and the one-line reason,
 * so it never gets in the way. Open, it shows highlights, limits and links to every paper.
 */
export function ResearchPanel({ id, startOpen = false }: { id: string; startOpen?: boolean }) {
  const t = useTheme();
  const [open, setOpen] = useState(startOpen);
  const e = evidenceFor(id);
  if (!e) return null;
  return (
    <View style={{ width: '100%', backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`The research. ${VERDICTS[e.verdict].label}. ${open ? 'Hide' : 'Show'} the papers.`}
        onPress={() => setOpen((v) => !v)}
        hitSlop={6}
        style={{ gap: 8 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Overline color={t.lavender}>The research</Overline>
          <Text style={{ color: t.lavender, fontFamily: fonts.semibold, fontSize: 13 }}>
            {open ? 'Hide' : `${e.papers.length} ${e.papers.length === 1 ? 'paper' : 'papers'}`}
          </Text>
        </View>
        <VerdictChip verdict={e.verdict} />
        <Text style={[type.body, { color: t.text }]}>{e.why}</Text>
      </Pressable>
      {open ? <EvidenceDetail evidence={e} /> : null}
    </View>
  );
}

/** A compact row that opens the full evidence page. For screens with little room. */
export function ResearchLink({ id, label }: { id: string; label?: string }) {
  const t = useTheme();
  const e = evidenceFor(id);
  if (!e) return null;
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`${label ?? 'The research'}: ${VERDICTS[e.verdict].label}`} onPress={() => router.push(`/research/${id}`)} hitSlop={6}>
      {({ pressed }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: pressed ? 0.7 : 1, flexWrap: 'wrap' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: VERDICT_COLOR[e.verdict] }} />
          <Text style={{ color: t.lavender, fontFamily: fonts.semibold, fontSize: 13 }}>{label ?? 'The research'}</Text>
          <Text style={{ color: t.muted, fontFamily: fonts.body, fontSize: 13 }}>
            {VERDICTS[e.verdict].label} · {e.papers.length} {e.papers.length === 1 ? 'paper' : 'papers'}
          </Text>
          <Icon name="arrow" size={13} color={t.lavender} />
        </View>
      )}
    </Pressable>
  );
}
