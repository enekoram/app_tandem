import type { NotificationKind } from '@tandems/shared';

/**
 * Textos de los avisos push. Privacidad (doc 04): dicen quién y qué tipo de aviso, nunca el
 * título ni la descripción de una tarea. `name` es como la persona tiene guardado al contacto.
 */
export const PUSH_TEXTS: Record<
  NotificationKind,
  (name: string) => { title: string; body: string }
> = {
  supportRequests: (name) => ({ title: 'Tandems', body: `${name} te pide apoyo` }),
  sharedTasks: (name) => ({
    title: 'Tandems',
    body: `${name} quiere que le acompañes en una tarea`,
  }),
  sessionInvites: (name) => ({ title: 'Tandems', body: `${name} te invita a una sesión` }),
  tasksDone: (name) => ({ title: 'Tandems', body: `${name} ha terminado una tarea` }),
  supportReceived: (name) => ({ title: 'Tandems', body: `${name} te está enviando apoyo` }),
  hurras: (name) => ({ title: 'Tandems', body: `${name} te ha enviado un ¡hurra!` }),
  sessionReminders: (name) => ({ title: 'Tandems', body: `Tu sesión con ${name} empieza pronto` }),
};

/** Ruta de la app que se abre al tocar cada aviso. */
export const PUSH_ROUTES: Record<NotificationKind, string> = {
  supportRequests: '/',
  sharedTasks: '/acompano',
  sessionInvites: '/sesiones',
  tasksDone: '/acompano',
  supportReceived: '/',
  hurras: '/tarea/terminadas',
  sessionReminders: '/',
};
