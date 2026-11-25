/**
 * De la respuesta de GET /me/home (HomeDto) a la instantánea de las reglas puras.
 * Tipos estructurales: shared no depende del cliente generado.
 */
import type { PersonColorId } from '../theme/persons.ts';
import type { HomePerson, HomeSnapshot, HomeTask } from './scene.ts';

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

export interface HomeDtoLike {
  tasks: TaskLike[];
  contacts: ContactLike[];
  shared: TaskLike[];
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
    })),
    // Sesiones y apoyo llegan en las fases 4 y 5
    sessions: [],
    requests: dto.shared.flatMap((t) => {
      const person = t.person ? personOf(t.person) : null;
      return person
        ? [{ id: `task:${t.id}`, kind: 'task' as const, person, taskTitle: t.title }]
        : [];
    }),
  };
}
