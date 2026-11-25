import { describe, expect, it } from 'vitest';
import {
  deriveBase,
  describeScene,
  msUntilBaseChanges,
  pickNextTask,
  sortOpenTasks,
  SOON_WINDOW_MS,
  type HomePerson,
  type HomeRequest,
  type HomeSession,
  type HomeSnapshot,
  type HomeState,
  type HomeTask,
} from './scene.ts';

const NOW = new Date('2026-11-25T09:15:00+01:00').getTime();
const at = (min: number) => new Date(NOW + min * 60_000).toISOString();

const marta: HomePerson = { id: 'c-marta', name: 'Marta', initials: 'M', color: 'lilac' };
const juan: HomePerson = { id: 'c-juan', name: 'Juan', initials: 'J', color: 'sage' };
const lucia: HomePerson = { id: 'c-lucia', name: 'Lucía', initials: 'L', color: 'ochre' };

const task = (id: string, extra: Partial<HomeTask> = {}): HomeTask => ({
  id,
  title: id,
  createdAt: at(-60),
  companion: { ...marta, status: 'accepted' },
  ...extra,
});
const session = (extra: Partial<HomeSession> = {}): HomeSession => ({
  id: 's1',
  taskId: 'renta',
  taskTitle: 'Hacer la renta',
  scheduledAt: at(15),
  status: 'scheduled',
  person: marta,
  ...extra,
});
const snap = (extra: Partial<HomeSnapshot> = {}): HomeSnapshot => ({
  tasks: [],
  contacts: [],
  sessions: [],
  requests: [],
  ...extra,
});
const request = (person: HomePerson, kind: HomeRequest['kind'] = 'support'): HomeRequest => ({
  id: `r-${person.id}`,
  kind,
  person,
  taskTitle: 'Estudiar inglés',
});

describe('pickNextTask', () => {
  it.each([
    ['ninguna', [], undefined],
    [
      'la de fecha más cercana, aunque haya otras sin fecha',
      [task('a'), task('b', { dueAt: at(120) }), task('c', { dueAt: at(30) })],
      'c',
    ],
    [
      'una vencida va antes que una futura',
      [task('futura', { dueAt: at(30) }), task('vencida', { dueAt: at(-30) })],
      'vencida',
    ],
    [
      'sin fechas: la más reciente',
      [task('vieja', { createdAt: at(-300) }), task('nueva', { createdAt: at(-5) })],
      'nueva',
    ],
  ] as const)('%s', (_, tasks, expected) => {
    expect(pickNextTask(tasks)?.id).toBe(expected);
  });
});

describe('sortOpenTasks', () => {
  it('con fecha por cercanía y después sin fecha de la más reciente; también con Date', () => {
    const tasks = [
      { id: 'sin-vieja', createdAt: new Date(NOW - 300_000), dueAt: null },
      { id: 'tarde', createdAt: new Date(NOW), dueAt: new Date(NOW + 7_200_000) },
      { id: 'sin-nueva', createdAt: new Date(NOW - 1_000) },
      { id: 'pronto', createdAt: new Date(NOW), dueAt: new Date(NOW + 60_000) },
    ];
    expect(sortOpenTasks(tasks).map((t) => t.id)).toEqual([
      'pronto',
      'tarde',
      'sin-nueva',
      'sin-vieja',
    ]);
  });
});

describe('deriveBase', () => {
  it.each([
    ['sin instantánea → loading', null, 'loading'],
    ['nada → empty', snap(), 'empty'],
    ['contactos sin tareas → contactsNoTasks', snap({ contacts: [marta] }), 'contactsNoTasks'],
    ['con tarea → nextTask', snap({ contacts: [marta], tasks: [task('renta')] }), 'nextTask'],
    [
      'sesión dentro de 10 min → sessionSoon',
      snap({ tasks: [task('renta')], sessions: [session({ scheduledAt: at(10) })] }),
      'sessionSoon',
    ],
    [
      'sesión a 11 min → aún nextTask',
      snap({ tasks: [task('renta')], sessions: [session({ scheduledAt: at(11) })] }),
      'nextTask',
    ],
    [
      'sesión que empezó hace 5 min sin estar en vivo → sessionSoon',
      snap({ sessions: [session({ scheduledAt: at(-5) })] }),
      'sessionSoon',
    ],
    [
      'sesión olvidada hace 20 min → ya no',
      snap({ sessions: [session({ scheduledAt: at(-20) })] }),
      'empty',
    ],
    [
      'en vivo gana a todo',
      snap({
        tasks: [task('renta')],
        sessions: [session({ scheduledAt: at(5) }), session({ id: 's2', status: 'live' })],
      }),
      'sessionLive',
    ],
  ] as const)('%s', (_, snapshot, kind) => {
    expect(deriveBase(snapshot, NOW).kind).toBe(kind);
  });

  it('nextTask lleva la tarea elegida', () => {
    const base = deriveBase(snap({ tasks: [task('a'), task('b', { dueAt: at(30) })] }), NOW);
    expect(base).toMatchObject({ kind: 'nextTask', task: { id: 'b' } });
  });
});

