/**
 * Todos los textos de la app. Nunca literales en componentes.
 * Títulos con parte en cursiva: { lead, em } → «lead *em*».
 * «amig@» se escribe para lectura como «amiga o amigo» en las etiquetas de accesibilidad.
 */

export interface Emphasis {
  lead: string;
  em: string;
  tail?: string;
}

export const es = {
  common: {
    comingSoon: 'Esto llega en la próxima versión',
    profile: 'Mi perfil',
    close: 'Cerrar',
    /** Se añade al nombre de quien aún no ha aceptado: «Lucía, pendiente». */
    pendingSuffix: 'pendiente',
  },
  tabs: {
    a11yLabel: 'Secciones',
    today: 'Hoy',
    tasks: 'Tareas',
    sessions: 'Sesiones',
    companion: 'Acompaño',
  },
  today: {
    title: { lead: 'Empieza ', em: 'aquí' } satisfies Emphasis,
    intro:
      'Aún no hay nadie en tu red de apoyo. Cuando crees una tarea podrás añadir a una persona.',
    nextTask: { lead: 'Tu ', em: 'siguiente tarea' } satisfies Emphasis,
    emptyTitle: { lead: 'Aún ', em: 'no tienes tareas' } satisfies Emphasis,
    emptyBody: 'Empieza por una sola cosa que quieras hacer, y elige a alguien que te acompañe.',
    createFirst: 'Crear mi primera tarea',
  },
  tasks: {
    caption: 'Sin tareas todavía',
    title: { lead: 'Mis ', em: 'tareas' } satisfies Emphasis,
    add: 'Nueva tarea',
    emptyTitle: { lead: 'Aún ', em: 'no tienes tareas' } satisfies Emphasis,
    emptyBody: 'Crea tu primera tarea y elige a una persona que te acompañe.',
    createFirst: 'Crear mi primera tarea',
    addContactFirst: 'Añadir un contacto primero',
    hint: 'Cada tarea va con alguien. Si aún no ha aceptado, la verás como pendiente.',
  },
  sessions: {
    caption: 'Sin sesiones',
    title: { lead: 'Mis ', em: 'sesiones' } satisfies Emphasis,
    add: 'Programar sesión',
    emptyTitle: { lead: 'Aún no ', em: 'tienes sesiones' } satisfies Emphasis,
    emptyBody: 'Programa una sesión para trabajar en una tarea junto a la persona que te acompaña.',
    schedule: 'Programar sesión',
  },
  companion: {
    caption: 'Sin tareas que acompañar',
    title: { lead: '', em: 'Acompaño' } satisfies Emphasis,
    emptyTitle: { lead: 'Aún no ', em: 'acompañas ninguna tarea' } satisfies Emphasis,
    emptyBody: 'Cuando alguien comparta una tarea contigo o te pida apoyo, aparecerá aquí.',
  },
  profile: {
    caption: 'Tu cuenta',
    title: { lead: 'Mi ', em: 'perfil' } satisfies Emphasis,
    emptyBody:
      'Aquí podrás cambiar tu nombre, tu foto, las notificaciones y el nivel de movimiento.',
  },
  errors: {
    fontsFailed: 'No se han podido cargar las fuentes. Se usará la del sistema.',
  },
} as const;

/** Texto plano de un título con énfasis, para lectores de pantalla. */
export function plain(text: Emphasis): string {
  return `${text.lead}${text.em}${text.tail ?? ''}`;
}
