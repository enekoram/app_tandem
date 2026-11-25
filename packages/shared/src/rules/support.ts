/** Reglas de apoyo (doc 02 · support_events; doc 04 · decisión 7). */

export const SUPPORT_TYPES = ['request', 'sending', 'thinking_of_you'] as const;
export type SupportType = (typeof SUPPORT_TYPES)[number];

export const SUPPORT_STATUSES = ['open', 'accepted', 'declined', 'expired', 'ended'] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

/** Una petición de apoyo caduca a los 15 min sin respuesta. */
export const SUPPORT_REQUEST_TTL_MS = 15 * 60 * 1000;
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
