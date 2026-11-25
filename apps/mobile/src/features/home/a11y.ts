import type { SceneA11y } from '@tandems/shared';
import { es } from '@/strings/es';

/** «Marta», «Marta y Juan», «Marta, Juan y Lucía». Sin Intl.ListFormat: Hermes no lo trae. */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')}${es.today.scene.and}${names.at(-1)}`;
}

/** «Marta está contigo · Juan y Lucía hoy no están» (también lo lee VoiceOver). */
export function presenceLine(present: string[], absent: string[]): string {
  const t = es.today.scene;
  const parts: string[] = [];
  if (present.length)
    parts.push((present.length > 1 ? t.presentMany : t.present)(joinNames(present)));
  if (absent.length) parts.push((absent.length > 1 ? t.absentMany : t.absent)(joinNames(absent)));
  return parts.join(es.today.presenceJoin);
}

/** Etiqueta de accesibilidad de la escena: el significado nunca depende solo de la forma. */
export function describeSceneA11y(a11y: SceneA11y): string {
  const t = es.today.scene;
  switch (a11y.kind) {
    case 'loading':
      return t.loading;
    case 'empty':
      return t.empty;
    case 'alone':
      return t.alone;
    case 'aloneApproached':
      return `${t.alone}. ${t.approaching(a11y.approaching)}`;
    case 'contacts': {
      const line = presenceLine(a11y.present, a11y.absent);
      return line ? `${t.alone}. ${line}` : t.alone;
    }
    case 'joined': {
      const parts = [a11y.live ? t.live(a11y.name) : t.joined(a11y.name)];
      if (a11y.support) parts.push(t.support(a11y.name));
      if (a11y.approaching) parts.push(t.approaching(a11y.approaching));
      return parts.join('. ');
    }
  }
}
