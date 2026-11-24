import { es } from '@/strings/es';

const dayFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const timeFormatter = new Intl.DateTimeFormat('es-ES', { hour: 'numeric', minute: '2-digit' });
const weekdayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
const shortDateFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase('es') + text.slice(1);

/** «Martes, 3 de noviembre». */
export function formatLongDay(date: Date): string {
  return capitalize(dayFormatter.format(date));
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Fecha corta de una tarea: «hoy, 9:30» · «mañana, 15:00» · «viernes, 12:00» (esta semana)
 * · «3 dic., 10:00» · «sin fecha».
 */
export function formatDue(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return es.dates.noDate;
  const date = new Date(iso);
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);
  const time = timeFormatter.format(date);
  if (days === 0) return `${es.dates.today}, ${time}`;
  if (days === 1) return `${es.dates.tomorrow}, ${time}`;
  if (days > 1 && days < 7) return `${weekdayFormatter.format(date)}, ${time}`;
  return `${shortDateFormatter.format(date)}, ${time}`;
}
