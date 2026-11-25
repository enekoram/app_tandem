import { describe, expect, it } from 'vitest';
import { sceneGeometry, SCENE_H, SCENE_W } from './geometry.ts';
import { describeScene, type HomePerson, type HomeSnapshot, type HomeState } from './scene.ts';

const marta: HomePerson = { id: 'c-marta', name: 'Marta', initials: 'M', color: 'lilac' };
const juan: HomePerson = { id: 'c-juan', name: 'Juan', initials: 'J', color: 'sage' };
const snap = (extra: Partial<HomeSnapshot> = {}): HomeSnapshot => ({
  tasks: [],
  contacts: [],
  sessions: [],
  requests: [],
  ...extra,
});
const task = {
  id: 'renta',
  title: 'Hacer la renta',
  createdAt: '2026-11-25T08:00:00.000Z',
  companion: { ...marta, status: 'accepted' as const },
};
const geometry = (s: HomeSnapshot, base: HomeState['base'], extra: Partial<HomeState> = {}) =>
  sceneGeometry(
    describeScene({ base, incoming: [], supportFrom: null, celebrating: false, ...extra }, s, {
      initials: 'A',
    }),
  );
const request = (person: HomePerson) => ({
  id: `r-${person.id}`,
  kind: 'support' as const,
  person,
  taskTitle: 'x',
});

describe('sceneGeometry', () => {
  it('VacioHoy: tú sola y dos huecos discontinuos', () => {
    const g = geometry(snap(), { kind: 'empty' });
    expect(g.shapes.map((s) => s.id)).toEqual(['me']);
    expect(g.placeholders).toHaveLength(2);
  });

  it('siguiente tarea: tú y tu acompañante se tocan (para que el goo las una)', () => {
    const g = geometry(snap({ tasks: [task] }), { kind: 'nextTask', task });
    const [me, other] = g.shapes;
    expect(other).toMatchObject({ id: 'c-marta', united: true });
    const distance = Math.hypot(me!.cx - other!.cx, me!.cy - other!.cy);
    expect(distance).toBeLessThan(me!.r + other!.r);
  });

  it('con contactos: quien está, unida; quien no, suelta y atenuada', () => {
    const s = snap({ contacts: [{ ...marta, present: true }, juan] });
    const g = geometry(s, { kind: 'contactsNoTasks' });
    expect(g.shapes.find((x) => x.id === 'c-marta')).toMatchObject({ united: true, opacity: 1 });
    expect(g.shapes.find((x) => x.id === 'c-juan')).toMatchObject({ united: false, opacity: 0.55 });
  });

  it('te pide otra persona: tu acompañante sigue unida y quien pide llega suelta con ondas', () => {
    const g = geometry(
      snap({ tasks: [task] }),
      { kind: 'nextTask', task },
      {
        incoming: [request(juan)],
      },
    );
    expect(g.shapes.map((s) => [s.id, s.united, s.ripple])).toEqual([
      ['me', true, false],
      ['c-marta', true, false],
      ['c-juan', false, true],
    ]);
  });

  it('te pide tu acompañante: ondas en su forma, sin forma extra', () => {
    const g = geometry(
      snap({ tasks: [task] }),
      { kind: 'nextTask', task },
      {
        incoming: [request(marta)],
      },
    );
    expect(g.shapes).toHaveLength(2);
    expect(g.shapes[1]).toMatchObject({ id: 'c-marta', ripple: true });
  });

  it('en vivo: punto «En vivo» y formas dentro del lienzo', () => {
    const session = {
      id: 's',
      taskId: 'renta',
      taskTitle: 'x',
      scheduledAt: '2026-11-25T08:00:00.000Z',
      status: 'live' as const,
      person: marta,
    };
    const g = geometry(snap({ sessions: [session] }), { kind: 'sessionLive', session });
    expect(g.liveDot).not.toBeNull();
    for (const s of g.shapes) {
      expect(s.cx - s.r).toBeGreaterThanOrEqual(0);
      expect(s.cx + s.r).toBeLessThanOrEqual(SCENE_W);
      expect(s.cy + s.r).toBeLessThanOrEqual(SCENE_H);
    }
  });
});
