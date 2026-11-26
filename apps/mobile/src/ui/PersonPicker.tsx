import { Pressable, StyleSheet, View } from 'react-native';
import type { ContactDto } from '@tandems/api-client';
import { es } from '@/strings/es';
import { borders, colors, opacities, radii, sizes, spacing } from '@/theme';
import { Icon } from './icons';
import { ListCard } from './list';
import { PersonToken } from './person';
import { Text } from './Text';

/**
 * Elegir acompañante (canvas: radio + avatar, fila de 60). VoiceOver lo lee como un grupo de
 * opciones; la elegida lleva marca (no solo color) y se anuncia como seleccionada.
 */
export function PersonPicker({
  contacts,
  value,
  onChange,
  onAddContact,
  error,
}: {
  contacts: ContactDto[];
  value: string | null;
  onChange: (id: string) => void;
  onAddContact: () => void;
  error?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" style={error ? styles.errorRing : undefined}>
      <ListCard>
        {contacts.map((c) => {
          const selected = c.id === value;
          const pending = c.status !== 'accepted';
          return (
            <Pressable
              key={c.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={pending ? `${c.name}, ${es.contacts.pending}` : c.name}
              onPress={() => onChange(c.id)}
              style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                value && !selected && styles.dimmed,
                pressed && styles.pressed,
              ]}
            >
              <PersonToken
                name={c.name}
                initials={c.initials}
                color={c.color}
                pending={pending}
                size="sm"
                decorative
              />
              <View style={styles.texts}>
                <Text variant={selected ? 'bodyStrong' : 'input'}>{c.name}</Text>
                {pending && (
                  <Text variant="label" color={colors.text.secondary}>
                    {es.contacts.pending}
                  </Text>
                )}
              </View>
              <View style={[styles.check, !selected && styles.checkOff]}>
                {selected && (
                  <Icon
                    name="check"
                    size={sizes.icon.inline}
                    color={colors.action.onPrimary}
                    strokeWidth={2.4}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={onAddContact}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.add}>
            <Icon
              name="plus"
              size={sizes.icon.button}
              color={colors.text.primary}
              strokeWidth={1.8}
            />
          </View>
          <Text variant="bodyStrong" style={styles.texts}>
            {es.tasks.form.addContact}
          </Text>
        </Pressable>
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
  checkOff: {
    backgroundColor: 'transparent',
    borderWidth: borders.pending,
    borderColor: colors.border.pending,
  },
  rowSelected: { backgroundColor: colors.bg.ground },
  dimmed: { opacity: opacities.unselected },
  add: {
    width: sizes.avatar.sm,
    height: sizes.avatar.sm,
    borderRadius: radii.round,
    borderWidth: borders.pending,
    borderStyle: 'dashed',
    borderColor: colors.text.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRing: {
    borderRadius: radii.card + 2,
    borderWidth: borders.pending,
    borderColor: colors.field.borderError,
  },
});
