import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Emphasis } from '@/strings/es';
import { es } from '@/strings/es';
import { colors, durations, MIN_TOUCH_TARGET, radii, shadows, sizes, spacing } from '@/theme';
import { Button } from './Button';
import { Icon, type IconName } from './icons';
import { EmphasisText, Text } from './Text';

export interface ConfirmSheetProps {
  visible: boolean;
  title: Emphasis;
  body: string;
  confirmLabel: string;
  confirmIcon?: IconName;
  cancelLabel: string;
  /** Rojo para acciones que borran algo; principal (negro) para el resto. */
  destructive?: boolean;
  /** Tercera salida entre confirmar y volver (p. ej. «Proponer otra hora»). */
  alternative?: { label: string; onPress: () => void };
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Hoja de confirmación (canvas: .dlg/.sheet): fondo atenuado y hoja desde abajo.
 * Con Reducir movimiento aparece con un fundido en vez de deslizarse.
 */
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  confirmIcon,
  cancelLabel,
  destructive = false,
  alternative,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const enter = reduce ? FadeIn.duration(durations.fade) : SlideInDown.duration(durations.base);
  const exit = reduce ? FadeOut.duration(durations.fade) : SlideOutDown.duration(durations.fast);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {visible && (
        <View style={styles.root}>
          <Animated.View
            entering={FadeIn.duration(durations.fade).reduceMotion(ReduceMotion.Never)}
            exiting={FadeOut.duration(durations.fast)}
            style={[StyleSheet.absoluteFill, styles.scrim]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={es.common.close}
            />
          </Animated.View>
          <Animated.View
            entering={enter}
            exiting={exit}
            accessibilityViewIsModal
            style={[styles.sheet, { paddingBottom: spacing.xxl + insets.bottom }]}
          >
            <EmphasisText text={title} variant="sheetTitle" accessibilityRole="header" />
            <Text variant="lead" color={colors.text.secondary}>
              {body}
            </Text>
            <View style={styles.buttons}>
              <Button
                label={confirmLabel}
                icon={confirmIcon}
                variant={destructive ? 'destructive' : 'primary'}
                onPress={onConfirm}
                disabled={busy}
                accessibilityState={{ busy }}
              />
              {alternative && (
                <Button
                  label={alternative.label}
                  variant="secondary"
                  onPress={alternative.onPress}
                />
              )}
              <Button
                label={cancelLabel}
                variant={alternative ? 'ghost' : 'secondary'}
                onPress={onCancel}
              />
            </View>
          </Animated.View>
        </View>
      )}
    </Modal>
  );
}

/**
 * Cabecera fija de una hoja modal (canvas: .mbar): «Cancelar» · título · acción.
 * Va dentro de una pantalla presentada como modal.
 */
export function ModalHeader({
  title,
  cancelLabel,
  onCancel,
  actionLabel,
  actionIcon,
  onAction,
  actionDisabled = false,
}: {
  title: Emphasis;
  cancelLabel: string;
  onCancel: () => void;
  actionLabel: string;
  actionIcon?: IconName;
  onAction: () => void;
  actionDisabled?: boolean;
}) {
  return (
    <View style={styles.bar}>
      <View style={styles.grabber} accessibilityElementsHidden importantForAccessibility="no" />
      <Pressable accessibilityRole="button" onPress={onCancel} style={styles.barSide}>
        <Text variant="input" color={colors.text.primary}>
          {cancelLabel}
        </Text>
      </Pressable>
      <EmphasisText
        text={title}
        variant="section"
        accessibilityRole="header"
        numberOfLines={1}
        style={styles.barTitle}
        maxFontSizeMultiplier={1.3}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: actionDisabled }}
        disabled={actionDisabled}
        onPress={onAction}
        style={[styles.go, actionDisabled && styles.goOff]}
      >
        {actionIcon && (
          <Icon
            name={actionIcon}
            size={sizes.icon.button}
            strokeWidth={1.8}
            color={actionDisabled ? colors.action.disabledText : colors.action.onPrimary}
          />
        )}
        <Text
          variant="bodyStrong"
          color={actionDisabled ? colors.action.disabledText : colors.action.onPrimary}
        >
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/** Contenedor de una pantalla modal: cabecera fija + contenido. */
export function ModalScreen({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.modal}>
      {header}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { backgroundColor: colors.bg.scrim },
  sheet: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: spacing.xxl + spacing.xxs,
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
    ...shadows.floating,
  },
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
  modal: { flex: 1, backgroundColor: colors.bg.ground },
  bar: {
    minHeight: sizes.modalBar.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  grabber: {
    position: 'absolute',
    top: spacing.xs,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -sizes.grabber.width / 2,
    width: sizes.grabber.width,
    height: sizes.grabber.height,
    borderRadius: sizes.grabber.height / 2,
    backgroundColor: colors.icon.disabled,
  },
  barSide: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingHorizontal: spacing.sm },
  barTitle: { flex: 1, textAlign: 'center' },
  go: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.bubble,
    backgroundColor: colors.action.primary,
  },
  goOff: { backgroundColor: colors.action.disabledBg },
});
