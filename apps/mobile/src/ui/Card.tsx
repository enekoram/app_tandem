import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { PersonColorId } from '@/theme';
import { borders, colors, radii, sizes, spacing } from '@/theme';
import { usePersonStyle } from './person';

export interface CardProps extends ViewProps {
  /** Filo izquierdo con el degradado de la persona (deep → base → soft). */
  person?: PersonColorId;
  /** Filo con otros colores (p. ej. gris de «sin acompañante»). */
  edge?: readonly [string, string, string];
  children: ReactNode;
}

/** Tarjeta del kit: radio 20, borde 1, superficie; con filo de persona si se indica. */
export function Card({ person, edge, children, style, ...rest }: CardProps) {
  const personStyle = usePersonStyle(person);
  const edgeColors = personStyle?.edge ?? edge;
  return (
    <View style={[styles.card, edgeColors && styles.withEdge, style]} {...rest}>
      {edgeColors && (
        <LinearGradient
          colors={edgeColors}
          locations={[0, 0.45, 1]}
          style={styles.edge}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderWidth: borders.hairline,
    borderColor: colors.border.subtle,
    borderRadius: radii.card,
    overflow: 'hidden',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  withEdge: { paddingLeft: spacing.xl + sizes.cardEdge.width - 1 },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: sizes.cardEdge.width },
});
