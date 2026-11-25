import { Stack } from 'expo-router';
import { colors } from '@/theme';

/** Pila de la pestaña Acompaño: sus subpantallas mantienen la barra de pestañas. */
export default function CompanionStackLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg.ground } }}
    />
  );
}
