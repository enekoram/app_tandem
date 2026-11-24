import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.js';

describe('validateEnv', () => {
  it('aplica valores por defecto', () => {
    const env = validateEnv({ MONGODB_URI: 'mongodb://localhost:27017/tandems_test' });
    expect(env).toMatchObject({ NODE_ENV: 'development', PORT: 3000, LOG_LEVEL: 'info' });
  });

  it('convierte PORT a número (Render lo pasa como texto)', () => {
    const env = validateEnv({ MONGODB_URI: 'mongodb+srv://x.mongodb.net/db', PORT: '10000' });
    expect(env.PORT).toBe(10000);
  });

  it('falla si falta MONGODB_URI y nombra la variable', () => {
    expect(() => validateEnv({})).toThrow(/MONGODB_URI/);
  });

  it('no muestra el valor de una variable no válida en el error', () => {
    const secret = 'postgres://usuario:secreto@host/db';
    expect(() => validateEnv({ MONGODB_URI: secret })).toThrow(/MONGODB_URI/);
    try {
      validateEnv({ MONGODB_URI: secret });
    } catch (error) {
      expect((error as Error).message).not.toContain('secreto');
    }
  });
});
