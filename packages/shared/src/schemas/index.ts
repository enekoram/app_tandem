/**
 * Esquemas Zod de las peticiones: los usa la API para validar (y documentar en OpenAPI)
 * y la app para validar formularios antes de enviar.
 */
import { z } from 'zod';
import { CONTACT_NAME_MAX } from '../rules/contacts.ts';
import { TASK_DESCRIPTION_MAX, TASK_TITLE_MAX } from '../rules/tasks.ts';
import { DISPLAY_NAME_MAX } from '../rules/users.ts';
import { SESSION_DURATIONS, SESSION_MESSAGE_MAX } from '../rules/sessions.ts';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'identificador no válido');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'email no válido' }));

export const createContactSchema = z.object({
  name: z.string().trim().min(1).max(CONTACT_NAME_MAX),
  email: emailSchema,
});
export type CreateContactInput = z.input<typeof createContactSchema>;

/** Texto opcional: vacío o solo espacios cuenta como «sin descripción». */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(TASK_TITLE_MAX),
  description: optionalText(TASK_DESCRIPTION_MAX),
  /** Fecha y hora opcionales (ISO 8601 con zona). */
  dueAt: z.iso.datetime({ offset: true }).optional(),
  /** Persona acompañante: obligatoria (canvas «Nueva tarea»). */
  companionContactId: objectIdSchema,
});
export type CreateTaskInput = z.input<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(TASK_TITLE_MAX).optional(),
  description: z.string().trim().max(TASK_DESCRIPTION_MAX).nullable().optional(),
  dueAt: z.iso.datetime({ offset: true }).nullable().optional(),
  companionContactId: objectIdSchema.optional(),
});
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;

/** Editar perfil: de momento solo el nombre (el email es de solo lectura, la foto se aplaza). */
export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(DISPLAY_NAME_MAX),
});
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;

const futureIso = z.iso.datetime({ offset: true });
const sessionMessage = optionalText(SESSION_MESSAGE_MAX);
const meetUrlSchema = z
  .url({ protocol: /^https$/, error: 'enlace no válido' })
  .max(300)
  .optional();

/** Programar sesión: sobre una tarea; la otra persona es quien la acompaña (o su dueña). */
export const createSessionSchema = z.object({
  taskId: objectIdSchema,
  scheduledAt: futureIso,
  durationMin: z
    .number()
    .refine((n) => (SESSION_DURATIONS as readonly number[]).includes(n))
    .optional(),
  /** Enlace de videollamada (Meet) pegado a mano mientras Google no está verificado. */
  meetUrl: meetUrlSchema,
});
export type CreateSessionInput = z.input<typeof createSessionSchema>;

/** Proponer otra hora / reprogramar. */
export const proposeTimeSchema = z.object({
  scheduledAt: futureIso,
  message: sessionMessage,
});
export type ProposeTimeInput = z.input<typeof proposeTimeSchema>;
