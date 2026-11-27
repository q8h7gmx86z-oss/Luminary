import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { AuraNote } from '@/aura/Aura';
import { todayBrief } from '@/aura/script';
import { GameBadge, NavyGlow } from '@/components/GameBadge';
import { Icon, IconName } from '@/components/Icon';
import { useCountUp } from '@/components/motion';
import { networkLevels, SkillNetwork } from '@/components/SkillNetwork';
import { Overline, Screen } from '@/components/ui';
import { ARTICLES, HABITS } from '@/content/content';
import { dayKey } from '@/lib/logic';
import { useStore } from '@/lib/store';
import { fonts, radii, type, useTheme } from '@/lib/theme';
import { GAMES, SKILLS } from '@/training/catalog';
import { dayIndex, GameId, MAX_LEVEL, Skill } from '@/training/engine';
import { skillSummaries } from '@/training/stats';
import { todayInsight } from '@/training/todayInsight';
import { forgivingStreak, GOAL_NAMES, weekOf } from '@/training/planner';
import { MAX_SHARPNESS } from '@/training/sharpness';
import { useSharpness } from '@/training/SharpnessCard';
import { useTodayPlan } from '@/training/usePlan';

function dateLine(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 18) return 'Good afternoon.';
  return 'Good evening.';
}

/** Three sessions a week is the schedule the research backs (see Learn). */
const WEEKLY_TARGET = 3;

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 10, gap: 4 }}>
      <Text style={[type.overline, { color: t.muted, fontSize: 9.5 }]}>{label}</Text>
      <Text style={[type.number, { color: t.text }]}>{value}</Text>
    </View>
  );
}

/** The hero: one performance score, what it means, and the skill network lighting up behind it. */
function PerformancePanel() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { state } = useStore();
  const { now, history, first } = useSharpness();
  const score = useCountUp(now.total);
  const [why, setWhy] = useState(false);
  const today = dayKey();
  const { results, workouts, levels } = state.training;
  const empty = history.length === 0;
  const gain = first !== undefined && history.length > 1 ? now.total - first : 0;

  const active = new Set([...workouts, ...results.map((r) => r.day)]);
  const streak = forgivingStreak(active, today);
  const week = new Set(weekOf(today));
  const thisWeek = workouts.filter((w) => week.has(w)).length;
  const played = new Set(results.map((r) => r.game));
  const netW = Math.min(250, Math.round(Math.min(width, 640) * 0.6));

  return (
    <View style={{ backgroundColor: t.surface, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, padding: 16, paddingBottom: 14, overflow: 'hidden' }}>
      <NavyGlow />
      <View style={{ position: 'absolute', right: -24, top: -10 }}>
        <SkillNetwork width={netW} height={Math.round(netW * 0.74)} level={networkLevels(levels, played, MAX_LEVEL)} dim={empty ? 0.5 : 0.9} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="What the performance score means"
        onPress={() => setWhy(!why)}
        hitSlop={8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
      >
        <Overline>Performance score</Overline>
        <Icon name="info" size={13} color={t.muted} strokeWidth={2} />
      </Pressable>

      {empty ? (
        <View style={{ marginTop: 10, gap: 6, maxWidth: 220 }}>
          <Text style={[type.title, { color: t.text }]}>Not yet measured</Text>
          <Text style={[type.caption, { color: t.muted }]}>Your first workout sets your baseline. Every session after is measured against it.</Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
            <Text style={[type.metric, { color: t.text, lineHeight: 56 }]} accessibilityLabel={`${now.total} out of ${MAX_SHARPNESS}`}>
              {score}
            </Text>
            <Text style={[type.number, { color: t.muted, fontSize: 15, fontFamily: fonts.body }]}>/ {MAX_SHARPNESS}</Text>
          </View>
          {gain > 0 ? (
            <View style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: t.goldSoft, borderRadius: 13, height: 26, paddingHorizontal: 10, justifyContent: 'center' }}>
              <Text style={{ color: t.gold, fontFamily: fonts.semibold, fontSize: 12 }}>+{gain} since baseline</Text>
            </View>
          ) : null}
          <Text style={[type.caption, { color: t.muted, marginTop: 10, maxWidth: 220 }]}>
            Your progress on Luminary's tasks, against your own baseline. Not a medical measure.
          </Text>
        </>
      )}

      {why ? (
        <Text style={[type.caption, { color: t.text, marginTop: 10 }]}>
          The score combines your level and accuracy across the four skills you train: processing speed, working memory, attention
          control and flexibility. Each skill counts for up to {MAX_SHARPNESS / 4} points. It compares you only with yourself, never with
          other people, and it does not diagnose or measure brain health.
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Stat label="Streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} />
        <Stat label="Session" value={`${state.settings.sessionMinutes} min`} />
        <Stat label="This week" value={`${Math.min(thisWeek, WEEKLY_TARGET)} of ${WEEKLY_TARGET}`} />
      </View>
    </View>
  );
}

