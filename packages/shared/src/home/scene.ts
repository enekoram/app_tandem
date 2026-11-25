/**
 * Home viva (doc 03): reglas puras que deciden qué ve la persona.
 * - `deriveBase`: situación de fondo a partir de la instantánea del servidor.
 * - `describeScene`: escena que dibuja Skia + tarjetas del carrusel + qué lee VoiceOver.
 * Sin textos: la app los compone con strings/es.ts a partir de `a11y`.
 */
import type { PersonColorId } from '../theme/persons.ts';

/** «Sesión por empezar»: ventana antes de la hora (doc 04, decisión abierta 2). */
export const SOON_WINDOW_MS = 10 * 60 * 1000;
/** Máximo de contactos dibujados alrededor de «tú» en Hoy (vacío, con contactos). */
export const MAX_SCENE_CONTACTS = 3;

export interface HomePerson {
  /** Id del contacto (en la paleta de quien mira). */
  id: string;
  name: string;
  initials: string;
  color: PersonColorId;
  /** Conectada ahora (presencia en tiempo real). */
  present?: boolean;
}

export interface HomeTask {
  id: string;
  title: string;
  /** ISO 8601. */
  dueAt?: string | null;
  createdAt: string;
  companion?: (HomePerson & { status: 'pending' | 'accepted' | 'rejected' | 'left' }) | null;
}

export interface HomeSession {
  id: string;
  taskId: string;
  taskTitle: string;
  scheduledAt: string;
  status: 'scheduled' | 'live';
  person: HomePerson;
}

/** Algo que otra persona espera que respondas («Te piden»). */
export interface HomeRequest {
  id: string;
  /** task = te comparten una tarea; session = te invitan a una sesión; support = te piden apoyo. */
  kind: 'task' | 'session' | 'support';
  person: HomePerson;
  taskTitle: string;
  /** Sesión propuesta (solo `session`). */
  scheduledAt?: string;
}

export interface HomeSnapshot {
  /** Mis tareas abiertas. */
  tasks: HomeTask[];
  /** Contactos aceptados. */
  contacts: HomePerson[];
  /** Sesiones mías próximas o en curso (fase 4). */
  sessions: HomeSession[];
  /** Peticiones pendientes de respuesta (fases 4 y 5). */
  requests: HomeRequest[];
}

export type BaseState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'contactsNoTasks' }
  | { kind: 'nextTask'; task: HomeTask }
  | { kind: 'sessionSoon'; session: HomeSession }
  | { kind: 'sessionLive'; session: HomeSession }
  /** Sin tareas propias pero con una sesión aceptada más adelante (p. ej. quien acompaña). */
  | { kind: 'upcomingSession'; session: HomeSession };

const time = (value: string | Date) => new Date(value).getTime();

/** Lo mínimo para ordenar tareas abiertas (sirve con fechas ISO o `Date` de Mongo). */
export interface Orderable {
  dueAt?: string | Date | null;
  createdAt: string | Date;
}

/**
 * Orden de las tareas abiertas: primero las que tienen fecha, de la más cercana a la más
 * lejana (las vencidas, delante); después las que no tienen fecha, de la más reciente a la
 * más antigua.
 */
export function sortOpenTasks<T extends Orderable>(tasks: readonly T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (a.dueAt && b.dueAt) return time(a.dueAt) - time(b.dueAt);
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return time(b.createdAt) - time(a.createdAt);
  });
}

/** Tu siguiente tarea: la primera según `sortOpenTasks`. */
export function pickNextTask<T extends Orderable>(tasks: readonly T[]): T | undefined {
  return sortOpenTasks(tasks)[0];
}

