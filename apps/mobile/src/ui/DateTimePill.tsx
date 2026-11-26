import { useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { es } from '@/strings/es';
import { borders, colors, MIN_TOUCH_TARGET, radii, sizes, spacing } from '@/theme';
import { Button } from './Button';
import { Icon } from './icons';
import { Text } from './Text';

const dayFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
});
const timeFormatter = new Intl.DateTimeFormat('es-ES', { hour: 'numeric', minute: '2-digit' });

/**
 * Píldora de fecha u hora (kit: DateTimePill, h 40–44). «Elegir» si está vacía; al tocarla abre
 * el selector nativo (iOS: en una hoja; Android: diálogo del sistema).
 */
export function DateTimePill({
  label,
  mode,
  value,
  onChange,
}: {
  label: string;
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (next: Date | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date());
  const insets = useSafeAreaInsets();
  const text = value
    ? mode === 'date'
      ? dayFormatter.format(value)
      : timeFormatter.format(value)
    : es.tasks.form.choose;

  const openPicker = () => {
    Keyboard.dismiss(); // que el teclado no tape el selector
    const start = value ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: start,
        mode,
        is24Hour: true,
        onValueChange: (_e, date) => onChange(date),
      });
      return;
    }
    setDraft(start);
    setOpen(true);
  };

  return (
    <View style={styles.row}>
      <Text variant="input" style={styles.flex}>
        {label}
      </Text>
      {value && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${es.tasks.form.clear} ${label.toLowerCase()}`}
          onPress={() => onChange(null)}
          style={styles.clear}
        >
          <Text variant="label" style={styles.underline}>
            {es.tasks.form.clear}
          </Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text}`}
        onPress={openPicker}
        style={[styles.pill, value && styles.pillOn]}
      >
        <Icon
          name={mode === 'date' ? 'sessions' : 'clock'}
          size={sizes.icon.button}
          strokeWidth={1.8}
          color={value ? colors.action.onPrimary : colors.text.caption}
        />
        <Text variant="label" color={value ? colors.action.onPrimary : colors.text.caption}>
          {text}
        </Text>
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable
            style={styles.scrim}
            onPress={() => setOpen(false)}
            accessibilityLabel={es.common.close}
          />
          <View
            style={[styles.sheet, { paddingBottom: spacing.xxl + insets.bottom }]}
            accessibilityViewIsModal
          >
            <DateTimePicker
              value={draft}
              mode={mode}
              display={mode === 'date' ? 'inline' : 'spinner'}
              locale="es-ES"
              minimumDate={mode === 'date' ? new Date() : undefined}
              onValueChange={(_e, date) => setDraft(date)}
              accentColor={colors.action.primary}
              themeVariant="light"
            />
            <Button
              label={es.tasks.form.ready}
              onPress={() => {
                onChange(draft);
                setOpen(false);
              }}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.listRow.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  flex: { flex: 1 },
  clear: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingHorizontal: spacing.xs },
  underline: { textDecorationLine: 'underline' },
  pill: {
    minHeight: sizes.cardAction.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.bubble,
    borderWidth: borders.hairline,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.ground,
  },
  pillOn: { backgroundColor: colors.action.primary, borderColor: colors.action.primary },
  scrim: { flex: 1, backgroundColor: colors.bg.scrim },
  sheet: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
