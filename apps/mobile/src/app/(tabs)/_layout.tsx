import { useEffect } from 'react';
import { router, Tabs } from 'expo-router';
import { useMeControllerMe } from '@tandems/api-client';
import { prefs } from '@/lib/prefs';
import { colors, durations } from '@/theme';
import { TabBar } from '@/ui';

export default function TabsLayout() {
  // Al entrar se pide el perfil: la API lo crea la primera vez (ver MeController)
  useMeControllerMe();

  // Invitación abierta antes de iniciar sesión: se retoma al entrar
  // (tras iniciar sesión la navegación cambia de pila: se espera a que termine la transición)
  useEffect(() => {
    const token = prefs.pendingInvite();
    if (!token) return;
    const timer = setTimeout(() => {
      void prefs.clearPendingInvite();
      router.push({ pathname: '/invitacion', params: { token } });
    }, durations.slow);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg.ground } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tareas" />
      <Tabs.Screen name="sesiones" />
      <Tabs.Screen name="acompano" />
    </Tabs>
  );
}
