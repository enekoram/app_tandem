/**
 * Tokens de movimiento. Duraciones de doc 03/04; muelles y curvas son propuesta inicial
 * (se afinan en fase 3 con la forma unida en el móvil).
 * Toda animación debe pasar por un perfil (completo / suave / mínimo); Reducir movimiento
 * del sistema fuerza `minimal`.
 */

export const durations = {
  fast: 150,
  /** Fundido que sustituye a cualquier movimiento en el perfil mínimo. */
  fade: 200,
  base: 280,
  slow: 420,
  /** Respiración de la forma unida (ciclo completo). */
  breath: 6000,
  /** Aviso flotante: ciclo completo hasta retirarse solo. */
  floatingNotice: 8000,
  /** Ventana para «Deshacer». */
  undo: 8000,
  /** Aviso sin acción (toast informativo): se retira antes. */
  toast: 4000,
} as const;

/**
 * Deriva de las formas del onboarding (referencia de la forma unida, canvas): ciclo de
 * `durations.breath`, ida y vuelta con ease-in-out. Desplazamiento en pt y escala.
 */
export const drift = {
  self: { dx: 5, dy: -3, scale: 1.04 },
  other: { dx: -10, dy: 5, scale: 0.96 },
  /** Latido del corazón de apoyo. */
  heartbeat: { duration: 1100, peak: 1.25, rebound: 0.94 },
} as const;

/** Efecto «goo»: desenfoque y umbral de alfa que funde las formas (SVG/Skia). */
export const goo = { blur: 11, alphaSlope: 26, alphaOffset: -12 } as const;

/** Curvas cúbicas [x1, y1, x2, y2]. */
export const easings = {
  standard: [0.2, 0, 0, 1],
  enter: [0, 0, 0, 1],
  exit: [0.3, 0, 1, 1],
} as const;

/**
 * Órbita del «amigo» alrededor de ti en la Home (pedido tras las pruebas del 2026-11-25):
 * ángulo máximo en radianes (±) y duración de un vaivén completo.
 */
export const orbit = { maxAngle: 0.35, duration: 9000, apartFactor: 0.4 } as const;

/** Configuración de muelles (forma de Reanimated `withSpring`). */
export const springs = {
  full: { damping: 14, stiffness: 140, mass: 1 },
  gentle: { damping: 24, stiffness: 120, mass: 1 },
} as const;

export const MOTION_PROFILES = ['full', 'gentle', 'minimal'] as const;
export type MotionProfile = (typeof MOTION_PROFILES)[number];

export const motionProfiles = {
  full: { breathAmplitude: 0.04, heartbeatScale: 1.12, spring: springs.full },
  gentle: { breathAmplitude: 0.02, heartbeatScale: 1.05, spring: springs.gentle },
  /** Sin desplazamientos ni escalas: solo opacidad. */
  minimal: { breathAmplitude: 0, heartbeatScale: 1, spring: null },
} as const satisfies Record<MotionProfile, unknown>;

/** Nivel de estímulo del perfil (API: full · soft · minimal) → perfil de movimiento. */
export function profileForStimulus(stimulus: 'full' | 'soft' | 'minimal'): MotionProfile {
  return stimulus === 'soft' ? 'gentle' : stimulus;
}

/** Perfil efectivo: Reducir movimiento del sistema manda sobre la preferencia. */
export function resolveMotionProfile(
  preferred: MotionProfile,
  systemReduceMotion: boolean,
): MotionProfile {
  return systemReduceMotion ? 'minimal' : preferred;
}
