import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Emphasis } from '@/strings/es';
import { colors, sizes, spacing } from '@/theme';
import { BackLink } from './form';
import { EmphasisText, Text } from './Text';

export interface ScreenProps {
  caption?: string;
  title: Emphasis;
  /** Botón a la derecha del título (perfil, nueva tarea…). */
  action?: ReactNode;
  /** `tab` = titular 52 de pestaña; `inner` = 30 de pantalla interior (sin barra de pestañas). */
  kind?: 'tab' | 'inner';
  /** «‹ Mi perfil»: vuelta atrás con texto (pantallas interiores). */
  back?: { label: string; onPress: () => void };
  /** Pantalla interior que vive dentro de una pestaña: deja sitio a la barra flotante. */
  underTabBar?: boolean;
  children: ReactNode;
}

/** Pantalla con cabecera fija (caption + titular) y contenido desplazable que se funde bajo la barra. */
export function Screen({
  caption,
  title,
  action,
  kind = 'tab',
  back,
  underTabBar = false,
  children,
}: ScreenProps) {
  const tab = kind === 'tab';
  const floatingBar = tab || underTabBar;
  const insets = useSafeAreaInsets();
  const t = sizes.screenTitle;
  const c = sizes.screenContent;
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {back && (
        <View style={styles.backRow}>
          <BackLink label={back.label} onPress={back.onPress} />
        </View>
      )}
      <View
        style={[
          styles.header,
          {
            minHeight: tab ? t.height : undefined,
            paddingTop: t.paddingTop,
            paddingHorizontal: t.paddingHorizontal,
            paddingBottom: t.paddingBottom,
          },
        ]}
      >
        <View style={[styles.titles, { gap: t.gap }]}>
          {caption && (
            <Text variant="caption" color={colors.text.caption}>
              {caption}
            </Text>
          )}
          <EmphasisText
            text={title}
            variant={kind === 'tab' ? 'display' : 'title'}
            accessibilityRole="header"
            maxFontSizeMultiplier={1.4}
          />
        </View>
        {action}
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: c.paddingHorizontal,
          paddingTop: c.paddingTop,
          paddingBottom: (floatingBar ? c.paddingBottom : spacing.xxl) + insets.bottom,
          gap: c.gap,
        }}
      >
        {children}
      </ScrollView>
      {floatingBar && (
        <LinearGradient
          pointerEvents="none"
          colors={[colors.bg.groundTransparent, colors.bg.ground]}
          locations={[0, 0.58]}
          style={[styles.fade, { height: sizes.navFade.height + insets.bottom }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.ground },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.bg.ground,
  },
  titles: { flex: 1, flexShrink: 1 },
  backRow: { paddingHorizontal: spacing.sm },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
