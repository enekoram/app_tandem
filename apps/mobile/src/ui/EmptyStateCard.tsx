import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import type { Emphasis } from '@/strings/es';
import { colors, gradients, radii, sizes } from '@/theme';
import { Icon, type IconName } from './icons';
import { EmphasisText, Text } from './Text';

export interface EmptyStateCardProps {
  icon: IconName;
  title: Emphasis;
  body: string;
  /** Botones (Button) en columna. */
  actions?: ReactNode;
}

/** Tarjeta de estado vacío: mancha con degradado + icono, título con énfasis, texto y CTAs. */
export function EmptyStateCard({ icon, title, body, actions }: EmptyStateCardProps) {
  const [g0, g1, g2] = gradients.energy;
  return (
    <View style={styles.card}>
      <View
        style={styles.blob}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Svg
          width={e.illustration.width}
          height={e.illustration.height}
          viewBox="0 0 132 124"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id="blob" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={g0} />
              <Stop offset="0.5" stopColor={g1} />
              <Stop offset="1" stopColor={g2} />
            </LinearGradient>
          </Defs>
          <Path
            fill="url(#blob)"
            d="M66 8C96 6 124 28 126 60C128 94 100 118 66 116C32 118 6 96 6 62C6 30 34 10 66 8Z"
          />
        </Svg>
        <Icon
          name={icon}
          size={sizes.icon.illustration}
          color={colors.bg.ground}
          strokeWidth={1.8}
        />
      </View>
      <EmphasisText text={title} variant="title" accessibilityRole="header" style={styles.center} />
      <Text variant="body" color={colors.text.secondary} style={[styles.center, styles.body]}>
        {body}
      </Text>
      {actions && <View style={styles.actions}>{actions}</View>}
    </View>
  );
}

const e = sizes.emptyCard;
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.sheet,
    paddingTop: e.paddingTop,
    paddingHorizontal: e.paddingHorizontal,
    paddingBottom: e.paddingBottom,
    gap: e.gap,
    alignItems: 'center',
  },
  blob: { ...e.illustration, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  body: { maxWidth: e.textMaxWidth },
  actions: { alignSelf: 'stretch', gap: e.gap, marginTop: e.gap },
});