describe('msUntilBaseChanges', () => {
  it('avisa al entrar en la ventana de «por empezar» y al salir', () => {
    const s = snap({ sessions: [session({ scheduledAt: at(25) })] });
    expect(msUntilBaseChanges(s, NOW)).toBe(15 * 60_000);
    expect(msUntilBaseChanges(s, NOW + 15 * 60_000 + 1)).toBe(2 * SOON_WINDOW_MS - 1);
  });

  it('sin sesiones programadas no hay nada que vigilar', () => {
    expect(msUntilBaseChanges(snap({ tasks: [task('a')] }), NOW)).toBeNull();
    expect(msUntilBaseChanges(null, NOW)).toBeNull();
  });
});

describe('describeScene', () => {
  const me = { initials: 'A' };
  const state = (s: HomeSnapshot | null, extra: Partial<HomeState> = {}): HomeState => ({
    base: deriveBase(s, NOW),
    incoming: [],
    supportFrom: null,
    celebrating: false,
    ...extra,
  });
  const scene = (s: HomeSnapshot | null, extra: Partial<HomeState> = {}) =>
    describeScene(state(s, extra), s, me);

  it('VacioHoy: tú sola, sin tarjetas', () => {
    const sc = scene(snap());
    expect(sc.layout).toBe('alone');
    expect(sc.people).toEqual([
      { id: 'me', initials: 'A', color: 'self', italic: false, dim: false },
    ]);
    expect(sc.cards).toEqual([]);
    expect(sc.a11y).toEqual({ kind: 'empty' });
  });

  it('VacioHoyContactos: separadas; quien no está, atenuada; como mucho 3', () => {
    const extra: HomePerson = { id: 'c-x', name: 'X', initials: 'X', color: 'sea' };
    const sc = scene(snap({ contacts: [{ ...marta, present: true }, juan, lucia, extra] }));
    expect(sc.layout).toBe('apart');
    expect(sc.people.map((p) => [p.id, p.dim])).toEqual([
      ['me', false],
      ['c-marta', false],
      ['c-juan', true],
      ['c-lucia', true],
    ]);
    expect(sc.a11y).toEqual({ kind: 'contacts', present: ['Marta'], absent: ['Juan', 'Lucía'] });
  });

  it('siguiente tarea con acompañante: unidas, en cursiva, y su tarjeta', () => {
    const sc = scene(snap({ tasks: [task('renta')] }));
    expect(sc.layout).toBe('joined');
    expect(sc.people[1]).toMatchObject({ id: 'c-marta', italic: true, color: 'lilac' });
    expect(sc.cards).toEqual([
      { kind: 'nextTask', task: expect.objectContaining({ id: 'renta' }) },
    ]);
    expect(sc.a11y).toEqual({ kind: 'joined', name: 'Marta', live: false, support: false });
  });

  it.each(['rejected', 'left'] as const)('si el acompañante %s, tú sola con la tarea', (status) => {
    const sc = scene(snap({ tasks: [task('renta', { companion: { ...marta, status } })] }));
    expect(sc.layout).toBe('alone');
    expect(sc.cards).toHaveLength(1);
  });

  it('sesión por empezar: pulso suave; en vivo: fusionadas con el punto', () => {
    const soon = scene(snap({ sessions: [session({ scheduledAt: at(5) })] }));
    expect(soon).toMatchObject({ layout: 'joined', pulse: true, liveDot: false });
    const live = scene(snap({ sessions: [session({ status: 'live' })] }));
    expect(live).toMatchObject({ layout: 'fused', pulse: false, liveDot: true });
    expect(live.a11y).toMatchObject({ live: true });
  });

  it('te piden: quien pide se acerca junto a tu acompañante y sus tarjetas van primero', () => {
    const s = snap({ tasks: [task('renta')] });
    const sc = scene(s, { incoming: [request(juan), request(marta, 'session')] });
    expect(sc.approach).toBe('c-juan');
    expect(sc.layout).toBe('joined');
    expect(sc.people.map((p) => p.id)).toEqual(['me', 'c-marta', 'c-juan']);
    expect(sc.cards.map((c) => c.kind)).toEqual(['request', 'request', 'nextTask']);
    expect(sc.a11y).toEqual({
      kind: 'joined',
      name: 'Marta',
      live: false,
      support: false,
      approaching: 'Juan',
    });
  });

  it('te piden sin tareas: tú y quien pide', () => {
    const sc = scene(snap(), { incoming: [request(juan)] });
    expect(sc.people.map((p) => p.id)).toEqual(['me', 'c-juan']);
    expect(sc.a11y).toEqual({ kind: 'aloneApproached', approaching: 'Juan' });
  });

  it('con 3 contactos en reposo, quien pide ocupa el sitio del último (máx. 4 formas)', () => {
    const extra: HomePerson = { id: 'c-x', name: 'X', initials: 'X', color: 'sea' };
    const sc = scene(snap({ contacts: [marta, lucia, extra] }), { incoming: [request(juan)] });
    expect(sc.people.map((p) => p.id)).toEqual(['me', 'c-marta', 'c-lucia', 'c-juan']);
  });

  it('te pide quien ya está unida: sigue unida y se anuncia', () => {
    const sc = scene(snap({ tasks: [task('renta')] }), { incoming: [request(marta)] });
    expect(sc.layout).toBe('joined');
    expect(sc.approach).toBe('c-marta');
    expect(sc.a11y).toMatchObject({ kind: 'joined', approaching: 'Marta' });
  });

  it('apoyo: corazón dentro de su forma; si no está en escena, no hay corazón', () => {
    const s = snap({ tasks: [task('renta')] });
    const sc = scene(s, { supportFrom: 'c-marta' });
    expect(sc.heart).toBe('c-marta');
    expect(sc.a11y).toMatchObject({ support: true });
    expect(scene(s, { supportFrom: 'c-juan' }).heart).toBeUndefined();
  });

  it('¡hurra! se marca sin cambiar la forma', () => {
    const sc = scene(snap({ tasks: [task('renta')] }), { celebrating: true });
    expect(sc).toMatchObject({ celebrate: true, layout: 'joined' });
  });

  it('cargando: solo tú, sin tarjetas', () => {
    expect(scene(null)).toMatchObject({ layout: 'alone', cards: [], a11y: { kind: 'loading' } });
  });

  it('cargando, pero ya llega una petición en tiempo real: se muestra', () => {
    const sc = scene(null, { incoming: [request(juan)] });
    expect(sc.cards.map((c) => c.kind)).toEqual(['request']);
    expect(sc.approach).toBe('c-juan');
  });
});

describe('sesión aceptada más adelante (quien acompaña, sin tareas propias)', () => {
  const me = { initials: 'A' };
  const tomorrow = session({ scheduledAt: at(24 * 60) });

  it('deriveBase: upcomingSession; con tarea propia, manda la tarea', () => {
    expect(deriveBase(snap({ contacts: [marta], sessions: [tomorrow] }), NOW).kind).toBe(
      'upcomingSession',
    );
    expect(deriveBase(snap({ tasks: [task('renta')], sessions: [tomorrow] }), NOW).kind).toBe(
      'nextTask',
    );
  });

  it('describeScene: unidas, sin pulso, con la tarjeta de la sesión', () => {
    const s = snap({ contacts: [marta], sessions: [tomorrow] });
    const sc = describeScene(
      { base: deriveBase(s, NOW), incoming: [], supportFrom: null, celebrating: false },
      s,
      me,
    );
    expect(sc).toMatchObject({ layout: 'joined', pulse: false, liveDot: false });
    expect(sc.people.map((p) => p.id)).toEqual(['me', 'c-marta']);
    expect(sc.cards.map((c) => c.kind)).toEqual(['session']);
  });
});
