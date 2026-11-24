/** Radios, espaciado y medidas de componentes del UI kit (pt). */

export const radii = {
  bubble: 14,
  button: 18,
  card: 20,
  sheet: 24,
  floatingNav: 36,
  /** Usar con width/height iguales: avatar circular. */
  round: 9999,
} as const;

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
} as const;

/** Objetivo táctil mínimo (Apple HIG / WCAG 2.5.8 reforzado). */
export const MIN_TOUCH_TARGET = 44;

export const sizes = {
  button: { height: 52 },
  iconButton: { large: 48, small: 40 },
  avatar: 52,
  input: { height: 52 },
  textarea: { height: 104 },
  dateTimePill: { height: 40 },
  personPickerRow: { height: 60 },
  tabBar: { height: 72 },
  modalHeader: { height: 68 },
  carousel: { arrow: { width: 40, height: 44 }, dot: { width: 18, height: 44 } },
  cardEdge: { width: 5 },
  /** Cabecera fija de pantalla (sin status bar: la da el sistema vía safe area). */
  screenTitle: { height: 126, paddingTop: 18, paddingHorizontal: 24, paddingBottom: 16 },
} as const;

export const borders = {
  hairline: 1,
  pending: 1.5,
} as const;