/** Situación de fondo (doc 03 · región `base`). */
export function deriveBase(snapshot: HomeSnapshot | null, now: number): BaseState {
  if (!snapshot) return { kind: 'loading' };
  const live = snapshot.sessions.find((s) => s.status === 'live');
  if (live) return { kind: 'sessionLive', session: live };
  const soon = snapshot.sessions
    .filter((s) => s.status === 'scheduled')
    .filter((s) => {
      const left = time(s.scheduledAt) - now;
      return left <= SOON_WINDOW_MS && left > -SOON_WINDOW_MS;
    })
    .sort((a, b) => time(a.scheduledAt) - time(b.scheduledAt))[0];
  if (soon) return { kind: 'sessionSoon', session: soon };
  const task = pickNextTask(snapshot.tasks);
  if (task) return { kind: 'nextTask', task };
  const upcoming = snapshot.sessions
    .filter((s) => s.status === 'scheduled' && time(s.scheduledAt) > now)
    .sort((a, b) => time(a.scheduledAt) - time(b.scheduledAt))[0];
  if (upcoming) return { kind: 'upcomingSession', session: upcoming };
  if (snapshot.contacts.length) return { kind: 'contactsNoTasks' };
  return { kind: 'empty' };
}

/**
 * Milisegundos hasta que `deriveBase` puede cambiar solo con el paso del tiempo (entrar o
 * salir de la ventana de «por empezar»). null si nada cambia por sí solo.
 */
export function msUntilBaseChanges(snapshot: HomeSnapshot | null, now: number): number | null {
  if (!snapshot) return null;
  const edges = snapshot.sessions
    .filter((s) => s.status === 'scheduled')
    .flatMap((s) => [time(s.scheduledAt) - SOON_WINDOW_MS, time(s.scheduledAt) + SOON_WINDOW_MS])
    .map((edge) => edge - now)
    .filter((ms) => ms > 0);
  return edges.length ? Math.min(...edges) : null;
}

// ── Escena ────────────────────────────────────────────────────────────────────

/** Estado completo de la home (regiones paralelas de la máquina). */
export interface HomeState {
  base: BaseState;
  /** Cola de «Te piden» (la primera es la que se acerca). */
  incoming: HomeRequest[];
  /** Contacto que me está enviando apoyo ahora. */
  supportFrom: string | null;
  celebrating: boolean;
}

export interface ScenePerson {
  id: 'me' | string;
  initials: string;
  /** `self` = melocotón de «tú». */
  color: 'self' | PersonColorId;
  /** El acompañante va en cursiva (canvas). */
  italic: boolean;
  /** Atenuada: contacto que hoy no está conectado. */
  dim: boolean;
}

export type SceneLayout = 'alone' | 'apart' | 'joined' | 'fused';

export type SceneCard =
  | { kind: 'request'; request: HomeRequest }
  | { kind: 'nextTask'; task: HomeTask }
  | { kind: 'session'; session: HomeSession; live: boolean };

/** Lo que lee VoiceOver; la app lo convierte en texto con strings/es.ts. */
export type SceneA11y =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'contacts'; present: string[]; absent: string[] }
  | { kind: 'alone' }
  | { kind: 'joined'; name: string; live: boolean; support: boolean; approaching?: string }
  | { kind: 'aloneApproached'; approaching: string };

export interface Scene {
  people: ScenePerson[];
  layout: SceneLayout;
  /** Forma que «se acerca» (te piden). */
  approach?: string;
  /** Corazón latiendo dentro de esa forma (te envían apoyo). */
  heart?: string;
  /** Pulso suave: sesión por empezar. */
  pulse: boolean;
  liveDot: boolean;
  celebrate: boolean;
  cards: SceneCard[];
  a11y: SceneA11y;
}

const ME: ScenePerson = { id: 'me', initials: '', color: 'self', italic: false, dim: false };

function personOf(p: HomePerson, opts: { italic: boolean; dim: boolean }): ScenePerson {
  return { id: p.id, initials: p.initials, color: p.color, ...opts };
}

/** Acompañante que «está» en la forma unida (no si rechazó o se fue). */
function activeCompanion(task: HomeTask): HomePerson | undefined {
  const c = task.companion;
  return c && (c.status === 'pending' || c.status === 'accepted') ? c : undefined;
}

