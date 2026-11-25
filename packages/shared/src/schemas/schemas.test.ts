import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createContactSchema, createTaskSchema, updateProfileSchema } from './index.ts';

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
