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
  /** Avatar: lista 40 · fila 44 · kit 52 · detalle 76. */
  avatar: { sm: 40, md: 44, kit: 52, lg: 76 },
  input: { height: 52 },
  textarea: { height: 104 },
  dateTimePill: { height: 40 },
  personPickerRow: { height: 60 },
  listRow: { minHeight: 60 },
  /** Hoja modal (ModalSheet): cabecera fija y asa para arrastrar. */
  modalBar: { height: 68 },
  grabber: { width: 36, height: 5 },
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
  icon: { nav: 22, header: 20, button: 18, inline: 15, back: 24, illustration: 60 },
  checkbox: { size: 26, radius: 8, icon: 16 },
  /** Aviso flotante (FloatingNotice): icono redondo, corazón y punto «en vivo». */
  notice: { icon: 42, heart: 18, liveDot: 7 },
  onboardingArt: { height: 216 },
  logo: { width: 92, height: 66 },
  stepDot: { size: 6, activeWidth: 18 },
  /** Cabecera fija de pantalla (sin status bar: la da el sistema vía safe area). */
  screenTitle: { height: 126, paddingTop: 18, paddingHorizontal: 24, paddingBottom: 16, gap: 8 },
} as const;

/** Sombra de elementos que flotan sobre el contenido (aviso, hoja). */
export const shadows = {
  /** Tarjeta destacada sobre el fondo (formulario de inicio de sesión). */
  card: {
    shadowColor: '#211E1B',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#211E1B',
    shadowOpacity: 0.12,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
} as const;

export const borders = {
  hairline: 1,
  pending: 1.5,
} as const;
