/**
 * Categoría de plural en castellano. Hermes (el motor de JS de React Native) no trae
 * Intl.PluralRules en iOS: se usa si existe y, si no, la regla del castellano
 * (1 → «one»; el resto → «other»), que es lo único que necesitamos.
 */
const rules: Pick<Intl.PluralRules, 'select'> =
  typeof Intl !== 'undefined' && typeof Intl.PluralRules === 'function'
    ? new Intl.PluralRules('es')
    : { select: (n: number) => (Math.abs(n) === 1 ? 'one' : 'other') };

export function pluralEs(n: number, one: string, other: string): string {
  return rules.select(n) === 'one' ? one : other;
}
