import { describe, expect, it } from 'vitest';
import { contrastRatio, deltaE2000, hexToRgb } from './contrast.ts';

describe('contrastRatio', () => {
  it('negro sobre blanco es 21:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('es simétrico y vale 1 con el mismo color', () => {
    expect(contrastRatio('#211E1B', '#FFFDF8')).toBeCloseTo(contrastRatio('#FFFDF8', '#211E1B'));
    expect(contrastRatio('#A98BC2', '#A98BC2')).toBe(1);
  });

  it('coincide con valores de referencia', () => {
    // #767676 sobre blanco es el gris más claro que cumple AA (4,54:1)
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2);
  });
});

describe('deltaE2000', () => {
  it('vale 0 para colores iguales', () => {
    expect(deltaE2000('#A98BC2', '#A98BC2')).toBe(0);
  });

  it('distingue colores muy distintos de casi iguales', () => {
    expect(deltaE2000('#FF0000', '#00FF00')).toBeGreaterThan(60);
    expect(deltaE2000('#808080', '#818181')).toBeLessThan(1);
  });
});

describe('hexToRgb', () => {
  it('rechaza formatos no válidos', () => {
    expect(() => hexToRgb('#FFF' as `#${string}`)).toThrow();
  });
});
