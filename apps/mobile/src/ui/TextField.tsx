import { forwardRef, useId, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { es } from '@/strings/es';
import {
  borders,
  colors,
  fontFamilies,
  MIN_TOUCH_TARGET,
  radii,
  sizes,
  spacing,
  typography,
} from '@/theme';
import { Icon } from './icons';
import { Text } from './Text';

/** Referencia a un campo (para pasar el foco al siguiente). */
export type TextInputRef = ComponentRef<typeof TextInput>;

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Texto de ayuda bajo el campo (requisitos). */
  hint?: string;
  /** Mensaje de error: borde rojo teja + texto con icono. El campo lo anuncia. */
  error?: string | null;
  /** Solo el borde de error (el mensaje está en otro sitio, p. ej. un FormAlert). */
  invalid?: boolean;
  /** Contraseña con botón para mostrarla. */
  password?: boolean;
}

/** Campo del kit: etiqueta 14/600, caja de 52 con radio 14, error bajo el campo. */
export const TextField = forwardRef<TextInputRef, TextFieldProps>(function TextField(
  { label, hint, error, invalid = false, password = false, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const hintId = useId();
  return (
    <View style={styles.wrap}>
      <Text variant="label" style={styles.label} nativeID={`${hintId}-label`}>
        {label}
      </Text>
      <View
        style={[styles.box, focused && styles.focused, error || invalid ? styles.errorBox : null]}
      >
        <TextInput
          ref={ref}
          {...rest}
          accessibilityLabel={label}
          accessibilityLabelledBy={`${hintId}-label`}
          accessibilityHint={error ?? hint}
          aria-invalid={!!error || invalid}
          secureTextEntry={password && !visible}
          placeholderTextColor={colors.text.secondary}
          maxFontSizeMultiplier={2}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={styles.input}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? es.auth.hidePassword : es.auth.showPassword}
            accessibilityState={{ checked: visible }}
            onPress={() => setVisible((v) => !v)}
            style={styles.eye}
          >
            <Icon
              name={visible ? 'eyeOff' : 'eye'}
              size={sizes.icon.header}
              color={colors.text.secondary}
              strokeWidth={1.8}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
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
      ) : hint ? (
        <Text variant="label" color={colors.text.secondary} style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: { paddingHorizontal: spacing.xxs },
  box: {
    minHeight: sizes.input.height,
    borderRadius: radii.bubble,
    backgroundColor: colors.field.bg,
    borderWidth: borders.hairline,
    borderColor: colors.field.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
  },
  focused: { borderColor: colors.field.borderFocus },
  errorBox: { borderWidth: borders.pending, borderColor: colors.field.borderError },
  input: {
    flex: 1,
    minHeight: sizes.input.height - 2,
    fontFamily: fontFamilies.sans,
    fontSize: typography.input.size,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  eye: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.xxs },
  hint: { paddingHorizontal: spacing.xxs, fontFamily: fontFamilies.sans },
  flex: { flex: 1 },
});
