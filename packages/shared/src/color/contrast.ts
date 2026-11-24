/**
 * Utilidades de color puras (sin dependencias) para validar la paleta en tests
 * y, en la app, para comprobaciones en tiempo de desarrollo.
 */

export type Hex = `#${string}`;

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function isHex(value: string): value is Hex {
  return HEX_RE.test(value);
}

export function hexToRgb(hex: Hex): [number, number, number] {
  if (!isHex(hex)) throw new Error(`Color no válido: ${hex}`);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function channelToLinear(c255: number): number {
  const c = c255 / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa según WCAG 2.x. */
export function relativeLuminance(hex: Hex): number {
  const [r, g, b] = hexToRgb(hex).map(channelToLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relación de contraste WCAG 2.x (1–21). */
export function contrastRatio(a: Hex, b: Hex): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Umbrales WCAG 2.2 nivel AA. */
export const WCAG_AA = {
  /** Texto normal. */
  text: 4.5,
  /** Texto grande (≥ 24 px, o ≥ 18,66 px en negrita). */
  largeText: 3,
  /** Componentes de interfaz y gráficos con significado (1.4.11). */
  nonText: 3,
} as const;

function rgbToLab(hex: Hex): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map(channelToLinear) as [number, number, number];
  // sRGB → XYZ (D65), normalizado por el blanco de referencia
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/**
 * Diferencia perceptual CIEDE2000 entre dos colores.
 * Orientativo: < 2 casi indistinguible · ~5 se nota al compararlos · > 10 claramente distintos.
 */
export function deltaE2000(a: Hex, b: Hex): number {
  const [L1, a1, b1] = rgbToLab(a);
  const [L2, a2, b2] = rgbToLab(b);
  const rad = Math.PI / 180;
  const deg = (r: number) => {
    const d = r / rad;
    return d < 0 ? d + 360 : d;
  };

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar7 = ((C1 + C2) / 2) ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 25 ** 7)));
  const ap1 = a1 * (1 + G);
  const ap2 = a2 * (1 + G);
  const Cp1 = Math.hypot(ap1, b1);
  const Cp2 = Math.hypot(ap2, b2);
  const hp1 = Cp1 === 0 ? 0 : deg(Math.atan2(b1, ap1));
  const hp2 = Cp2 === 0 ? 0 : deg(Math.atan2(b2, ap2));

  const dL = L2 - L1;
  const dC = Cp2 - Cp1;
  let dh = 0;
  if (Cp1 * Cp2 !== 0) {
    dh = hp2 - hp1;
    if (dh > 180) dh -= 360;
    else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dh / 2) * rad);

  const Lbar = (L1 + L2) / 2;
  const Cpbar = (Cp1 + Cp2) / 2;
  let hbar = hp1 + hp2;
  if (Cp1 * Cp2 !== 0) {
    if (Math.abs(hp1 - hp2) > 180) hbar += hbar < 360 ? 360 : -360;
    hbar /= 2;
  }
  const T =
    1 -
    0.17 * Math.cos((hbar - 30) * rad) +
    0.24 * Math.cos(2 * hbar * rad) +
    0.32 * Math.cos((3 * hbar + 6) * rad) -
    0.2 * Math.cos((4 * hbar - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbar - 275) / 25) ** 2));
  const Cpbar7 = Cpbar ** 7;
  const RC = 2 * Math.sqrt(Cpbar7 / (Cpbar7 + 25 ** 7));
  const SL = 1 + (0.015 * (Lbar - 50) ** 2) / Math.sqrt(20 + (Lbar - 50) ** 2);
  const SC = 1 + 0.045 * Cpbar;
  const SH = 1 + 0.015 * Cpbar * T;
  const RT = -Math.sin(2 * dTheta * rad) * RC;

  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}
