import { describe, expect, it } from 'vitest';
import { isReservedTestAddress } from './mailer.js';

describe('isReservedTestAddress', () => {
  it('detecta dominios reservados para pruebas', () => {
    for (const e of ['marta@example.com', 'a@sub.example.org', 'x@algo.test', 'y@foo.invalid']) {
      expect(isReservedTestAddress(e)).toBe(true);
    }
  });

  it('no bloquea direcciones reales', () => {
    for (const e of ['eneko@gmail.com', 'a@notexample.com', 'b@example.com.es']) {
      expect(isReservedTestAddress(e)).toBe(false);
    }
  });
});
