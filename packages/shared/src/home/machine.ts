/**
 * Máquina de la Home (doc 03): regiones paralelas. La región `base` no se acumula con
 * eventos sueltos: se recalcula con `deriveBase` cada vez que llega una instantánea o pasa
 * el tiempo (TICK). Las horas llegan en los eventos para que sea pura y testeable.
 */
import { assign, setup, type SnapshotFrom } from 'xstate';
import {
  deriveBase,
  type BaseState,
  type HomeRequest,
  type HomeSnapshot,
  type HomeState,
} from './scene.ts';

/** Sin latido de apoyo en este tiempo, se deja de mostrar el corazón. */
export const SUPPORT_TIMEOUT_MS = 6_000;
/** Cada aviso efímero («Juan pensó en ti»). */
export const TOAST_MS = 4_000;
/** ¡hurra! breve. */
export const HURRA_MS = 2_500;

export interface HomeToast {
  id: string;
  kind: 'thoughtOfYou';
  name: string;
}

export interface HomeContext {
  snapshot: HomeSnapshot | null;
  base: BaseState;
  /** Cola de «Te piden» (FIFO). */
  incoming: HomeRequest[];
  supportFrom: string | null;
  toasts: HomeToast[];
}

export type HomeEvent =
  | { type: 'SNAPSHOT'; snapshot: HomeSnapshot; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'SUPPORT_REQUESTED'; request: HomeRequest }
  | { type: 'REQUEST_RESOLVED'; id: string }
  | { type: 'SUPPORT_STARTED'; from: string }
  | { type: 'SUPPORT_HEARTBEAT'; from: string }
  | { type: 'SUPPORT_ENDED'; from: string }
  | { type: 'THOUGHT_OF_YOU'; toast: HomeToast }
  | { type: 'TOAST_DISMISSED' }
  | { type: 'HURRA' };

/**
 * Cola tras una instantánea: el servidor manda (lo que ya no está, sale), pero se respeta
 * el orden en que llegaron las que ya estaban; las nuevas van al final.
 */
export function syncQueue(
  queue: readonly HomeRequest[],
  fresh: readonly HomeRequest[],
): HomeRequest[] {
  const kept = queue.filter((q) => fresh.some((f) => f.id === q.id));
  const added = fresh.filter((f) => !queue.some((q) => q.id === f.id));
  return [...kept, ...added];
}

export const homeMachine = setup({
  types: {
    context: {} as HomeContext,
    events: {} as HomeEvent,
  },
  guards: {
    hasIncoming: ({ context }) => context.incoming.length > 0,
    noIncoming: ({ context }) => context.incoming.length === 0,
    hasToasts: ({ context }) => context.toasts.length > 0,
    fromCurrent: ({ context, event }) => 'from' in event && event.from === context.supportFrom,
  },
  actions: {
    setSupport: assign({
      supportFrom: ({ event }) => ('from' in event ? event.from : null),
    }),
    clearSupport: assign({ supportFrom: null }),
    nextToast: assign({ toasts: ({ context }) => context.toasts.slice(1) }),
  },
  delays: {
    support: SUPPORT_TIMEOUT_MS,
    toast: TOAST_MS,
    hurra: HURRA_MS,
  },
}).createMachine({
  id: 'home',
  type: 'parallel',
  context: {
    snapshot: null,
    base: { kind: 'loading' },
    incoming: [],
    supportFrom: null,
    toasts: [],
  },
  on: {
    SNAPSHOT: {
      actions: assign(({ context, event }) => ({
        snapshot: event.snapshot,
        base: deriveBase(event.snapshot, event.now),
        incoming: syncQueue(context.incoming, event.snapshot.requests),
      })),
    },
    TICK: {
      actions: assign({ base: ({ context, event }) => deriveBase(context.snapshot, event.now) }),
    },
    SUPPORT_REQUESTED: {
      actions: assign({
        incoming: ({ context, event }) =>
          syncQueue(context.incoming, [...context.incoming, event.request]),
      }),
    },
    REQUEST_RESOLVED: {
      actions: assign({
        incoming: ({ context, event }) => context.incoming.filter((r) => r.id !== event.id),
      }),
    },
    THOUGHT_OF_YOU: {
      actions: assign({ toasts: ({ context, event }) => [...context.toasts, event.toast] }),
    },
  },
  states: {
    incoming: {
      initial: 'idle',
      states: {
        idle: { always: { target: 'requested', guard: 'hasIncoming' } },
        requested: { always: { target: 'idle', guard: 'noIncoming' } },
      },
    },
    support: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            SUPPORT_STARTED: { target: 'receiving', actions: 'setSupport' },
            SUPPORT_HEARTBEAT: { target: 'receiving', actions: 'setSupport' },
          },
        },
        receiving: {
          after: { support: { target: 'idle', actions: 'clearSupport' } },
          on: {
            // Cada latido reinicia la cuenta de 6 s
            SUPPORT_STARTED: { target: 'receiving', reenter: true, actions: 'setSupport' },
            SUPPORT_HEARTBEAT: { target: 'receiving', reenter: true, actions: 'setSupport' },
            SUPPORT_ENDED: { target: 'idle', guard: 'fromCurrent', actions: 'clearSupport' },
          },
        },
      },
    },
    toasts: {
      initial: 'idle',
      states: {
        idle: { always: { target: 'showing', guard: 'hasToasts' } },
        showing: {
          after: { toast: { target: 'idle', actions: 'nextToast' } },
          on: { TOAST_DISMISSED: { target: 'idle', actions: 'nextToast' } },
        },
      },
    },
    celebration: {
      initial: 'idle',
      states: {
        idle: { on: { HURRA: 'hurra' } },
        hurra: {
          after: { hurra: 'idle' },
          on: { HURRA: { target: 'hurra', reenter: true } },
        },
      },
    },
  },
});

export type HomeMachineSnapshot = SnapshotFrom<typeof homeMachine>;

/** Lo que necesita `describeScene` a partir del estado de la máquina. */
export function selectHomeState(state: HomeMachineSnapshot): HomeState {
  return {
    base: state.context.base,
    incoming: state.context.incoming,
    supportFrom: state.matches({ support: 'receiving' }) ? state.context.supportFrom : null,
    celebrating: state.matches({ celebration: 'hurra' }),
  };
}

/** Aviso que se está mostrando (el primero de la cola). */
export function selectToast(state: HomeMachineSnapshot): HomeToast | null {
  return state.matches({ toasts: 'showing' }) ? (state.context.toasts[0] ?? null) : null;
}
