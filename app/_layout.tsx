import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { I18nManager } from 'react-native';
import { useEffect } from 'react';
import { theme } from '../src/components/ui/theme';

export default function RootLayout() {
  useEffect(() => {
    if (!I18nManager.isRTL) I18nManager.forceRTL(true);
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="summary" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
