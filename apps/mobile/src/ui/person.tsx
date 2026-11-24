import { StyleSheet, View } from 'react-native';
import { borders, colors, personColors, radii, sizes, type PersonColorId } from '@/theme';
import { es } from '@/strings/es';
import { Text } from './Text';

/**
 * Única puerta de entrada a los colores de persona. Las pantallas nunca usan hex de persona.
 * `edge` es el degradado del filo; `text` el tono accesible para escribir su nombre.
 */
export function usePersonStyle(id: PersonColorId | undefined) {
  if (!id) return null;
  const c = personColors[id];
  return {
    label: c.label,
    fill: c.base,
    text: c.text,
    edge: [c.deep, c.base, c.soft] as const,
  };
}

export interface PersonTokenProps {
  /** Nombre visible; la inicial sale de aquí. */
  name: string;
  color: PersonColorId;
  /** Aún no ha aceptado: círculo con borde discontinuo gris, sin relleno. */
  pending?: boolean;
  size?: number;
}

/** Avatar de persona: inicial serif sobre su color. El estado se anuncia, no depende solo del color. */
export function PersonToken({
  name,
  color,
  pending = false,
  size = sizes.avatar,
}: PersonTokenProps) {
  const style = usePersonStyle(color);
  const initial = name.trim().charAt(0).toLocaleUpperCase('es');
  return (
    <View
      accessible
      accessibilityLabel={pending ? `${name}, ${es.common.pendingSuffix}` : name}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: radii.round },
        pending ? styles.pending : { backgroundColor: style?.fill },
      ]}
    >
      <Text variant="avatarInitial" color={colors.text.primary} maxFontSizeMultiplier={1.2}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  pending: {
    borderWidth: borders.pending,
    borderStyle: 'dashed',
    borderColor: colors.border.pending,
    backgroundColor: 'transparent',
  },
});
