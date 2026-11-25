import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { borders, colors, radii, sizes, spacing } from '@/theme';
import { Icon, type IconName } from './icons';
import { Text } from './Text';

/** Tarjeta que agrupa filas con separadores finos (canvas: .card + .lr). */
export function ListCard({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.card}>
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 && <View style={styles.separator} />}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Avatar u otro elemento a la izquierda. */
  leading?: ReactNode;
  icon?: IconName;
  /** Icono pequeño antes del subtítulo (p. ej. «aceptado»). */
  subtitleIcon?: IconName;
  subtitleIconColor?: string;
  /** Fila roja de acción destructiva (Eliminar contacto, Cancelar invitación). */
  destructive?: boolean;
  onPress?: () => void;
  /** Lo que lee VoiceOver si difiere del título + subtítulo. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/** Fila de lista: mín. 60 de alto, toda pulsable, con flecha si lleva a otra pantalla. */
export function ListRow({
  title,
  subtitle,
  leading,
  icon,
  subtitleIcon,
  subtitleIconColor = colors.status.liveText,
  destructive = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: ListRowProps) {
  const color = destructive ? colors.action.destructive : colors.text.primary;
  const content = (
    <>
      {leading}
      {icon && <Icon name={icon} color={destructive ? color : colors.text.secondary} />}
      <View style={styles.texts}>
        <Text variant="bodyStrong" color={color}>
          {title}
        </Text>
        {subtitle ? (
          <View style={styles.subtitle}>
            {subtitleIcon && (
              <Icon
                name={subtitleIcon}
                size={sizes.icon.inline}
                color={subtitleIconColor}
                strokeWidth={2}
              />
            )}
            <Text variant="label" color={colors.text.secondary} style={styles.flex}>
              {subtitle}
            </Text>
          </View>
        ) : null}
      </View>
      {onPress && !destructive && (
        <Icon name="chevron" size={sizes.icon.header} color={colors.text.secondary} />
      )}
    </>
  );
  if (!onPress) {
    return (
      <View
        style={styles.row}
        accessible
        accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderWidth: borders.hairline,
    borderColor: colors.border.subtle,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  separator: { height: borders.hairline, backgroundColor: colors.border.subtle },
  row: {
    minHeight: sizes.listRow.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  pressed: { backgroundColor: colors.bg.ground },
  texts: { flex: 1, minWidth: 0, gap: spacing.xxs / 2 },
  subtitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  flex: { flex: 1 },
});
