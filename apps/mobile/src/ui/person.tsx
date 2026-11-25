import { StyleSheet, View } from 'react-native';
import { es } from '@/strings/es';
import {
  borders,
  colors,
  personColors,
  radii,
  sizes,
  type PersonColorId,
  type TypographyVariant,
} from '@/theme';
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

export type AvatarSize = keyof typeof sizes.avatar;

const INITIAL_VARIANT: Record<AvatarSize, TypographyVariant> = {
  sm: 'avatarSmall',
  md: 'avatarSmall',
  kit: 'avatarInitial',
  lg: 'avatarLarge',
};

export interface PersonTokenProps {
  /** Nombre visible (para VoiceOver). */
  name: string;
  /** Iniciales calculadas por la API (1–2 letras o emoji). Por defecto, la primera letra. */
  initials?: string;
  color: PersonColorId;
  /** Aún no se ha unido: círculo con borde discontinuo gris, sin relleno. */
  pending?: boolean;
  size?: AvatarSize;
  /** Si el nombre ya se lee al lado (filas), el avatar no se anuncia. */
  decorative?: boolean;
}

/** Avatar de persona: iniciales serif sobre su color. El estado se anuncia, no depende solo del color. */
export function PersonToken({
  name,
  initials,
  color,
  pending = false,
  size = 'kit',
  decorative = false,
}: PersonTokenProps) {
  const style = usePersonStyle(color);
  const px = sizes.avatar[size];
  const label = initials ?? name.trim().charAt(0).toLocaleUpperCase('es');
  return (
    <View
      accessible={!decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      accessibilityElementsHidden={decorative}
      accessibilityLabel={pending ? `${name}, ${es.common.pendingSuffix}` : name}
      style={[
        styles.base,
        { width: px, height: px, borderRadius: radii.round },
        pending ? styles.pending : { backgroundColor: style?.fill },
      ]}
    >
      <Text
        variant={INITIAL_VARIANT[size]}
        color={pending ? colors.text.secondary : colors.text.primary}
        maxFontSizeMultiplier={1.2}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flex: 0 },
  pending: {
    borderWidth: borders.pending,
    borderStyle: 'dashed',
    borderColor: colors.border.pending,
    backgroundColor: 'transparent',
  },
});
