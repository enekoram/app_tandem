/** Reglas de apoyo (doc 02 · support_events; doc 04 · decisión 7). */

export const SUPPORT_TYPES = ['request', 'sending', 'thinking_of_you'] as const;
export type SupportType = (typeof SUPPORT_TYPES)[number];

export const SUPPORT_STATUSES = ['open', 'accepted', 'declined', 'expired', 'ended'] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

/**
 * Una petición de apoyo NO caduca (decisión del 2026-11-25): sigue abierta hasta que la otra
 * persona envía apoyo o dice «Ahora no» (o la tarea se cierra).
 */
/** Un envío de apoyo en vivo dura como mucho 5 min (o hasta soltar). */
export const SUPPORT_SEND_MAX_MS = 5 * 60 * 1000;
/** La app manda un latido cada 3 s mientras se mantiene pulsado. */
export const SUPPORT_BEAT_MS = 3_000;
/** «Pensé en ti»: como mucho uno cada 10 min a la misma persona. */
export const THINKING_INTERVAL_MS = 10 * 60 * 1000;
export const SUPPORT_MESSAGE_MAX = 200;

/** Avisos configurables (NotificacionesKV). Todos activados por defecto. */
export const NOTIFICATION_KINDS = [
  'supportRequests',
  'sharedTasks',
  'sessionInvites',
  'tasksDone',
  'supportReceived',
  'hurras',
  'sessionReminders',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Horario de silencio por defecto (desactivado): de 22:00 a 8:00. */
export const DEFAULT_QUIET_HOURS = { enabled: false, start: '22:00', end: '08:00' } as const;

/** «HH:MM» (00:00–23:59). */
export const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h! * 60 + m!;
};

/**
 * ¿Está `now` dentro del horario de silencio, en la zona horaria de la persona?
 * Admite tramos que cruzan la medianoche (22:00–08:00). Inicio incluido, fin excluido.
 */
export function inQuietHours(
  now: Date,
  timeZone: string,
  quiet: { enabled: boolean; start: string; end: string },
): boolean {
  if (!quiet.enabled || quiet.start === quiet.end) return false;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const t = hour * 60 + minute;
  const start = minutesOf(quiet.start);
  const end = minutesOf(quiet.end);
  return start < end ? t >= start && t < end : t >= start || t < end;
}
