import { describe, expect, it } from 'vitest';
import { assignInitials, colorIdFor, pickColorIndex } from './contacts.ts';

describe('pickColorIndex', () => {
  it('da el primer color libre', () => {
    expect(pickColorIndex([])).toBe(0);
    expect(pickColorIndex([0, 1, 3])).toBe(2);
  });

  it('con los 8 usados, el menos repetido (y a igualdad, el más bajo)', () => {
    expect(pickColorIndex([0, 1, 2, 3, 4, 5, 6, 7])).toBe(0);
    expect(pickColorIndex([0, 0, 1, 2, 3, 4, 5, 6, 7])).toBe(1);
  });

  it('ignora índices fuera de la paleta', () => {
    expect(pickColorIndex([-1, 99])).toBe(0);
  });
});

describe('colorIdFor', () => {
  it('traduce índices a ids de la paleta', () => {
    expect(colorIdFor(0)).toBe('lilac');
    expect(colorIdFor(7)).toBe('sea');
    expect(colorIdFor(8)).toBe('lilac');
  });
});

describe('assignInitials', () => {
  it('una letra en mayúscula si no hay choques', () => {
    expect(assignInitials(['Marta', 'juan', 'Lucía'])).toEqual(['M', 'J', 'L']);
  });

  it('dos letras cuando la primera coincide', () => {
    expect(assignInitials(['Marta López', 'Mario', 'Juan'])).toEqual(['ML', 'MA', 'J']);
  });

  it('respeta letras con tilde y la ñ', () => {
    expect(assignInitials(['Íñigo', 'ñoño'])).toEqual(['Í', 'Ñ']);
  });

  it('mantiene emojis completos (también con tono de piel y uniones)', () => {
    expect(assignInitials(['🐢 Tortu', '👩🏽‍💻 Ana', 'Ana'])).toEqual(['🐢', '👩🏽‍💻', 'A']);
  });

  it('nombre vacío → «?»', () => {
    expect(assignInitials(['   '])).toEqual(['?']);
  });
});