function WorkoutRow({ game, reason }: { game: GameId; reason: string }) {
  const t = useTheme();
  const { state } = useStore();
  const info = GAMES[game];
  const level = state.training.levels[game] ?? 1;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.row, borderWidth: 1, borderColor: t.border, backgroundColor: 'rgba(241, 240, 250, 0.03)' }}>
      <GameBadge game={game} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={[type.label, { color: t.text }]}>{info.name}</Text>
          <Text style={[type.caption, { color: t.muted, fontVariant: ['tabular-nums'] }]}>Lv {level}</Text>
        </View>
        <Text style={{ color: info.accent, fontFamily: fonts.medium, fontSize: 12.5 }}>{SKILLS[info.skill].name}</Text>
        <Text style={[type.caption, { color: t.muted }]}>{reason}</Text>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(241, 240, 250, 0.08)', marginTop: 6, overflow: 'hidden' }}>
          <View style={{ width: `${Math.round((level / MAX_LEVEL) * 100)}%`, height: 4, borderRadius: 2, backgroundColor: info.accent, opacity: 0.85 }} />
        </View>
      </View>
    </View>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Aura's briefing for today, from the plan and the person's recent training. */
function TodayBrief({ plan }: { plan: ReturnType<typeof useTodayPlan> }) {
  const { state } = useStore();
  const today = dayKey();
  const { results, workouts } = state.training;
  const days = [...workouts, ...results.map((r) => r.day)].filter((d) => d < today).sort();
  const last = days[days.length - 1];
  const daysAway = last ? Math.round((Date.parse(today) - Date.parse(last)) / DAY_MS) : null;
  const week = new Set(weekOf(today));
  const targeted = plan.find((p) => p.kind === 'targeted');
  return (
    <AuraNote
      ask="today's training"
      line={todayBrief({
        firstVisit: results.length === 0,
        workedOut: workouts.includes(today),
        daysAway,
        tasks: plan.length,
        minutes: state.settings.sessionMinutes,
        targeted: targeted
          ? { skill: SKILLS[GAMES[targeted.game].skill].name, stalled: targeted.reason.includes('levelled off'), goal: targeted.reason.startsWith('Your goal') }
          : undefined,
        thisWeek: workouts.filter((w) => week.has(w)).length,
        weeklyTarget: WEEKLY_TARGET,
      })}
    />
  );
}

