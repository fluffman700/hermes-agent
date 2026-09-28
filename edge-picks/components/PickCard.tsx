import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
import { formatOdds, formatUnits } from '@/lib/stats';
import type { Pick, User } from '@/lib/types';
import { Avatar } from './ui';

const resultColor = {
  win: colors.win,
  loss: colors.loss,
  push: colors.push,
  pending: colors.pending,
} as const;

export function PickCard({
  pick,
  tipster,
  locked,
  onPress,
  onSettle,
}: {
  pick: Pick;
  tipster?: User;
  locked?: boolean;
  onPress?: () => void;
  onSettle?: (result: 'win' | 'loss' | 'push') => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.top}>
        <View style={styles.sportBadge}>
          <Text style={styles.sport}>{pick.sport}</Text>
        </View>
        <Text style={[styles.result, { color: resultColor[pick.result] }]}>
          {locked ? 'LOCKED' : pick.result.toUpperCase()}
        </Text>
      </View>

      {tipster ? (
        <View style={styles.tipsterRow}>
          <Avatar name={tipster.displayName} color={tipster.avatarColor} size={28} />
          <Text style={styles.tipsterName}>{tipster.displayName}</Text>
        </View>
      ) : null}

      <Text style={styles.event}>{locked ? 'Subscriber pick' : pick.event}</Text>
      <Text style={styles.selection}>
        {locked ? '••••••••••••' : pick.selection}
      </Text>

      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {locked ? '•••' : formatOdds(pick.oddsAmerican)} · {pick.units}u
        </Text>
        <Text style={styles.metaText}>{pick.market}</Text>
      </View>

      {!locked && pick.notes ? (
        <Text style={styles.notes}>{pick.notes}</Text>
      ) : null}

      {!locked && pick.result === 'pending' && onSettle ? (
        <View style={styles.settleRow}>
          {(['win', 'loss', 'push'] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => onSettle(r)}
              style={[styles.settleBtn, { borderColor: resultColor[r] }]}
            >
              <Text style={[styles.settleText, { color: resultColor[r] }]}>
                {r.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export function StatHero({
  winPct,
  record,
  unitsNet,
  streak,
}: {
  winPct: string;
  record: string;
  unitsNet: number;
  streak: string;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroMain}>
        <Text style={styles.heroLabel}>Win rate</Text>
        <Text style={styles.heroPct}>{winPct}</Text>
        <Text style={styles.heroRecord}>{record}</Text>
      </View>
      <View style={styles.heroSide}>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Units</Text>
          <Text
            style={[
              styles.heroStatValue,
              { color: unitsNet >= 0 ? colors.win : colors.loss },
            ]}
          >
            {formatUnits(unitsNet)}
          </Text>
        </View>
        <View style={styles.heroStat}>
          <Text style={styles.heroStatLabel}>Streak</Text>
          <Text style={styles.heroStatValue}>{streak}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sport: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 0.8,
  },
  result: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 1,
  },
  tipsterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipsterName: {
    fontFamily: 'DMSans_500Medium',
    color: colors.textMuted,
    fontSize: 13,
  },
  event: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
    fontSize: 13,
  },
  selection: {
    fontFamily: 'BebasNeue_400Regular',
    color: colors.text,
    fontSize: 28,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: {
    fontFamily: 'DMSans_500Medium',
    color: colors.textDim,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  notes: {
    marginTop: 10,
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  settleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  settleBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  settleText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  hero: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  heroMain: {
    flex: 1.2,
    padding: spacing.lg,
    backgroundColor: '#163528',
  },
  heroLabel: {
    fontFamily: 'DMSans_500Medium',
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroPct: {
    fontFamily: 'BebasNeue_400Regular',
    color: colors.accent,
    fontSize: 64,
    lineHeight: 68,
    marginTop: 4,
  },
  heroRecord: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
    fontSize: 14,
  },
  heroSide: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: 16,
  },
  heroStat: {},
  heroStatLabel: {
    fontFamily: 'DMSans_500Medium',
    color: colors.textDim,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroStatValue: {
    fontFamily: 'BebasNeue_400Regular',
    color: colors.text,
    fontSize: 28,
    marginTop: 2,
  },
});
