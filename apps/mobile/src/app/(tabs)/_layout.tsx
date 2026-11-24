import { Tabs } from 'expo-router';
import { useMeControllerMe } from '@tandems/api-client';
import { colors } from '@/theme';
import { TabBar } from '@/ui';

export default function TabsLayout() {
  // Al entrar se pide el perfil: la API lo crea la primera vez (ver MeController)
  useMeControllerMe();
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
