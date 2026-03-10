// Root layout — wraps entire app with dark theme
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { COLORS } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="scripts/generator" options={{ presentation: 'card' }} />
        <Stack.Screen name="scripts/detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="keywords" options={{ presentation: 'card' }} />
        <Stack.Screen name="thumbnail" options={{ presentation: 'card' }} />
        <Stack.Screen name="scheduler" options={{ presentation: 'card' }} />
        <Stack.Screen name="editor" options={{ presentation: 'card' }} />
        <Stack.Screen name="brand" options={{ presentation: 'card' }} />
        <Stack.Screen name="gallery" options={{ presentation: 'card' }} />
        <Stack.Screen name="voice" options={{ presentation: 'card' }} />
      </Stack>
    </View>
  );
}
