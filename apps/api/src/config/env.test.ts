import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.js';

const base = { BETTER_AUTH_SECRET: 'x'.repeat(32) };

describe('validateEnv', () => {
  it('aplica valores por defecto', () => {
    const env = validateEnv({ ...base, MONGODB_URI: 'mongodb://localhost:27017/tandems_test' });
    expect(env).toMatchObject({ NODE_ENV: 'development', PORT: 3000, LOG_LEVEL: 'info' });
  });

  it('convierte PORT a número (Render lo pasa como texto)', () => {
    const env = validateEnv({
      ...base,
      MONGODB_URI: 'mongodb+srv://x.mongodb.net/db',
      PORT: '10000',
    });
    expect(env.PORT).toBe(10000);
  });

  it('en Render usa RENDER_EXTERNAL_URL como URL pública', () => {
    const env = validateEnv({
      ...base,
      MONGODB_URI: 'mongodb://h/db',
      RENDER_EXTERNAL_URL: 'https://tandems-api.onrender.com',
    });
    expect(env.BETTER_AUTH_URL).toBe('https://tandems-api.onrender.com');
  });

  it('falla si falta MONGODB_URI y nombra la variable', () => {
    expect(() => validateEnv(base)).toThrow(/MONGODB_URI/);
  });

  it('exige un secreto de al menos 32 caracteres', () => {
    expect(() =>
      validateEnv({ MONGODB_URI: 'mongodb://h/db', BETTER_AUTH_SECRET: 'corto' }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('no muestra el valor de una variable no válida en el error', () => {
    const secret = 'postgres://usuario:secreto@host/db';
    expect(() => validateEnv({ ...base, MONGODB_URI: secret })).toThrow(/MONGODB_URI/);
    try {
      validateEnv({ ...base, MONGODB_URI: secret });
    } catch (error) {
      expect((error as Error).message).not.toContain('secreto');
    }
  });
});