/**
 * Escena de la home. Prioridad cuando coinciden regiones (doc 03): ¡hurra! > apoyo
 * (corazón) > «Te piden» (acercamiento y tarjeta primera) > base.
 * `me` lleva la inicial de la persona usuaria.
 */
export function describeScene(
  state: HomeState,
  snapshot: HomeSnapshot | null,
  me: { initials: string },
): Scene {
  const self: ScenePerson = { ...ME, initials: me.initials };
  const scene: Scene = {
    people: [self],
    layout: 'alone',
    pulse: false,
    liveDot: false,
    celebrate: state.celebrating,
    cards: [],
    a11y: { kind: 'alone' },
  };
  const base = state.base;

  switch (base.kind) {
    case 'loading':
      // Sin instantánea aún; lo que llegue en tiempo real («Te piden», apoyo) sí se muestra
      scene.a11y = { kind: 'loading' };
      break;
    case 'empty':
      scene.a11y = { kind: 'empty' };
      break;
    case 'contactsNoTasks': {
      const shown = (snapshot?.contacts ?? []).slice(0, MAX_SCENE_CONTACTS);
      scene.people.push(...shown.map((c) => personOf(c, { italic: true, dim: !c.present })));
      scene.layout = 'apart';
      scene.a11y = {
        kind: 'contacts',
        present: shown.filter((c) => c.present).map((c) => c.name),
        absent: shown.filter((c) => !c.present).map((c) => c.name),
      };
      break;
    }
    case 'nextTask': {
      const companion = activeCompanion(base.task);
      if (companion) {
        scene.people.push(personOf(companion, { italic: true, dim: false }));
        scene.layout = 'joined';
        scene.a11y = { kind: 'joined', name: companion.name, live: false, support: false };
      }
      scene.cards.push({ kind: 'nextTask', task: base.task });
      break;
    }
    case 'upcomingSession':
      scene.people.push(personOf(base.session.person, { italic: true, dim: false }));
      scene.layout = 'joined';
      scene.a11y = { kind: 'joined', name: base.session.person.name, live: false, support: false };
      scene.cards.push({ kind: 'session', session: base.session, live: false });
      break;
    case 'sessionSoon':
    case 'sessionLive': {
      const live = base.kind === 'sessionLive';
      scene.people.push(personOf(base.session.person, { italic: true, dim: false }));
      scene.layout = live ? 'fused' : 'joined';
      scene.pulse = !live;
      scene.liveDot = live;
      scene.a11y = { kind: 'joined', name: base.session.person.name, live, support: false };
      scene.cards.push({ kind: 'session', session: base.session, live });
      break;
    }
  }

  // «Te piden»: la forma de la primera persona se acerca (si no estaba, se añade; el
  // shader admite 4 formas) y sus tarjetas van primero
  const first = state.incoming[0];
  if (first) {
    if (!scene.people.some((p) => p.id === first.person.id)) {
      const asker = personOf(first.person, { italic: true, dim: false });
      // Con 3 contactos en reposo, quien pide ocupa el sitio del último
      if (scene.people.length > MAX_SCENE_CONTACTS) scene.people.pop();
      scene.people.push(asker);
    }
    scene.approach = first.person.id;
    scene.cards.unshift(
      ...state.incoming.map((request) => ({ kind: 'request' as const, request })),
    );
    scene.a11y =
      scene.a11y.kind === 'joined'
        ? { ...scene.a11y, approaching: first.person.name }
        : { kind: 'aloneApproached', approaching: first.person.name };
  }

  // Apoyo recibido: corazón dentro de la forma de quien lo envía (si está en escena)
  if (state.supportFrom && scene.people.some((p) => p.id === state.supportFrom)) {
    scene.heart = state.supportFrom;
    if (scene.a11y.kind === 'joined') scene.a11y = { ...scene.a11y, support: true };
  }

  return scene;
}
