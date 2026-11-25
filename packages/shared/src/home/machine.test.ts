import { getShortestPaths } from '@xstate/graph';
import { describe, expect, it } from 'vitest';
import { createActor, SimulatedClock } from 'xstate';
import {
  HURRA_MS,
  homeMachine,
  selectHomeState,
  selectToast,
  SUPPORT_TIMEOUT_MS,
  syncQueue,
  TOAST_MS,
  type HomeEvent,
} from './machine.ts';
import {
  describeScene,
  SOON_WINDOW_MS,
  type HomePerson,
  type HomeRequest,
  type HomeSnapshot,
} from './scene.ts';
import { toHomeSnapshot } from './snapshot.ts';

const NOW = new Date('2026-11-25T09:15:00+01:00').getTime();
const marta: HomePerson = { id: 'c-marta', name: 'Marta', initials: 'M', color: 'lilac' };
const juan: HomePerson = { id: 'c-juan', name: 'Juan', initials: 'J', color: 'sage' };
const req = (person: HomePerson, id = `r-${person.id}`): HomeRequest => ({
  id,
  kind: 'support',
  person,
  taskTitle: 'Estudiar inglés',
});
const snap = (extra: Partial<HomeSnapshot> = {}): HomeSnapshot => ({
  tasks: [],
  contacts: [],
  sessions: [],
  requests: [],
  ...extra,
});
const withTask = snap({
  contacts: [marta],
  tasks: [
    {
      id: 'renta',
      title: 'Hacer la renta',
      createdAt: new Date(NOW).toISOString(),
      companion: { ...marta, status: 'accepted' },
    },
  ],
});

function start() {
  const clock = new SimulatedClock();
  const actor = createActor(homeMachine, { clock }).start();
  return { actor, clock, home: () => selectHomeState(actor.getSnapshot()) };
}

describe('homeMachine', () => {
  it('arranca cargando y la instantánea decide la base', () => {
    const { actor, home } = start();
    expect(home().base.kind).toBe('loading');
    actor.send({ type: 'SNAPSHOT', snapshot: withTask, now: NOW });
    expect(home().base.kind).toBe('nextTask');
  });

  it('TICK cruza el umbral de «por empezar» sin nueva instantánea', () => {
    const { actor, home } = start();
    const at = new Date(NOW + 15 * 60_000).toISOString();
    actor.send({
      type: 'SNAPSHOT',
      snapshot: snap({
        sessions: [
          {
            id: 's',
            taskId: 't',
            taskTitle: 'T',
            scheduledAt: at,
            status: 'scheduled',
            person: marta,
          },
        ],
      }),
      now: NOW,
    });
    expect(home().base.kind).toBe('empty');
    actor.send({ type: 'TICK', now: NOW + 15 * 60_000 - SOON_WINDOW_MS });
    expect(home().base.kind).toBe('sessionSoon');
  });

  it('«Te piden»: cola FIFO; al resolver la última vuelve a idle', () => {
    const { actor, home } = start();
    actor.send({ type: 'SUPPORT_REQUESTED', request: req(juan) });
    actor.send({ type: 'SUPPORT_REQUESTED', request: req(marta) });
    actor.send({ type: 'SUPPORT_REQUESTED', request: req(juan) }); // repetida: no se duplica
    expect(actor.getSnapshot().matches({ incoming: 'requested' })).toBe(true);
    expect(home().incoming.map((r) => r.person.name)).toEqual(['Juan', 'Marta']);
    actor.send({ type: 'REQUEST_RESOLVED', id: 'r-c-juan' });
    actor.send({ type: 'REQUEST_RESOLVED', id: 'r-c-marta' });
    expect(actor.getSnapshot().matches({ incoming: 'idle' })).toBe(true);
  });

  it('la instantánea sincroniza la cola respetando el orden de llegada', () => {
    expect(
      syncQueue([req(juan), req(marta)], [req(marta), req(juan, 'nueva')]).map((r) => r.id),
    ).toEqual(['r-c-marta', 'nueva']);
  });

  it('apoyo: corazón mientras hay latido; sin latido en 6 s se apaga', () => {
    const { actor, clock, home } = start();
    actor.send({ type: 'SNAPSHOT', snapshot: withTask, now: NOW });
    actor.send({ type: 'SUPPORT_STARTED', from: 'c-marta' });
    clock.increment(SUPPORT_TIMEOUT_MS - 1);
    actor.send({ type: 'SUPPORT_HEARTBEAT', from: 'c-marta' });
    clock.increment(SUPPORT_TIMEOUT_MS - 1);
    expect(home().supportFrom).toBe('c-marta');
    clock.increment(2);
    expect(home().supportFrom).toBeNull();
  });

  it('SUPPORT_ENDED de otra persona no apaga el apoyo en curso', () => {
    const { actor, home } = start();
    actor.send({ type: 'SUPPORT_STARTED', from: 'c-marta' });
    actor.send({ type: 'SUPPORT_ENDED', from: 'c-juan' });
    expect(home().supportFrom).toBe('c-marta');
    actor.send({ type: 'SUPPORT_ENDED', from: 'c-marta' });
    expect(home().supportFrom).toBeNull();
  });

  it('llega apoyo durante la transición nextTask → sessionLive: se conservan los dos', () => {
    const { actor, home } = start();
    actor.send({ type: 'SNAPSHOT', snapshot: withTask, now: NOW });
    actor.send({ type: 'SUPPORT_STARTED', from: 'c-marta' });
    actor.send({
      type: 'SNAPSHOT',
      snapshot: {
        ...withTask,
        sessions: [
          {
            id: 's',
            taskId: 'renta',
            taskTitle: 'Hacer la renta',
            scheduledAt: new Date(NOW).toISOString(),
            status: 'live',
            person: marta,
          },
        ],
      },
      now: NOW,
    });
    const scene = describeScene(home(), withTask, { initials: 'A' });
    expect(home().base.kind).toBe('sessionLive');
    expect(scene).toMatchObject({ layout: 'fused', liveDot: true, heart: 'c-marta' });
  });

  it('avisos: uno detrás de otro, 4 s cada uno o hasta descartarlo', () => {
    const { actor, clock } = start();
    const toast = (id: string, name: string) =>
      actor.send({ type: 'THOUGHT_OF_YOU', toast: { id, kind: 'thoughtOfYou', name } });
    toast('1', 'Juan');
    toast('2', 'Marta');
    expect(selectToast(actor.getSnapshot())?.name).toBe('Juan');
    clock.increment(TOAST_MS);
    expect(selectToast(actor.getSnapshot())?.name).toBe('Marta');
    actor.send({ type: 'TOAST_DISMISSED' });
    expect(selectToast(actor.getSnapshot())).toBeNull();
  });

  it('¡hurra! dura 2,5 s y otro lo alarga', () => {
    const { actor, clock, home } = start();
    actor.send({ type: 'HURRA' });
    clock.increment(HURRA_MS - 100);
    actor.send({ type: 'HURRA' });
    clock.increment(HURRA_MS - 100);
    expect(home().celebrating).toBe(true);
    clock.increment(200);
    expect(home().celebrating).toBe(false);
  });

  it('modelo: todas las combinaciones alcanzables desde loading dan una escena válida', () => {
    const events: HomeEvent[] = [
      { type: 'SNAPSHOT', snapshot: withTask, now: NOW },
      { type: 'SNAPSHOT', snapshot: snap(), now: NOW },
      { type: 'SUPPORT_REQUESTED', request: req(juan) },
      { type: 'REQUEST_RESOLVED', id: 'r-c-juan' },
      { type: 'SUPPORT_STARTED', from: 'c-marta' },
      { type: 'SUPPORT_ENDED', from: 'c-marta' },
      { type: 'THOUGHT_OF_YOU', toast: { id: 't', kind: 'thoughtOfYou', name: 'Juan' } },
      { type: 'TOAST_DISMISSED' },
      { type: 'HURRA' },
    ];
    const paths = getShortestPaths(homeMachine, {
      events,
      // Estados distintos según regiones y lo que cambia la escena; las colas, como 0, 1 o
      // «varias» (si no, cada aviso más sería un estado nuevo y no acabaría nunca)
      serializeState: (s) =>
        JSON.stringify([
          s.value,
          s.context.base.kind,
          Math.min(s.context.incoming.length, 2),
          Math.min(s.context.toasts.length, 2),
        ]),
    });
    expect(paths.length).toBeGreaterThan(10);
    for (const path of paths) {
      const home = selectHomeState(path.state);
      const scene = describeScene(home, path.state.context.snapshot, { initials: 'A' });
      expect(scene.people[0]?.id).toBe('me');
      expect(scene.people.length).toBeLessThanOrEqual(4);
      // «Te piden» primero en el carrusel
      const firstRequest = scene.cards.findIndex((c) => c.kind === 'request');
      if (home.incoming.length) expect(firstRequest).toBe(0);
    }
  });
});

