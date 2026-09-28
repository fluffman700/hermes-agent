import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PickCard, StatHero } from '@/components/PickCard';
import { Avatar, Screen, SectionLabel, Subtitle, Title } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { formatWinPct } from '@/lib/stats';
import { useEdge } from '@/lib/store';

export default function HomeScreen() {
  const { ready, currentUser, myPicks, myStats, settlePick } = useEdge();

  if (!ready) {
    return (
      <Screen>
        <Text style={styles.loading}>Loading…</Text>
      </Screen>
    );
  }

  const record = `${myStats.wins}-${myStats.losses}${
    myStats.pushes ? `-${myStats.pushes}` : ''
  }`;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Title>EDGEPICKS</Title>
          <Subtitle>Track your card. Prove the edge. Get paid for it.</Subtitle>
        </View>
        <Avatar name={currentUser.displayName} color={currentUser.avatarColor} size={52} />
      </View>

      <StatHero
        winPct={formatWinPct(myStats.winPct)}
        record={`${record} settled`}
        unitsNet={myStats.unitsNet}
        streak={myStats.streak}
      />

      <SectionLabel>Your recent picks</SectionLabel>
      {myPicks.length === 0 ? (
        <Text style={styles.empty}>No picks yet — drop your first lean.</Text>
      ) : (
        myPicks.map((pick) => (
          <PickCard
            key={pick.id}
            pick={pick}
            onSettle={
              pick.result === 'pending'
                ? (result) => settlePick(pick.id, result)
                : undefined
            }
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  loading: {
    color: colors.textMuted,
    fontFamily: 'DMSans_400Regular',
    marginTop: 40,
  },
  empty: {
    color: colors.textMuted,
    fontFamily: 'DMSans_400Regular',
    marginTop: 8,
  },
});
