/**
 * Paleta cerrada de 8 colores de persona, sin connotación de género.
 * Uso: siempre a través de `PersonToken` / `usePersonStyle` en la app; nunca un hex suelto.
 *
 * Cada color tiene cuatro tonos:
 * - `soft`  → final claro del filo de la tarjeta y fondos suaves.
 * - `base`  → relleno del avatar (con la inicial en `colors.text.primary`) y forma de la home.
 * - `deep`  → inicio oscuro del filo (degradado deep → base → soft, como en el kit).
 * - `text`  → nombre de la persona escrito en su color (≥ 4,5:1 sobre ground y surface).
 *
 * Los cuatro primeros y el tono de «tú» vienen del UI kit; salvia y ocre, del prototipo;
 * pervinca y agua son nuevos. Aprobada el 2026-11-24.
 */
import type { Hex } from '../color/contrast.ts';

export const PERSON_COLOR_IDS = [
  'lilac',
  'slate',
  'rose',
  'sun',
  'sage',
  'ochre',
  'periwinkle',
  'sea',
] as const;

export type PersonColorId = (typeof PERSON_COLOR_IDS)[number];

export interface PersonColor {
  /** Nombre para la interfaz y para VoiceOver (el significado nunca depende solo del color). */
  label: string;
  soft: Hex;
  base: Hex;
  deep: Hex;
  text: Hex;
}

export const personColors: Record<PersonColorId, PersonColor> = {
  lilac: { label: 'lila', soft: '#D6C2E6', base: '#A98BC2', deep: '#8A6CAA', text: '#7E5FA0' },
  slate: { label: 'azul gris', soft: '#D0E5ED', base: '#AAC0C8', deep: '#86A3AE', text: '#57727C' },
  rose: { label: 'rosado', soft: '#F4E7E2', base: '#E9CFC4', deep: '#C1ACA2', text: '#985D61' },
  sun: { label: 'amarillo', soft: '#F9EFD3', base: '#F2DFA6', deep: '#C8B88A', text: '#776F23' },
  sage: { label: 'salvia', soft: '#D4E1D0', base: '#A9C2A0', deep: '#8EA185', text: '#56744C' },
  ochre: { label: 'ocre', soft: '#EBD4AD', base: '#D6A85A', deep: '#B28C4D', text: '#9A5F1E' },
  periwinkle: {
    label: 'pervinca',
    soft: '#D7DCF4',
    base: '#AFB8E8',
    deep: '#9399BF',
    text: '#5566B8',
  },
  sea: { label: 'agua', soft: '#CEE7E3', base: '#9CCFC6', deep: '#83ACA4', text: '#2E7A73' },
};

/** La persona usuaria («tú»). No forma parte de la paleta asignable. */
export const selfColor = { label: 'tú', base: '#F3C4A0' } as const satisfies Pick<
  PersonColor,
  'label' | 'base'
>;
