/**
 * Geometría de la escena de la Home: dónde va cada forma según la disposición.
 * Coordenadas del canvas (Hoy, VacioHoy, VacioHoyContactos) sobre un lienzo de 358 × 200;
 * la app escala al ancho disponible. Las formas `united` se funden (efecto goo con el
 * degradado); las demás se pintan sueltas con su color.
 */
import type { Scene, ScenePerson } from './scene.ts';

export const SCENE_W = 358;
export const SCENE_H = 200;

export interface ShapeTarget {
  id: string;
  cx: number;
  cy: number;
  r: number;
  /** Dentro de la forma unida (degradado + goo). */
  united: boolean;
  /** 1 normal; atenuada si hoy no está. */
  opacity: number;
  /** Ondas alrededor: está pidiendo algo (te piden). */
  ripple: boolean;
}

export interface SceneGeometry {
  shapes: ShapeTarget[];
  /** Huecos discontinuos de VacioHoy («tu red, aún vacía»). */
  placeholders: { cx: number; cy: number; r: number }[];
  /** Punto «En vivo». */
  liveDot: { x: number; y: number } | null;
}

type Slot = { cx: number; cy: number; r: number };

const ALONE: Slot = { cx: 160, cy: 100, r: 58 };
/** Tú + acompañante (Hoy): se tocan y el goo las une. */
const JOINED: [Slot, Slot] = [
  { cx: 140, cy: 106, r: 74 },
  { cx: 246, cy: 90, r: 58 },
];
/** En vivo: más juntas, una sola forma. */
const FUSED: [Slot, Slot] = [
  { cx: 154, cy: 102, r: 76 },
  { cx: 222, cy: 96, r: 62 },
];
/** VacioHoyContactos: tú y, alrededor, quien está (unida) o no está (suelta, atenuada). */
const APART_ME: Slot = { cx: 148, cy: 104, r: 56 };
const APART_PRESENT: Slot[] = [
  { cx: 224, cy: 92, r: 44 },
  { cx: 214, cy: 150, r: 30 },
  { cx: 92, cy: 150, r: 28 },
];
const APART_ABSENT: Slot[] = [
  { cx: 306, cy: 52, r: 22 },
  { cx: 312, cy: 136, r: 20 },
  { cx: 268, cy: 172, r: 18 },
];
/** Quien pide algo y no está unida: se acerca desde fuera. */
const APPROACH: Slot = { cx: 314, cy: 56, r: 30 };
const PLACEHOLDERS: Slot[] = [
  { cx: 250, cy: 84, r: 30 },
  { cx: 278, cy: 142, r: 18 },
];
const DIMMED = 0.55;

const shape = (p: ScenePerson, slot: Slot, extra: Partial<ShapeTarget> = {}): ShapeTarget => ({
  id: p.id,
  ...slot,
  united: true,
  opacity: 1,
  ripple: false,
  ...extra,
});

export function sceneGeometry(scene: Scene): SceneGeometry {
  const [me, ...others] = scene.people;
  const shapes: ShapeTarget[] = [];
  const placeholders = scene.a11y.kind === 'empty' && others.length === 0 ? PLACEHOLDERS : [];
  if (!me) return { shapes, placeholders, liveDot: null };

  // La persona que se acerca se coloca aparte salvo que ya esté unida
  const approaching = others.find((p) => p.id === scene.approach);
  const base = others.filter(
    (p) => p !== approaching || scene.layout === 'joined' || scene.layout === 'fused',
  );
  const companion = scene.layout === 'joined' || scene.layout === 'fused' ? base[0] : undefined;

  if (scene.layout === 'joined' || scene.layout === 'fused') {
    const [mine, theirs] = scene.layout === 'fused' ? FUSED : JOINED;
    shapes.push(shape(me, mine));
    if (companion)
      shapes.push(shape(companion, theirs, { ripple: companion.id === scene.approach }));
  } else if (scene.layout === 'apart') {
    shapes.push(shape(me, APART_ME));
    let present = 0;
    let absent = 0;
    for (const p of base) {
      if (p === approaching) continue;
      if (!p.dim && present < APART_PRESENT.length)
        shapes.push(shape(p, APART_PRESENT[present++]!));
      else if (absent < APART_ABSENT.length)
        shapes.push(shape(p, APART_ABSENT[absent++]!, { united: false, opacity: DIMMED }));
    }
  } else {
    shapes.push(shape(me, ALONE));
  }

  // Quien pide y no está unida: suelta, con ondas, acercándose
  if (approaching && !shapes.some((s) => s.id === approaching.id)) {
    shapes.push(shape(approaching, APPROACH, { united: false, ripple: true }));
  }
  // Una tercera persona en una escena unida (te pide alguien más): también suelta
  for (const p of others) {
    if (!shapes.some((s) => s.id === p.id)) {
      shapes.push(shape(p, APPROACH, { united: false, ripple: p.id === scene.approach }));
    }
  }

  const liveDot = scene.liveDot ? { x: FUSED[0].cx - FUSED[0].r + 8, y: 18 } : null;
  return { shapes, placeholders, liveDot };
}
