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
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 11,
          marginTop: 2,
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
          href: '/create',
          tabBarIcon: ({ color }) => (
            <TabGlyph label="+" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="tipsters"
        options={{
          title: 'Tipsters',
          href: '/tipsters',
          tabBarIcon: ({ color }) => (
            <TabGlyph label="%" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="earn"
        options={{
          title: 'Earn',
          href: '/earn',
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
