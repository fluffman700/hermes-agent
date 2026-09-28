import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { colors, radii, spacing } from '@/constants/theme';
import { formatCents, formatWinPct } from '@/lib/stats';
import type { User } from '@/lib/types';
import type { TipsterStats } from '@/lib/stats';
import { Avatar } from './ui';

export function TipsterCard({
  tipster,
  stats,
  subscribed,
}: {
  tipster: User;
  stats: TipsterStats;
  subscribed?: boolean;
}) {
  return (
    <Link href={`/tipster/${tipster.id}`} asChild>
      <Pressable style={styles.card}>
        <Avatar name={tipster.displayName} color={tipster.avatarColor} size={48} />
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{tipster.displayName}</Text>
            {tipster.verified ? <Text style={styles.verified}>✓</Text> : null}
          </View>
          <Text style={styles.handle}>@{tipster.handle}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatWinPct(stats.winPct)} · {stats.wins}-{stats.losses}
            {stats.pushes ? `-${stats.pushes}` : ''} · {tipster.subscriberCount} subs
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.price}>{formatCents(tipster.monthlyPriceCents)}</Text>
          <Text style={styles.per}>/mo</Text>
          {subscribed ? (
            <View style={styles.subBadge}>
              <Text style={styles.subText}>SUB</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 12,
  },
  body: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: {
    fontFamily: 'DMSans_700Bold',
    color: colors.text,
    fontSize: 16,
  },
  verified: {
    color: colors.accent,
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
  },
  handle: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textDim,
    fontSize: 12,
    marginTop: 1,
  },
  meta: {
    fontFamily: 'DMSans_500Medium',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  right: { alignItems: 'flex-end' },
  price: {
    fontFamily: 'BebasNeue_400Regular',
    color: colors.accent,
    fontSize: 22,
  },
  per: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textDim,
    fontSize: 11,
    marginTop: -2,
  },
  subBadge: {
    marginTop: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  subText: {
    fontFamily: 'DMSans_700Bold',
    color: colors.bg,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
