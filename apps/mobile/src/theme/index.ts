import type { TextStyle } from 'react-native';
import { fontFamilies, typography, type TypographyVariant } from '@tandems/shared/theme';

export * from '@tandems/shared/theme';

/** Estilo de texto de React Native para una variante del UI kit (letterSpacing en em → pt). */
export function textStyle(variant: TypographyVariant, italic = false): TextStyle {
  const t = typography[variant];
  const family = t.family === 'serif' && italic ? fontFamilies.serifItalic : fontFamilies[t.family];
  return {
    fontFamily: family,
    fontSize: t.size,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing * t.size,
    ...('uppercase' in t && t.uppercase ? { textTransform: 'uppercase' } : {}),
  };
}
