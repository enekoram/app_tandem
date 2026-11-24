#!/usr/bin/env node
/**
 * Genera el icono de la app, el splash y el favicon desde assets/brand/logo-mark.svg.
 * Uso: pnpm brand:assets (los PNG resultantes se versionan en apps/mobile/assets).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { ROOT } from './services.mjs';

const GROUND = '#FAF5E8';
const INK = '#211E1B';
const mark = readFileSync(`${ROOT}/assets/brand/logo-mark.svg`, 'utf8');
// Contenido interior del SVG (defs + rect) para recolocarlo en otros lienzos
const inner = mark
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<title>.*?<\/title>/, '');

/** Lienzo cuadrado con la marca centrada ocupando `ratio` del ancho. */
function canvas(size, ratio, { background, monochrome } = {}) {
  const w = size * ratio;
  const k = w / 98;
  const h = 70 * k;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  const body = monochrome ? inner.replace('fill="url(#g)"', `fill="${INK}"`) : inner;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ''}
  <g transform="translate(${x} ${y}) scale(${k}) translate(-12 -18)">${body}</g>
</svg>`;
}

function render(svg, file) {
  const png = new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng();
  writeFileSync(`${ROOT}/apps/mobile/assets/${file}`, png);
  console.log(`· ${file}`);
}

render(canvas(1024, 0.62, { background: GROUND }), 'icon.png'); // iOS: sin transparencia
render(canvas(1024, 0.5), 'android-icon-foreground.png'); // zona segura del icono adaptativo
render(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${GROUND}"/></svg>`,
  'android-icon-background.png',
);
render(canvas(1024, 0.5, { monochrome: true }), 'android-icon-monochrome.png');
render(canvas(1024, 0.9), 'splash-icon.png');
render(canvas(48, 0.9, { background: GROUND }), 'favicon.png');
