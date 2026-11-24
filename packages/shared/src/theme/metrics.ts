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
  /** Botón «Mi perfil» de la cabecera (canvas). */
  profileButton: 44,
  avatar: 52,
  input: { height: 52 },
  textarea: { height: 104 },
  dateTimePill: { height: 40 },
  personPickerRow: { height: 60 },
  tabBar: { height: 72 },
  modalHeader: { height: 68 },
  carousel: { arrow: { width: 40, height: 44 }, dot: { width: 18, height: 44 } },
  cardEdge: { width: 5 },
  /** Degradado que funde el contenido bajo la barra de pestañas flotante. */
  navFade: { height: 124 },
  tabBarInset: { horizontal: 16, bottom: 22 },
  /** Contenido desplazable de una pestaña (deja sitio a la barra flotante). */
  screenContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 140, gap: 12 },
  /** Tarjeta de estado vacío (EmptyStateCard). */
  emptyCard: {
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 26,
    gap: 10,
    textMaxWidth: 280,
    illustration: { width: 120, height: 112 },
  },
  icon: { nav: 22, header: 20, button: 18, illustration: 60 },
  /** Cabecera fija de pantalla (sin status bar: la da el sistema vía safe area). */
  screenTitle: { height: 126, paddingTop: 18, paddingHorizontal: 24, paddingBottom: 16, gap: 8 },
} as const;

export const borders = {
  hairline: 1,
  pending: 1.5,
} as const;
