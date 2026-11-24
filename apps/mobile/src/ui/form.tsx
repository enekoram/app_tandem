import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borders, colors, MIN_TOUCH_TARGET, radii, sizes, spacing } from '@/theme';
import { Icon } from './icons';
import { Text } from './Text';

/** Casilla del kit (26, radio 8). Toda la fila es pulsable; el error se anuncia. */
export function Checkbox({
  label,
  checked,
  onChange,
  error,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  error?: string | null;
}) {
  return (
    <View style={styles.checkWrap}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        accessibilityHint={error ?? undefined}
        onPress={() => onChange(!checked)}
        style={styles.checkRow}
      >
        <View
          style={[
            styles.box,
            checked && styles.boxChecked,
            error && !checked ? styles.boxError : null,
          ]}
        >
          {checked && (
            <Icon
              name="check"
              size={sizes.checkbox.icon}
              color={colors.action.onPrimary}
              strokeWidth={2.4}
            />
          )}
        </View>
        <Text variant="body" color={colors.text.caption} style={styles.flex}>
          {label}
        </Text>
      </Pressable>
      {error && !checked ? (
        <View style={styles.errorRow}>
          <Icon
            name="alert"
            size={sizes.icon.inline}
            color={colors.field.errorText}
            strokeWidth={2}
          />
          <Text variant="label" color={colors.field.errorText} style={styles.flex}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Aviso de error arriba del formulario (rojo teja suave, como el toast err). */
export function FormAlert({ title, body }: { title: string; body?: string }) {
  const c = colors.toast.err;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.alert, { backgroundColor: c.bg, borderColor: c.border }]}
    >
      <Icon name="alert" size={sizes.icon.header} color={c.text} strokeWidth={1.8} />
      <View style={styles.flex}>
        <Text variant="bodyStrong" color={c.text}>
          {title}
        </Text>
        {body ? (
          <Text variant="body" color={c.text}>
            {body}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** «‹ Iniciar sesión»: vuelta atrás con texto, arriba a la izquierda. */
export function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={spacing.sm}
      style={styles.back}
    >
      <Icon name="back" size={sizes.icon.back} color={colors.text.primary} strokeWidth={2} />
      <Text variant="bodyStrong" color={colors.text.primary}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Puntos de progreso del onboarding (activo 18×6, resto 6×6). */
export function StepDots({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={styles.dots}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i === step && styles.dotOn]} />
      ))}
    </View>
  );
}

/**
 * Contenedor de las pantallas de acceso: fondo ground, desplazable, evita el teclado y
 * deja la barra superior (BackLink) fija.
 */
export function AuthLayout({ top, children }: { top?: ReactNode; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.top}>{top}</View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl + insets.bottom }]}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.ground },
  top: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, gap: spacing.xl },
  flex: { flex: 1 },
  checkWrap: { gap: spacing.sm },
  checkRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    padding: spacing.xxs,
    minHeight: MIN_TOUCH_TARGET,
  },
  box: {
    width: sizes.checkbox.size,
    height: sizes.checkbox.size,
    borderRadius: sizes.checkbox.radius,
    borderWidth: borders.pending,
    borderColor: colors.field.checkbox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.action.primary, borderColor: colors.action.primary },
  boxError: { borderColor: colors.field.borderError },
  errorRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.xxs },
  alert: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.card,
    borderWidth: borders.hairline,
  },
  back: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingRight: spacing.md,
  },
  dots: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  dot: {
    width: sizes.stepDot.size,
    height: sizes.stepDot.size,
    borderRadius: sizes.stepDot.size / 2,
    backgroundColor: colors.carousel.dotInactive,
  },
  dotOn: { width: sizes.stepDot.activeWidth, backgroundColor: colors.carousel.dotActive },
});
