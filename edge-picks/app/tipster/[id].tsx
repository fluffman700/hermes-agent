import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { PickCard, StatHero } from '@/components/PickCard';
import {
  Avatar,
  PrimaryButton,
  Screen,
  SectionLabel,
  Subtitle,
} from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { formatCents, formatWinPct } from '@/lib/stats';
import { useEdge } from '@/lib/store';

export default function TipsterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    state,
    currentUser,
    subscribedTipsterIds,
    picksForTipster,
    statsForTipster,
    canViewPick,
    subscribeToTipster,
    cancelSubscription,
  } = useEdge();

  const tipster = state.users.find((u) => u.id === id);
  const stats = useMemo(
    () => (id ? statsForTipster(id) : statsForTipster('')),
    [id, statsForTipster],
  );
  const picks = useMemo(
    () => (id ? picksForTipster(id) : []),
    [id, picksForTipster],
  );

  if (!tipster) {
    return (
      <Screen>
        <Text style={styles.missing}>Tipster not found.</Text>
      </Screen>
    );
  }

  const isSelf = tipster.id === currentUser.id;
  const subscribed = subscribedTipsterIds.has(tipster.id);
  const record = `${stats.wins}-${stats.losses}${
    stats.pushes ? `-${stats.pushes}` : ''
  }`;

  const onSubscribe = () => {
    const res = subscribeToTipster(tipster.id);
    if (!res.ok) {
      Alert.alert('Could not subscribe', res.error ?? 'Unknown error');
      return;
    }
    Alert.alert(
      'Subscribed',
      `You're in for ${formatCents(tipster.monthlyPriceCents)}/mo. Private picks unlocked.`,
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar name={tipster.displayName} color={tipster.avatarColor} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>
            {tipster.displayName}
            {tipster.verified ? ' ✓' : ''}
          </Text>
          <Text style={styles.handle}>@{tipster.handle}</Text>
          <Subtitle>{tipster.bio}</Subtitle>
        </View>
      </View>

      <StatHero
        winPct={formatWinPct(stats.winPct)}
        record={`${record} · ${tipster.subscriberCount} subscribers`}
        unitsNet={stats.unitsNet}
        streak={stats.streak}
      />

      {!isSelf ? (
        <View style={{ marginTop: spacing.md }}>
          {subscribed ? (
            <PrimaryButton
              label="Cancel subscription"
              tone="muted"
              onPress={() => {
                cancelSubscription(tipster.id);
                Alert.alert('Canceled', 'Subscription ended.');
              }}
            />
          ) : (
            <PrimaryButton
              label={`Subscribe · ${formatCents(tipster.monthlyPriceCents)}/mo`}
              onPress={onSubscribe}
            />
          )}
        </View>
      ) : (
        <Text style={styles.selfNote}>This is your public tipster profile.</Text>
      )}

      <SectionLabel>Track record</SectionLabel>
      {picks.map((pick) => {
        const locked = !canViewPick(pick);
        return <PickCard key={pick.id} pick={pick} locked={locked} />;
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  name: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 34,
    color: colors.text,
    letterSpacing: 0.5,
  },
  handle: {
    fontFamily: 'DMSans_500Medium',
    color: colors.accent,
    fontSize: 14,
    marginBottom: 4,
  },
  missing: {
    color: colors.textMuted,
    fontFamily: 'DMSans_400Regular',
    marginTop: 40,
  },
  selfNote: {
    marginTop: spacing.md,
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
  },
});
