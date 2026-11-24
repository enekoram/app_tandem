/** Reglas de tareas compartidas por la API y la app. */

/** Límite de tareas abiertas por persona (lo garantiza el servidor, doc 02). */
export const MAX_OPEN_TASKS = 5;
export const TASK_TITLE_MAX = 80;
export const TASK_DESCRIPTION_MAX = 500;

export const TASK_STATUSES = ['open', 'done', 'deleted'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const COMPANION_STATUSES = ['none', 'pending', 'accepted', 'rejected', 'left'] as const;
export type CompanionStatus = (typeof COMPANION_STATUSES)[number];

export const CONTACT_STATUSES = ['pending', 'accepted', 'cancelled'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
