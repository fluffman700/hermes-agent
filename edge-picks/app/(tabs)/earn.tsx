import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  Chip,
  PrimaryButton,
  Screen,
  SectionLabel,
  Subtitle,
  Title,
} from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { formatCents, platformFeeRate } from '@/lib/stats';
import { useEdge } from '@/lib/store';

const PRICE_OPTIONS = [999, 1499, 1999, 2499, 2999, 4999];

export default function EarnScreen() {
  const {
    currentUser,
    earningsForCurrentUser,
    updateTipsterPrice,
    mySubscriptions,
    tipstersRanked,
    cancelSubscription,
    resetDemo,
  } = useEdge();

  const earnings = earningsForCurrentUser();
  const [price, setPrice] = useState(currentUser.monthlyPriceCents);
  const feePct = Math.round(platformFeeRate() * 100);

  const subscribedTipsters = useMemo(() => {
    return mySubscriptions
      .map((s) => tipstersRanked.find((t) => t.id === s.tipsterId))
      .filter(Boolean);
  }, [mySubscriptions, tipstersRanked]);

  return (
    <Screen>
      <Title>EARN</Title>
      <Subtitle>
        Sell access to your private picks. High win rate + transparent track
        record = subscribers.
      </Subtitle>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.kicker}>Creator dashboard</Text>
        <Text style={styles.big}>{formatCents(earnings.takeHomeMrrCents)}</Text>
        <Text style={styles.sub}>
          estimated take-home / month after {feePct}% platform fee
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{earnings.activeSubscribers}</Text>
            <Text style={styles.statLab}>Subscribers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatCents(earnings.mrrCents)}</Text>
            <Text style={styles.statLab}>Gross MRR</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{formatCents(earnings.priceCents)}</Text>
            <Text style={styles.statLab}>Your price</Text>
          </View>
        </View>
      </Card>

      <SectionLabel>Set subscription price</SectionLabel>
      <View style={styles.wrap}>
        {PRICE_OPTIONS.map((c) => (
          <Chip
            key={c}
            label={`${formatCents(c)}/mo`}
            active={price === c}
            onPress={() => setPrice(c)}
          />
        ))}
      </View>
      <PrimaryButton
        label="Save price"
        onPress={() => {
          updateTipsterPrice(price);
          Alert.alert('Price updated', `New rate: ${formatCents(price)}/mo`);
        }}
      />

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.howTitle}>How tipsters make money</Text>
        <Text style={styles.howBody}>
          1. Post picks and settle them honestly{'\n'}
          2. Keep some picks free so followers can verify your win %{'\n'}
          3. Lock the rest behind a monthly subscription{'\n'}
          4. You keep {100 - feePct}% of every paid sub (demo — Stripe later)
        </Text>
      </Card>

      <SectionLabel>Your subscriptions</SectionLabel>
      {subscribedTipsters.length === 0 ? (
        <Text style={styles.empty}>You are not paying any tipsters yet.</Text>
      ) : (
        subscribedTipsters.map((t) =>
          t ? (
            <Card key={t.id} style={{ marginBottom: 8 }}>
              <Text style={styles.subName}>{t.displayName}</Text>
              <Text style={styles.subMeta}>
                {formatCents(t.monthlyPriceCents)}/mo · @{t.handle}
              </Text>
              <View style={{ marginTop: 10 }}>
                <PrimaryButton
                  label="Cancel"
                  tone="muted"
                  onPress={() => {
                    cancelSubscription(t.id);
                    Alert.alert('Canceled', `Unsubscribed from ${t.displayName}`);
                  }}
                />
              </View>
            </Card>
          ) : null,
        )
      )}

      <View style={{ marginTop: spacing.xl }}>
        <PrimaryButton
          label="Reset demo data"
          tone="danger"
          onPress={() => {
            Alert.alert('Reset demo?', 'This restores seed picks and subscriptions.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset',
                style: 'destructive',
                onPress: () => void resetDemo(),
              },
            ]);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: 'DMSans_500Medium',
    color: colors.textDim,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  big: {
    fontFamily: 'BebasNeue_400Regular',
    color: colors.accent,
    fontSize: 56,
    lineHeight: 60,
    marginTop: 6,
  },
  sub: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: 8,
  },
  stat: { flex: 1 },
  statVal: {
    fontFamily: 'BebasNeue_400Regular',
    color: colors.text,
    fontSize: 24,
  },
  statLab: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textDim,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  howTitle: {
    fontFamily: 'DMSans_700Bold',
    color: colors.text,
    fontSize: 15,
    marginBottom: 8,
  },
  howBody: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  empty: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
  },
  subName: {
    fontFamily: 'DMSans_700Bold',
    color: colors.text,
    fontSize: 16,
  },
  subMeta: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
    marginTop: 2,
  },
});
