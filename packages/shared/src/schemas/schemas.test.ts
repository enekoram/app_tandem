import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  createContactSchema,
  createSessionSchema,
  createTaskSchema,
  proposeTimeSchema,
  updateProfileSchema,
} from './index.ts';
import { effectiveSessionStatus } from '../rules/sessions.ts';

describe('createContactSchema', () => {
  it('normaliza el email y recorta el nombre', () => {
    expect(createContactSchema.parse({ name: '  Lucía ', email: ' Lucia@Email.COM ' })).toEqual({
      name: 'Lucía',
      email: 'lucia@email.com',
    });
  });

  it('rechaza email no válido y nombre vacío', () => {
    expect(createContactSchema.safeParse({ name: 'Lucía', email: 'lucia@' }).success).toBe(false);
    expect(createContactSchema.safeParse({ name: '  ', email: 'l@e.com' }).success).toBe(false);
  });
});

describe('createTaskSchema', () => {
  const companionContactId = '665f1c2e8b3a4d0012345678';

  it('exige título y acompañante; la descripción vacía desaparece', () => {
    expect(
      createTaskSchema.parse({ title: ' Hacer la renta ', description: '  ', companionContactId }),
    ).toEqual({ title: 'Hacer la renta', companionContactId });
    expect(createTaskSchema.safeParse({ title: 'x' }).success).toBe(false);
  });

  it('acepta fecha ISO con zona y rechaza otras', () => {
    const ok = { title: 'x', companionContactId, dueAt: '2026-11-25T09:30:00+01:00' };
    expect(createTaskSchema.safeParse(ok).success).toBe(true);
    expect(createTaskSchema.safeParse({ ...ok, dueAt: 'mañana' }).success).toBe(false);
  });

  it('se puede convertir a JSON Schema para OpenAPI', () => {
    const schema = z.toJSONSchema(createTaskSchema, { target: 'openapi-3.0', io: 'input' });
    expect(schema).toMatchObject({ type: 'object', required: ['title', 'companionContactId'] });
  });
});

describe('updateProfileSchema', () => {
  it('recorta espacios y exige de 1 a 40 caracteres', () => {
    expect(updateProfileSchema.parse({ displayName: '  Ana  ' })).toEqual({ displayName: 'Ana' });
    expect(updateProfileSchema.safeParse({ displayName: '   ' }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ displayName: 'a'.repeat(41) }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ displayName: 'a'.repeat(40) }).success).toBe(true);
  });
});

describe('sesiones', () => {
  const id = '665f1c2e8b3a4d0012345678';
  it('programar: tarea, hora con zona, duración permitida y enlace https opcional', () => {
    expect(
      createSessionSchema.safeParse({ taskId: id, scheduledAt: '2026-11-26T15:00:00+01:00' })
        .success,
    ).toBe(true);
    expect(
      createSessionSchema.safeParse({ taskId: id, scheduledAt: '2026-11-26T15:00:00' }).success,
    ).toBe(false);
    expect(
      createSessionSchema.safeParse({
        taskId: id,
        scheduledAt: '2026-11-26T15:00:00Z',
        durationMin: 30,
      }).success,
    ).toBe(false);
    expect(
      createSessionSchema.safeParse({
        taskId: id,
        scheduledAt: '2026-11-26T15:00:00Z',
        meetUrl: 'http://meet.google.com/abc',
      }).success,
    ).toBe(false);
  });

  it('proponer hora: mensaje opcional, vacío = sin mensaje', () => {
    expect(proposeTimeSchema.parse({ scheduledAt: '2026-11-26T15:00:00Z', message: '  ' })).toEqual(
      { scheduledAt: '2026-11-26T15:00:00Z' },
    );
  });

  it('estado efectivo: pasada la hora de fin, terminada', () => {
    const s = { status: 'accepted' as const, scheduledAt: '2026-11-26T15:00:00Z', durationMin: 45 };
    expect(effectiveSessionStatus(s, Date.parse('2026-11-26T15:44:00Z'))).toBe('accepted');
    expect(effectiveSessionStatus(s, Date.parse('2026-11-26T15:45:00Z'))).toBe('ended');
    expect(effectiveSessionStatus({ ...s, status: 'cancelled' }, 0)).toBe('cancelled');
  });
});
