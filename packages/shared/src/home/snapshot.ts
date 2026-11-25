/**
 * De la respuesta de GET /me/home (HomeDto) a la instantánea de las reglas puras.
 * Tipos estructurales: shared no depende del cliente generado.
 */
import type { PersonColorId } from '../theme/persons.ts';
import type { HomePerson, HomeRequest, HomeSession, HomeSnapshot, HomeTask } from './scene.ts';

interface PersonLike {
  contactId: string | null;
  name: string;
  color: PersonColorId;
  initials: string;
}

interface TaskLike {
  id: string;
  title: string;
  dueAt: string | null;
  createdAt: string;
  companionStatus: string;
  person: PersonLike | null;
}

interface ContactLike {
  id: string;
  name: string;
  color: PersonColorId;
  initials: string;
}

interface SessionLike {
  id: string;
  taskId: string;
  taskTitle: string;
  scheduledAt: string;
  status: string;
  proposedByMe: boolean;
  person: PersonLike | null;
}

interface SupportRequestLike {
  id: string;
  taskTitle: string;
  person: PersonLike | null;
}

export interface HomeDtoLike {
  tasks: TaskLike[];
  support?: { incoming: SupportRequestLike[] };
  sessions?: SessionLike[];
  contacts: ContactLike[];
  shared: TaskLike[];
  /** Contactos con la app abierta ahora. */
  presentContactIds?: string[];
}

const COMPANION = ['pending', 'accepted', 'rejected', 'left'] as const;
type CompanionStatus = (typeof COMPANION)[number];
const isCompanionStatus = (s: string): s is CompanionStatus =>
  (COMPANION as readonly string[]).includes(s);

function personOf(p: PersonLike): HomePerson | null {
  return p.contactId
    ? { id: p.contactId, name: p.name, initials: p.initials, color: p.color }
    : null;
}

function taskOf(t: TaskLike): HomeTask {
  const person = t.person ? personOf(t.person) : null;
  return {
    id: t.id,
    title: t.title,
    dueAt: t.dueAt,
    createdAt: t.createdAt,
    companion:
      person && isCompanionStatus(t.companionStatus)
        ? { ...person, status: t.companionStatus }
        : null,
  };
}

export function toHomeSnapshot(dto: HomeDtoLike): HomeSnapshot {
  return {
    tasks: dto.tasks.map(taskOf),
    contacts: dto.contacts.map((c) => ({
      id: c.id,
      name: c.name,
      initials: c.initials,
      color: c.color,
      present: dto.presentContactIds?.includes(c.id) ?? false,
    })),
    sessions: (dto.sessions ?? []).flatMap((s): HomeSession[] => {
      const person = s.person ? personOf(s.person) : null;
      if (!person || (s.status !== 'accepted' && s.status !== 'live')) return [];
      return [
        {
          id: s.id,
          taskId: s.taskId,
          taskTitle: s.taskTitle,
          scheduledAt: s.scheduledAt,
          status: s.status === 'live' ? 'live' : 'scheduled',
          person,
        },
      ];
    }),
    // «Te piden»: invitaciones a sesión de la otra persona y tareas que me comparten
    requests: [
      // Apoyo primero: es lo más urgente
      ...(dto.support?.incoming ?? []).flatMap((r): HomeRequest[] => {
        const person = r.person ? personOf(r.person) : null;
        return person
          ? [{ id: `support:${r.id}`, kind: 'support', person, taskTitle: r.taskTitle }]
          : [];
      }),
      ...(dto.sessions ?? []).flatMap((s): HomeRequest[] => {
        const person = s.person ? personOf(s.person) : null;
        if (!person || s.status !== 'proposed' || s.proposedByMe) return [];
        return [
          {
            id: `session:${s.id}`,
            kind: 'session',
            person,
            taskTitle: s.taskTitle,
            scheduledAt: s.scheduledAt,
          },
        ];
      }),
      ...dto.shared.flatMap((t): HomeRequest[] => {
        const person = t.person ? personOf(t.person) : null;
        return person ? [{ id: `task:${t.id}`, kind: 'task', person, taskTitle: t.title }] : [];
      }),
    ],
  };
}
