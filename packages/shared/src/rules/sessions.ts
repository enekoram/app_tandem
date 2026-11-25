/** Reglas de sesiones compartidas por la API y la app (doc 02 · sessions). */

export const SESSION_STATUSES = [
  'proposed',
  'accepted',
  'rejected',
  'cancelled',
  'live',
  'ended',
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

/** Duraciones que se pueden elegir (min). */
export const SESSION_DURATIONS = [15, 25, 45, 60] as const;
export type SessionDuration = (typeof SESSION_DURATIONS)[number];
export const DEFAULT_SESSION_DURATION: SessionDuration = 45;

/** Una sesión nueva o reprogramada tiene que empezar al menos 1 min después de ahora. */
export const SESSION_MIN_LEAD_MS = 60 * 1000;
/** Mensaje opcional al proponer otra hora. */
export const SESSION_MESSAGE_MAX = 200;

/** Sesiones «vivas»: aún pueden pasar (aparecen en Mis sesiones y en la Home). */
export const ACTIVE_SESSION_STATUSES: readonly SessionStatus[] = ['proposed', 'accepted', 'live'];

/** Hora de fin (ms). */
export function sessionEndsAt(scheduledAt: string | Date, durationMin: number): number {
  return new Date(scheduledAt).getTime() + durationMin * 60_000;
}

/**
 * Estado efectivo: una sesión aceptada o en curso cuya hora de fin ya pasó cuenta como
 * terminada (no hay trabajo programado que la cierre: se decide al leerla).
 * Una propuesta que nadie aceptó antes de su hora, también.
 */
export function effectiveSessionStatus(
  s: { status: SessionStatus; scheduledAt: string | Date; durationMin: number },
  now: number,
): SessionStatus {
  if (!ACTIVE_SESSION_STATUSES.includes(s.status)) return s.status;
  if (now >= sessionEndsAt(s.scheduledAt, s.durationMin)) return 'ended';
  return s.status;
}
