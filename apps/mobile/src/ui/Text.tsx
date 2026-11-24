import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import type { Emphasis } from '@/strings/es';
import { plain } from '@/strings/es';
import { colors, textStyle, type TypographyVariant } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  italic?: boolean;
}

/** Texto con las variantes del UI kit. Escala con Dynamic Type (límite ×2 para no romper el layout). */
export function Text({
  variant = 'body',
  color = colors.text.primary,
  italic = false,
  style,
  maxFontSizeMultiplier = 2,
  ...rest
}: TextProps) {
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[textStyle(variant, italic), { color }, style]}
    />
  );
}

/** Titular de la marca: redonda + cursiva («Mis *tareas*»). Se lee como una sola frase. */
export function EmphasisText({
  text,
  variant = 'title',
  ...rest
}: Omit<TextProps, 'children' | 'italic'> & { text: Emphasis }) {
  return (
    <Text variant={variant} accessibilityLabel={plain(text)} {...rest}>
      {text.lead}
      <Text variant={variant} italic color={rest.color}>
        {text.em}
      </Text>
      {text.tail}
    </Text>
  );
}