describe('toHomeSnapshot', () => {
  it('convierte la respuesta de /me/home; lo compartido pasa a «Te piden»', () => {
    const s = toHomeSnapshot({
      tasks: [
        {
          id: 't1',
          title: 'Hacer la renta',
          dueAt: null,
          createdAt: '2026-11-25T08:00:00.000Z',
          companionStatus: 'accepted',
          person: { contactId: 'c-marta', name: 'Marta', color: 'lilac', initials: 'M' },
        },
        {
          id: 't2',
          title: 'Sola',
          dueAt: null,
          createdAt: '2026-11-25T08:00:00.000Z',
          companionStatus: 'none',
          person: null,
        },
      ],
      contacts: [{ id: 'c-marta', name: 'Marta', color: 'lilac', initials: 'M' }],
      shared: [
        {
          id: 't3',
          title: 'Ir a correr',
          dueAt: null,
          createdAt: '2026-11-25T08:00:00.000Z',
          companionStatus: 'pending',
          person: { contactId: 'c-juan', name: 'Juan', color: 'sage', initials: 'J' },
        },
      ],
    });
    expect(s.tasks[0]?.companion).toMatchObject({ id: 'c-marta', status: 'accepted' });
    expect(s.contacts[0]?.present).toBe(false);
    expect(
      toHomeSnapshot({
        tasks: [],
        shared: [],
        contacts: [{ id: 'c-marta', name: 'Marta', color: 'lilac', initials: 'M' }],
        presentContactIds: ['c-marta'],
      }).contacts[0]?.present,
    ).toBe(true);
    expect(s.tasks[1]?.companion).toBeNull();
    expect(s.requests).toEqual([
      {
        id: 'task:t3',
        kind: 'task',
        person: { id: 'c-juan', name: 'Juan', initials: 'J', color: 'sage' },
        taskTitle: 'Ir a correr',
      },
    ]);
  });
});
