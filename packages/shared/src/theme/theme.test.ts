import { describe, expect, it } from 'vitest';
import { contrastRatio, deltaE2000, WCAG_AA, type Hex } from '../color/contrast.ts';
import { colors } from './colors.ts';
import { PERSON_COLOR_IDS, personColors, selfColor } from './persons.ts';
import { resolveMotionProfile } from './motion.ts';

/** Diferencia mínima entre rellenos de avatar para distinguirlos de un vistazo. */
const MIN_FILL_DELTA_E = 9;
/** Diferencia mínima entre los tonos de texto (más oscuros, se confunden antes). */
const MIN_TEXT_DELTA_E = 10;

const backgrounds = { ground: colors.bg.ground, surface: colors.bg.surface } as const;

function pairs<T>(items: readonly T[]): [T, T][] {
  return items.flatMap((a, i) => items.slice(i + 1).map((b) => [a, b] as [T, T]));
}

describe('paleta de personas', () => {
  it('tiene exactamente 8 colores con id y etiqueta únicos', () => {
    expect(PERSON_COLOR_IDS).toHaveLength(8);
    const labels = PERSON_COLOR_IDS.map((id) => personColors[id].label);
    expect(new Set(labels).size).toBe(8);
  });

  describe.each(PERSON_COLOR_IDS)('%s', (id) => {
    const c = personColors[id];

    it('la inicial (texto principal) sobre el relleno cumple AA de texto normal', () => {
      expect(contrastRatio(colors.text.primary, c.base)).toBeGreaterThanOrEqual(WCAG_AA.text);
    });

    it.each(Object.entries(backgrounds))('el tono de texto cumple AA sobre %s', (_, bg) => {
      expect(contrastRatio(c.text, bg)).toBeGreaterThanOrEqual(WCAG_AA.text);
    });

    it('los tonos van de claro a oscuro: soft > base > deep > text', () => {
      const l = (h: Hex) => contrastRatio(h, '#000000');
      expect(l(c.soft)).toBeGreaterThan(l(c.base));
      expect(l(c.base)).toBeGreaterThan(l(c.deep));
      expect(l(c.deep)).toBeGreaterThan(l(c.text));
    });
  });

  it.each(
    pairs([
      ...PERSON_COLOR_IDS.map((id) => [id, personColors[id].base] as const),
      ['tú', selfColor.base] as const,
    ]),
  )('los rellenos %s y %s se distinguen (ΔE00 ≥ 9)', ([, a], [, b]) => {
    expect(deltaE2000(a, b)).toBeGreaterThanOrEqual(MIN_FILL_DELTA_E);
  });

  it.each(pairs(PERSON_COLOR_IDS))('los textos de %s y %s se distinguen (ΔE00 ≥ 10)', (a, b) => {
    expect(deltaE2000(personColors[a].text, personColors[b].text)).toBeGreaterThanOrEqual(
      MIN_TEXT_DELTA_E,
    );
  });

  it('el rojo teja (errores) no se confunde con ningún tono de texto de persona', () => {
    for (const id of PERSON_COLOR_IDS) {
      expect(deltaE2000(personColors[id].text, colors.danger)).toBeGreaterThanOrEqual(
        MIN_TEXT_DELTA_E,
      );
    }
  });
});

describe('contrastes del UI kit', () => {
  const textPairs: [string, Hex, Hex][] = [
    ['texto principal / ground', colors.text.primary, colors.bg.ground],
    ['texto principal / surface', colors.text.primary, colors.bg.surface],
    ['caption / surface', colors.text.caption, colors.bg.surface],
    ['secundario / ground', colors.text.secondary, colors.bg.ground],
    ['secundario / surface', colors.text.secondary, colors.bg.surface],
    ['secundario / burbuja', colors.text.secondary, colors.bg.bubble],
    ['texto del CTA principal', colors.action.onPrimary, colors.action.primary],
    ['texto del botón destructivo', colors.action.onPrimary, colors.action.destructive],
    ['fila destructiva / surface', colors.action.destructive, colors.bg.surface],
    ['«Enviar» deshabilitado', colors.action.disabledText, colors.action.disabledBg],
    ['«En vivo» / surface', colors.status.liveText, colors.bg.surface],
    ['toast info', colors.toast.info.text, colors.toast.info.bg],
    ['toast ok', colors.toast.ok.text, colors.toast.ok.bg],
    ['toast err', colors.toast.err.text, colors.toast.err.bg],
    ['rojo teja / surface', colors.danger, colors.bg.surface],
    ['error de campo / ground', colors.field.errorText, colors.bg.ground],
    ['error de campo / surface', colors.field.errorText, colors.bg.surface],
  ];

  it.each(textPairs)('%s cumple AA de texto normal', (_, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(WCAG_AA.text);
  });

  it('el texto inactivo cumple al menos AA de texto grande (solo para estados deshabilitados)', () => {
    expect(contrastRatio(colors.text.inactive, colors.bg.surface)).toBeGreaterThanOrEqual(
      WCAG_AA.largeText,
    );
  });

  it('los bordes de campo con foco o error y la casilla cumplen AA no textual', () => {
    for (const c of [colors.field.borderFocus, colors.field.borderError, colors.field.checkbox]) {
      expect(contrastRatio(c, colors.bg.surface)).toBeGreaterThanOrEqual(WCAG_AA.nonText);
    }
  });

  it('el icono atenuado cumple AA de elementos no textuales', () => {
    expect(contrastRatio(colors.icon.muted, colors.bg.surface)).toBeGreaterThanOrEqual(
      WCAG_AA.nonText,
    );
  });
});

describe('perfiles de movimiento', () => {
  it('Reducir movimiento del sistema fuerza el perfil mínimo', () => {
    expect(resolveMotionProfile('full', true)).toBe('minimal');
    expect(resolveMotionProfile('gentle', false)).toBe('gentle');
  });
});
