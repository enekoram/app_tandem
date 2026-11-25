import { describe, expect, it } from 'vitest';
import { inQuietHours } from './support.ts';

const madrid = 'Europe/Madrid';
const at = (iso: string) => new Date(iso);
const night = { enabled: true, start: '22:00', end: '08:00' };

describe('inQuietHours', () => {
  it.each([
    ['23:30 en Madrid (cruza la medianoche)', '2026-11-25T22:30:00Z', true],
    ['07:59 en Madrid', '2026-11-26T06:59:00Z', true],
    ['08:00 en Madrid (fin excluido)', '2026-11-26T07:00:00Z', false],
    ['22:00 en Madrid (inicio incluido)', '2026-11-25T21:00:00Z', true],
    ['15:00 en Madrid', '2026-11-25T14:00:00Z', false],
  ] as const)('%s', (_, iso, expected) => {
    expect(inQuietHours(at(iso), madrid, night)).toBe(expected);
  });

  it('tramo dentro del mismo día (14:00–16:00)', () => {
    const siesta = { enabled: true, start: '14:00', end: '16:00' };
    expect(inQuietHours(at('2026-11-25T14:30:00Z'), madrid, siesta)).toBe(true); // 15:30
    expect(inQuietHours(at('2026-11-25T16:30:00Z'), madrid, siesta)).toBe(false); // 17:30
  });

  it('desactivado o con inicio = fin, nunca', () => {
    expect(inQuietHours(at('2026-11-25T22:30:00Z'), madrid, { ...night, enabled: false })).toBe(
      false,
    );
    expect(
      inQuietHours(at('2026-11-25T22:30:00Z'), madrid, {
        enabled: true,
        start: '08:00',
        end: '08:00',
      }),
    ).toBe(false);
  });

  it('usa la zona horaria de la persona', () => {
    // 23:30 UTC = 18:30 en Nueva York
    expect(inQuietHours(at('2026-11-25T23:30:00Z'), 'America/New_York', night)).toBe(false);
  });
});