/** One honest sentence about the person's own progress. */
function InsightLine() {
  const t = useTheme();
  const { state } = useStore();
  const summaries = skillSummaries(state.training.results, state.training.levels, (g) => GAMES[g].skill, Object.keys(SKILLS) as Skill[]);
  const insight = todayInsight(summaries, (s) => SKILLS[s].name);
  const colour = insight.skill ? SKILLS[insight.skill].color : t.lavender;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Your progress. ${insight.text}`} onPress={() => router.push('/progress')}>
      {({ pressed }) => (
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: radii.row, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, opacity: pressed ? 0.9 : 1 }}>
          <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colour }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[type.overline, { color: t.muted, fontSize: 9.5 }]}>Your progress</Text>
            <Text style={[type.body, { color: t.text }]}>{insight.text}</Text>
          </View>
          <Icon name="arrow" size={16} color={t.muted} />
        </View>
      )}
    </Pressable>
  );
}

/** A short read from the Brain Observatory, a different one each day. */
function Discovery() {
  const t = useTheme();
  const a = ARTICLES[((dayIndex(dayKey()) % ARTICLES.length) + ARTICLES.length) % ARTICLES.length];
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`Today's discovery. ${a.title}`} onPress={() => router.push(`/article/${a.id}`)}>
      {({ pressed }) => (
        <View style={{ padding: 16, gap: 6, borderRadius: radii.panel, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, opacity: pressed ? 0.92 : 1 }}>
          <Overline color={t.lavender}>A discovery for today</Overline>
          <Text style={[type.section, { color: t.text, fontSize: 17, lineHeight: 23 }]}>{a.title}</Text>
          <Text style={[type.caption, { color: t.muted }]}>{a.summary}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Text style={{ color: t.lavender, fontFamily: fonts.semibold, fontSize: 14 }}>Explore the science</Text>
            <Icon name="arrow" size={16} color={t.lavender} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

function Tool({ icon, label, detail, colour, onPress }: { icon: IconName; label: string; detail: string; colour: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${detail}`}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, minHeight: 104, padding: 12, gap: 6, borderRadius: radii.row, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, opacity: pressed ? 0.88 : 1 })}
    >
      <Icon name={icon} size={20} color={colour} strokeWidth={1.7} />
      <Text style={[type.label, { color: t.text }]}>{label}</Text>
      <Text style={[type.caption, { color: t.muted, fontSize: 12 }]}>{detail}</Text>
    </Pressable>
  );
}

export default function Today() {
  const { state } = useStore();
  const t = useTheme();
  const today = dayKey();
  const habitsDone = (state.habits[today] ?? []).length;
  const checkedIn = Boolean(state.moods[today]) && Boolean(state.sleeps[today]);

  const plan = useTodayPlan();
  const prefs = state.settings;
  const workedOut = state.training.workouts.includes(today);

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Overline>{dateLine()}</Overline>
        <Text accessibilityRole="header" style={[type.title, { color: t.text }]}>
          {greeting()}
          {'\n'}
          <Text style={{ color: t.lavender }}>{workedOut ? 'Session banked.' : 'Let’s get sharp.'}</Text>
        </Text>
      </View>

      <TodayBrief plan={plan} />

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text accessibilityRole="header" style={[type.section, { color: t.text }]}>
            {workedOut ? 'Train again' : 'Today’s workout'}
          </Text>
          <Text style={[type.caption, { color: t.muted }]}>
            {prefs.sessionMinutes} min · {GOAL_NAMES[prefs.goal]}
          </Text>
        </View>
        <View style={{ gap: 8 }}>
          {plan.map((p) => (
            <WorkoutRow key={p.game} game={p.game} reason={p.reason} />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/workout')}
          style={({ pressed }) => ({
            backgroundColor: t.primary,
            borderRadius: radii.button,
            minHeight: 52,
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: t.primaryGlow,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: fonts.semibold }}>{workedOut ? 'Train again' : 'Start workout'}</Text>
          <Icon name="arrow" size={18} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
        <Text style={[type.caption, { color: t.muted, textAlign: 'center' }]}>Starts with a one-minute breathing warm-up</Text>
      </View>

      <PerformancePanel />

      <InsightLine />

      <Discovery />

      <View style={{ gap: 10 }}>
        <Text accessibilityRole="header" style={[type.section, { color: t.text }]}>
          Tools for today
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Tool icon="target" label="Focus" detail="Timer, tasks and plans" colour={t.teal} onPress={() => router.push('/focus')} />
          <Tool icon="moon" label="Check in" detail={checkedIn ? 'Done today' : 'Sleep and mood'} colour={t.gold} onPress={() => router.push(state.sleeps[today] ? '/mood' : '/sleep')} />
          <Tool icon="check" label="Habits" detail={`${habitsDone} of ${HABITS.length} today`} colour={t.lavender} onPress={() => router.push('/habits')} />
        </View>
      </View>
    </Screen>
  );
}
