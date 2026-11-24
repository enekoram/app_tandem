const dayFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** «Martes, 3 de noviembre». */
export function formatLongDay(date: Date): string {
  const text = dayFormatter.format(date);
  return text.charAt(0).toLocaleUpperCase('es') + text.slice(1);
}
