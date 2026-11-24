/**
 * Tipografía del UI kit. Tamaños en pt; `lineHeight` absoluto; `letterSpacing` en em
 * (la app lo convierte a pt multiplicando por el tamaño). Dynamic Type escala estos valores.
 */
export const fontFamilies = {
  serif: 'EBGaramond_500Medium',
  serifItalic: 'EBGaramond_500Medium_Italic',
  sans: 'PlusJakartaSans_500Medium',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
} as const;

export const typography = {
  /** Titular de pestaña: redonda + cursiva. */
  display: { family: 'serif', size: 52, lineHeight: 52, letterSpacing: -0.01 },
  /** Título de pantalla interior. */
  title: { family: 'serif', size: 30, lineHeight: 33, letterSpacing: 0 },
  section: { family: 'serif', size: 24, lineHeight: 28, letterSpacing: 0 },
  h4: { family: 'sansSemiBold', size: 20, lineHeight: 24, letterSpacing: 0.1, uppercase: true },
  h5: { family: 'sansSemiBold', size: 17, lineHeight: 21, letterSpacing: 0.1, uppercase: true },
  bodyStrong: { family: 'sansSemiBold', size: 16, lineHeight: 22, letterSpacing: 0 },
  body: { family: 'sans', size: 14, lineHeight: 20, letterSpacing: 0 },
  label: { family: 'sansSemiBold', size: 13, lineHeight: 18, letterSpacing: 0 },
  caption: {
    family: 'sansSemiBold',
    size: 11,
    lineHeight: 14,
    letterSpacing: 0.12,
    uppercase: true,
  },
  nav: { family: 'sansSemiBold', size: 11, lineHeight: 14, letterSpacing: 0 },
  /** Inicial dentro del avatar. */
  avatarInitial: { family: 'serif', size: 24, lineHeight: 28, letterSpacing: 0 },
} as const satisfies Record<
  string,
  {
    family: keyof typeof fontFamilies;
    size: number;
    lineHeight: number;
    letterSpacing: number;
    uppercase?: boolean;
  }
>;

export type TypographyVariant = keyof typeof typography;
