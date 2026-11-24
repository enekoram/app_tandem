/**
 * Reglas puras de contactos (las usa la API al crear/aceptar/cancelar y los tests).
 */
import { PERSON_COLOR_IDS, type PersonColorId } from '../theme/persons.ts';

export const CONTACT_NAME_MAX = 40;
export const PALETTE_SIZE = PERSON_COLOR_IDS.length;

/** Id de color (lilac, slate…) a partir del índice guardado en la base de datos. */
export function colorIdFor(index: number): PersonColorId {
  return PERSON_COLOR_IDS[((index % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE]!;
}

/**
 * Color para un contacto nuevo: el primer índice libre; si los 8 están usados,
 * el menos repetido (a igualdad, el más bajo).
 */
export function pickColorIndex(used: readonly number[]): number {
  const counts = new Array<number>(PALETTE_SIZE).fill(0);
  for (const i of used) if (i >= 0 && i < PALETTE_SIZE) counts[i]! += 1;
  let best = 0;
  for (let i = 1; i < PALETTE_SIZE; i++) if (counts[i]! < counts[best]!) best = i;
  return best;
}

// Emoji completo al principio (con modificadores de tono, selectores y uniones ZWJ)
const LEADING_EMOJI =
  /^\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier}|‍\p{Extended_Pictographic}️?)*/u;

function firstLetter(word: string): string {
  return Array.from(word)[0]?.toLocaleUpperCase('es') ?? '';
}

/** Candidatos de iniciales de un nombre: [corta, larga]. */
function candidates(name: string): [string, string] {
  const clean = name.trim();
  const emoji = clean.match(LEADING_EMOJI)?.[0];
  if (emoji) return [emoji, emoji];
  const words = clean.split(/\s+/).filter(Boolean);
  const first = words[0] ?? '';
  const short = firstLetter(first) || '?';
  const second = words[1]
    ? firstLetter(words[1])
    : firstLetter(Array.from(first).slice(1).join(''));
  return [short, short + second];
}

/**
 * Iniciales de un conjunto de contactos: una letra; si dos o más comparten la primera letra,
 * pasan a dos (inicial del segundo nombre o segunda letra). Los emojis se mantienen.
 * Devuelve las iniciales en el mismo orden que los nombres.
 */
export function assignInitials(names: readonly string[]): string[] {
  const all = names.map(candidates);
  const shortCount = new Map<string, number>();
  for (const [short] of all) shortCount.set(short, (shortCount.get(short) ?? 0) + 1);
  return all.map(([short, long]) => ((shortCount.get(short) ?? 0) > 1 ? long : short));
}
