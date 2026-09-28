import React, { useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import {
  Chip,
  PrimaryButton,
  Screen,
  SectionLabel,
  Subtitle,
  Title,
} from '@/components/ui';
import { colors, radii, spacing } from '@/constants/theme';
import { useEdge } from '@/lib/store';
import { MARKETS, SPORTS, type PickMarket, type Sport } from '@/lib/types';

export default function CreatePickScreen() {
  const { createPick } = useEdge();
  const [sport, setSport] = useState<Sport>('NFL');
  const [market, setMarket] = useState<PickMarket>('spread');
  const [event, setEvent] = useState('');
  const [selection, setSelection] = useState('');
  const [odds, setOdds] = useState('-110');
  const [units, setUnits] = useState('1');
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const valid = useMemo(() => {
    const oddsN = Number(odds);
    const unitsN = Number(units);
    return (
      event.trim().length > 2 &&
      selection.trim().length > 1 &&
      Number.isFinite(oddsN) &&
      oddsN !== 0 &&
      Number.isFinite(unitsN) &&
      unitsN > 0
    );
  }, [event, selection, odds, units]);

  const onSubmit = () => {
    if (!valid) {
      Alert.alert('Missing details', 'Fill in event, selection, odds, and units.');
      return;
    }
    createPick({
      sport,
      market,
      event: event.trim(),
      selection: selection.trim(),
      oddsAmerican: Number(odds),
      units: Number(units),
      notes: notes.trim() || undefined,
      isPublic,
    });
    setEvent('');
    setSelection('');
    setNotes('');
    setOdds('-110');
    setUnits('1');
    Alert.alert('Pick logged', 'It shows on your track record as pending.');
    router.push('/');
  };

  return (
    <Screen>
      <Title>NEW PICK</Title>
      <Subtitle>Log a lean. Settle it after the game. Your win % updates live.</Subtitle>

      <SectionLabel>Sport</SectionLabel>
      <View style={styles.wrap}>
        {SPORTS.map((s) => (
          <Chip key={s} label={s} active={sport === s} onPress={() => setSport(s)} />
        ))}
      </View>

      <SectionLabel>Market</SectionLabel>
      <View style={styles.wrap}>
        {MARKETS.map((m) => (
          <Chip
            key={m.id}
            label={m.label}
            active={market === m.id}
            onPress={() => setMarket(m.id)}
          />
        ))}
      </View>

      <SectionLabel>Event</SectionLabel>
      <TextInput
        style={styles.input}
        placeholder="Chiefs vs Bills"
        placeholderTextColor={colors.textDim}
        value={event}
        onChangeText={setEvent}
      />

      <SectionLabel>Selection</SectionLabel>
      <TextInput
        style={styles.input}
        placeholder="Bills -2.5"
        placeholderTextColor={colors.textDim}
        value={selection}
        onChangeText={setSelection}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <SectionLabel>Odds</SectionLabel>
          <TextInput
            style={styles.input}
            placeholder="-110"
            placeholderTextColor={colors.textDim}
            keyboardType="numbers-and-punctuation"
            value={odds}
            onChangeText={setOdds}
          />
        </View>
        <View style={{ width: 16 }} />
        <View style={{ flex: 1 }}>
          <SectionLabel>Units</SectionLabel>
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor={colors.textDim}
            keyboardType="decimal-pad"
            value={units}
            onChangeText={setUnits}
          />
        </View>
      </View>

      <SectionLabel>Notes (optional)</SectionLabel>
      <TextInput
        style={[styles.input, styles.notes]}
        placeholder="Why this side?"
        placeholderTextColor={colors.textDim}
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      <View style={styles.publicRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.publicTitle}>Free / public pick</Text>
          <Text style={styles.publicSub}>
            Off = subscribers only. Use free picks to prove your record.
          </Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: colors.line, true: colors.accentDark }}
          thumbColor={isPublic ? colors.accent : colors.textMuted}
        />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <PrimaryButton label="Post pick" onPress={onSubmit} disabled={!valid} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    color: colors.text,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notes: { minHeight: 88, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  publicTitle: {
    fontFamily: 'DMSans_700Bold',
    color: colors.text,
    fontSize: 14,
  },
  publicSub: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
});
