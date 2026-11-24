/**
 * Colores del UI kit («Mini UI kit · light v0.1», canvas). Fuente: docs/06-ui-kit.md.
 * Ningún color suelto en pantallas: todo sale de aquí. Colores de personas: ver persons.ts.
 */
export const colors = {
  bg: {
    ground: '#FAF5E8',
    /** El mismo ground al 0 %: inicio del degradado que funde el contenido bajo la barra. */
    groundTransparent: 'rgba(250, 245, 232, 0)',
    surface: '#FFFDF8',
    bubble: '#EBE7D7',
    muted: '#E4DCCD',
    /** Fondo atenuado tras hojas y diálogos (texto principal al 40 %). */
    scrim: 'rgba(33, 30, 27, 0.4)',
  },
  border: {
    subtle: '#EDE3D4',
    /** Borde del botón de perfil (contraste ≥ 3:1 para elemento interactivo). */
    control: '#8A8076',
    /** Borde discontinuo de «pendiente» (avatar sin aceptar, CTA ghost deshabilitado). */
    pending: '#A69B8E',
  },
  text: {
    primary: '#211E1B',
    caption: '#3A3530',
    secondary: '#6B6259',
    inactive: '#8A8076',
    accent: '#211E1B',
  },
  icon: {
    muted: '#9A9086',
    /** Flecha de carrusel deshabilitada (decorativa: el estado se anuncia por accesibilidad). */
    disabled: '#B5AA9C',
  },
  action: {
    primary: '#211E1B',
    onPrimary: '#F5EFE4',
    /** Botón y fila destructivos (eliminar contacto, cancelar invitación, borrar). */
    destructive: '#A33A2B',
    /** Botón «Enviar» deshabilitado en la cabecera de una hoja. */
    disabledBg: '#E4DCCD',
    disabledText: '#5A524A',
  },
  status: {
    /** Punto «en vivo» (decorativo, con pulso). */
    live: '#7FCFA3',
    /** Texto «En vivo»: el verde del encargo, que sí cumple AA. */
    liveText: '#2F7A52',
  },
  carousel: {
    dotActive: '#211E1B',
    dotInactive: '#CFC5B6',
  },
  /** Toasts del kit. Nunca el negro del CTA. */
  toast: {
    info: { bg: '#EBE7D7', text: '#3A3530', border: '#DED7C4' },
    ok: { bg: '#DCEFE3', text: '#1F5A3A', border: '#BEE0C9' },
    err: { bg: '#F6E3DE', text: '#7A2A1F', border: '#E7C2B8' },
  },
  /** Rojo teja: solo para acciones destructivas y errores. */
  danger: '#7A2A1F',
  /** Campos de formulario (canvas: .fd / .ferr). */
  field: {
    bg: '#FFFDF8',
    border: '#EDE3D4',
    borderFocus: '#211E1B',
    borderError: '#A33A2B',
    errorText: '#8A2E22',
    /** Borde de la casilla sin marcar. */
    checkbox: '#6B6259',
  },
  /** Colores de las ilustraciones (onboarding): la otra persona es genérica, no de la paleta. */
  illustration: {
    self: '#F3B58E',
    selfLight: '#F3C4A0',
    other: '#A9C9AE',
    otherLight: '#D6C2E6',
    sparkle: ['#F2DFA6', '#D6C2E6', '#A9C9AE', '#F3B58E', '#E9CFC4'],
    liveDot: '#6FC28F',
    slotEmpty: '#8A8076',
  },
} as const;

/** Degradados con sus paradas en orden. */
export const gradients = {
  /** Forma unida de la home y animación del onboarding. */
  energy: ['#F3B58E', '#F2DFA6', '#E9CFC4', '#A98BC2'],
  /** Forma «tú + amig@» del onboarding (paradas 0 · .42 · .62 · 1). */
  onboarding: ['#F3B58E', '#F2DFA6', '#D6C2E6', '#A9C9AE'],
  /** Logo e icono de app (encargo). */
  brand: ['#F09A6A', '#F3C98A', '#EBCFB4', '#C6A9DF', '#8FC19A'],
} as const;
