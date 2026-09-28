import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';

import { colors } from '@/constants/theme';

function TabGlyph({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.glyph, { borderColor: color }]}>
      <Text style={[styles.glyphText, { color }]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.line,
          height: 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 11,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Edge',
          tabBarIcon: ({ color }) => (
            <TabGlyph label="01" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'New Pick',
          tabBarIcon: ({ color }) => (
            <TabGlyph label="+" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="tipsters"
        options={{
          title: 'Tipsters',
          tabBarIcon: ({ color }) => (
            <TabGlyph label="%" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="earn"
        options={{
          title: 'Earn',
          tabBarIcon: ({ color }) => (
            <TabGlyph label="$" color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  glyph: {
    minWidth: 28,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  glyphText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
  },
});
