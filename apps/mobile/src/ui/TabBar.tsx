import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { es } from '@/strings/es';
import { borders, colors, radii, sizes, spacing } from '@/theme';
import { Icon, type IconName } from './icons';
import { Text } from './Text';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: es.tabs.today, icon: 'today' },
  tareas: { label: es.tabs.tasks, icon: 'tasks' },
  sesiones: { label: es.tabs.sessions, icon: 'sessions' },
  acompano: { label: es.tabs.companion, icon: 'companion' },
};

/** Barra flotante del kit: 72 de alto, radio 36, sobre el contenido. */
export function TabBar({ state, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={es.tabs.a11yLabel}
      style={[
        styles.bar,
        {
          left: sizes.tabBarInset.horizontal + insets.left,
          right: sizes.tabBarInset.horizontal + insets.right,
          bottom: Math.max(insets.bottom, sizes.tabBarInset.bottom),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const selected = state.index === index;
        const color = selected ? colors.text.primary : colors.text.secondary;
        const onPress = () => {
          if (!selected) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            onPress={onPress}
            style={styles.item}
          >
            <Icon name={tab.icon} color={color} />
            <Text variant="nav" color={color} maxFontSizeMultiplier={1.3}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    height: sizes.tabBar.height,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.floatingNav,
    backgroundColor: colors.bg.surface,
    borderWidth: borders.hairline,
    borderColor: colors.border.subtle,
    flexDirection: 'row',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xxs },
});
