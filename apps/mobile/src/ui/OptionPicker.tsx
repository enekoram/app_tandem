import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { borders, colors, radii, sizes, spacing } from '@/theme';
import { Icon } from './icons';
import { ListCard } from './list';
import { Text } from './Text';

export interface Option {
  id: string;
  title: string;
  subtitle?: string;
  leading?: ReactNode;
}

/** Lista de opciones de una sola elección (mismo aspecto que PersonPicker). */
export function OptionPicker({
  options,
  value,
  onChange,
  error,
}: {
  options: Option[];
  value: string | null;
  onChange: (id: string) => void;
  error?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" style={error ? styles.errorRing : undefined}>
      <ListCard>
        {options.map((o) => {
          const selected = o.id === value;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={o.subtitle ? `${o.title}, ${o.subtitle}` : o.title}
              onPress={() => onChange(o.id)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              {o.leading}
              <View style={styles.texts}>
                <Text variant={selected ? 'bodyStrong' : 'input'}>{o.title}</Text>
                {o.subtitle ? (
                  <Text variant="label" color={colors.text.secondary}>
                    {o.subtitle}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.check, !selected && styles.hidden]}>
                <Icon
                  name="check"
                  size={sizes.icon.inline}
                  color={colors.action.onPrimary}
                  strokeWidth={2.4}
                />
              </View>
            </Pressable>
          );
        })}
      </ListCard>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.personPickerRow.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  pressed: { backgroundColor: colors.bg.ground },
  texts: { flex: 1 },
  check: {
    width: sizes.radioCheck,
    height: sizes.radioCheck,
    borderRadius: radii.round,
    backgroundColor: colors.action.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: { opacity: 0 },
  errorRing: {
    borderRadius: radii.card + 2,
    borderWidth: borders.pending,
    borderColor: colors.field.borderError,
  },
});
