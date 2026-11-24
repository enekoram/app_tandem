import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { colors, sizes } from '@/theme';
import { Icon, type IconName } from './icons';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: IconName;
  /** Obligatoria: es lo que lee VoiceOver. */
  accessibilityLabel: string;
  /** `primary` = círculo negro 48 («Nueva tarea»); `soft` = perfil, 44 con borde. */
  variant?: 'primary' | 'soft';
}

export function IconButton({ icon, variant = 'soft', ...rest }: IconButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.soft,
        pressed && styles.pressed,
      ]}
      {...rest}
    >
      <Icon
        name={icon}
        size={primary ? sizes.icon.nav : sizes.icon.header}
        strokeWidth={1.8}
        color={primary ? colors.action.onPrimary : colors.text.secondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flex: 0 },
  primary: {
    width: sizes.iconButton.large,
    height: sizes.iconButton.large,
    borderRadius: sizes.iconButton.large / 2,
    backgroundColor: colors.action.primary,
  },
  soft: {
    width: sizes.profileButton,
    height: sizes.profileButton,
    borderRadius: sizes.profileButton / 2,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.control,
  },
  pressed: { opacity: 0.8 },
});
