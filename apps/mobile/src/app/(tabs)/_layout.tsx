import { router, Tabs } from 'expo-router';
import { useMeControllerMe } from '@tandems/api-client';
import { useEffect } from 'react';
import { useContactsControllerList } from '@tandems/api-client';
import { prefs } from '@/lib/prefs';
import { onRealtime, useRealtime } from '@/lib/realtime';
import { es } from '@/strings/es';
import { useResumeInvite } from '@/lib/useResumeInvite';
import { colors, durations } from '@/theme';
import { TabBar, useToast } from '@/ui';

export default function TabsLayout() {
  // Al entrar se pide el perfil: la API lo crea la primera vez (ver MeController)
  useMeControllerMe();

  useResumeInvite();
  // Mientras hay sesión: avisos en tiempo real y presencia («está contigo»)
  useRealtime();

  // PermisoNotificaciones, una sola vez (después de retomar una invitación, si la hay)
  useEffect(() => {
    if (prefs.pushAsked() || prefs.pendingInvite()) return;
    const timer = setTimeout(() => router.push('/avisos'), durations.slow * 3);
    return () => clearTimeout(timer);
  }, []);

  // «Juan pensó en ti»: aviso efímero, sin contenido (doc 03 · toasts)
  const toast = useToast();
  const contacts = useContactsControllerList();
  const list = contacts.data?.status === 200 ? contacts.data.data : [];
  useEffect(
    () =>
      onRealtime((e) => {
        if (e.type !== 'thinking') return;
        const name = list.find((c) => c.id === e.contactId)?.name;
        if (name) toast(es.support.thinking.received(name), { kind: 'ok' });
      }),
    [list, toast],
  );

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
