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
import { authClient } from '@/lib/auth';
import { colors, fontFamilies } from '@/theme';
import { ToastProvider } from '@/ui';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const { data: session, isPending } = authClient.useSession();
  const [fontsLoaded, fontsError] = useFonts({
    [fontFamilies.serif]: EBGaramond_500Medium,
    [fontFamilies.serifItalic]: EBGaramond_500Medium_Italic,
    [fontFamilies.sans]: PlusJakartaSans_500Medium,
    [fontFamilies.sansSemiBold]: PlusJakartaSans_600SemiBold,
  });
  const ready = (fontsLoaded || !!fontsError) && !isPending;
  const signedIn = !!session;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Al cerrar sesión, fuera los datos de la persona anterior
  useEffect(() => {
    if (!signedIn) queryClient.clear();
  }, [signedIn, queryClient]);

  if (!ready) return null;

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
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="perfil" />
              <Stack.Screen name="contactos/index" />
              <Stack.Screen name="contactos/[id]" />
              <Stack.Screen name="contactos/nuevo" options={{ presentation: 'modal' }} />
              <Stack.Screen name="tarea/nueva" options={{ presentation: 'modal' }} />
              <Stack.Screen name="tarea/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="tarea/[id]/acompanante" options={{ presentation: 'modal' }} />
              <Stack.Screen name="tarea/terminada" options={{ gestureEnabled: false }} />
              <Stack.Screen name="tarea/terminadas" />
              <Stack.Screen name="acompano/tareas" />
              <Stack.Screen name="acompano/terminadas" />
            </Stack.Protected>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
            {/* Enlace de invitación: con o sin sesión */}
            <Stack.Screen name="invitacion" />
          </Stack>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
