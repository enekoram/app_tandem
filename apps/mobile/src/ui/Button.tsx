import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { borders, colors, MIN_TOUCH_TARGET, radii, sizes, spacing } from '@/theme';
import { Icon, type IconName } from './icons';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'destructive';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  icon?: IconName;
}

/** Botón del UI kit: h 52, radio 18, 16/600. `link` = enlace subrayado («Deshacer»). */
export function Button({ label, variant = 'primary', icon, disabled, ...rest }: ButtonProps) {
  const fg =
    variant === 'primary' || variant === 'destructive'
      ? colors.action.onPrimary
      : colors.text.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={variant === 'link' ? 8 : undefined}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      {...rest}
    >
      <View style={styles.row}>
        {icon && <Icon name={icon} size={sizes.icon.button} color={fg} strokeWidth={1.8} />}
        <Text
          variant="bodyStrong"
          color={disabled ? colors.text.inactive : fg}
          style={variant === 'link' ? styles.linkText : undefined}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.button.height,
    borderRadius: radii.button,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primary: { backgroundColor: colors.action.primary },
  destructive: { backgroundColor: colors.action.destructive },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: borders.pending,
    borderColor: colors.action.primary,
  },
  ghost: { backgroundColor: 'transparent' },
  link: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    alignSelf: 'center',
  },
  linkText: { textDecorationLine: 'underline' },
  disabled: {
    backgroundColor: 'transparent',
    borderWidth: borders.pending,
    borderStyle: 'dashed',
    borderColor: colors.border.pending,
  },
  pressed: { opacity: 0.85 },
});
