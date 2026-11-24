import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { EBGaramond_500Medium, EBGaramond_500Medium_Italic } from '@expo-google-fonts/eb-garamond';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import '@/lib/api';
import { colors, fontFamilies } from '@/theme';
import { ToastProvider } from '@/ui';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [loaded, error] = useFonts({
    [fontFamilies.serif]: EBGaramond_500Medium,
    [fontFamilies.serifItalic]: EBGaramond_500Medium_Italic,
    [fontFamilies.sans]: PlusJakartaSans_500Medium,
    [fontFamilies.sansSemiBold]: PlusJakartaSans_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg.ground },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="perfil" options={{ presentation: 'modal' }} />
          </Stack>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
