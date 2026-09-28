import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TipsterCard } from '@/components/TipsterCard';
import { Chip, Screen, SectionLabel, Subtitle, Title } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useEdge } from '@/lib/store';

type SortMode = 'winpct' | 'subscribers' | 'price';

export default function TipstersScreen() {
  const { tipstersRanked, subscribedTipsterIds, currentUser } = useEdge();
  const [sort, setSort] = useState<SortMode>('winpct');

  const ranked = useMemo(() => {
    const list = tipstersRanked.filter((t) => t.id !== currentUser.id);
    if (sort === 'subscribers') {
      return [...list].sort((a, b) => b.subscriberCount - a.subscriberCount);
    }
    if (sort === 'price') {
      return [...list].sort((a, b) => a.monthlyPriceCents - b.monthlyPriceCents);
    }
    return list;
  }, [tipstersRanked, sort, currentUser.id]);

  return (
    <Screen>
      <Title>TIPSTERS</Title>
      <Subtitle>
        Follow people with receipts. Subscribe to unlock their private card.
      </Subtitle>

      <SectionLabel>Sort by</SectionLabel>
      <View style={styles.wrap}>
        <Chip label="Win %" active={sort === 'winpct'} onPress={() => setSort('winpct')} />
        <Chip
          label="Subscribers"
          active={sort === 'subscribers'}
          onPress={() => setSort('subscribers')}
        />
        <Chip label="Price" active={sort === 'price'} onPress={() => setSort('price')} />
      </View>

      <SectionLabel>Leaderboard</SectionLabel>
      {ranked.map((t) => (
        <TipsterCard
          key={t.id}
          tipster={t}
          stats={t.stats}
          subscribed={subscribedTipsterIds.has(t.id)}
        />
      ))}

      <Text style={styles.note}>
        Rankings use settled picks only (pushes ignored for win %). Public
        history stays visible even without a subscription.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  note: {
    marginTop: 16,
    fontFamily: 'DMSans_400Regular',
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
  },
});
