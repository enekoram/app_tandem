import { Tabs } from 'expo-router';
import { colors } from '@/theme';
import { TabBar } from '@/ui';

export default function TabsLayout() {
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
