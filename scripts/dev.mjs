#!/usr/bin/env node
/**
 * pnpm dev: arranca la API (NestJS en modo watch) y Metro (Expo) en segundo plano.
 * Logs en .logs/<servicio>.log, PIDs en .pids/<servicio>.pid. Parar con `pnpm stop`.
 * Opcional: `pnpm dev api` o `pnpm dev mobile` para arrancar solo uno.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { createRequire } from 'node:module';
import { networkInterfaces } from 'node:os';
import { isRunning, LOGS, PIDS, ROOT, SERVICES } from './services.mjs';

const require = createRequire(import.meta.url);
const qrcode = require('qrcode-terminal');

const wanted = process.argv.slice(2);
const services = wanted.length ? SERVICES.filter((s) => wanted.includes(s.name)) : SERVICES;
if (!services.length) {
  console.error(`Servicio desconocido. Opciones: ${SERVICES.map((s) => s.name).join(', ')}`);
  process.exit(1);
}

/** IP del Mac en la red local (la que usa el móvil para llegar a Metro y a la API). */
function lanAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const a of addresses ?? []) {
      if (a.family === 'IPv4' && !a.internal) return a.address;
    }
  }
  return null;
}

mkdirSync(LOGS, { recursive: true });
mkdirSync(PIDS, { recursive: true });

if (services.some((s) => s.name === 'api') && !existsSync(`${ROOT}/apps/api/.env`)) {
  console.error('Falta apps/api/.env: copia apps/api/.env.example y rellena MONGODB_URI.');
  process.exit(1);
}

for (const service of services) {
  const pidFile = `${PIDS}/${service.name}.pid`;
  if (isRunning(pidFile)) {
    console.log(`· ${service.name}: ya estaba en marcha (pnpm stop para pararlo)`);
    continue;
  }
  const logFile = `${LOGS}/${service.name}.log`;
  const out = openSync(logFile, 'w');
  const child = spawn('pnpm', ['--filter', service.filter, 'dev'], {
    cwd: ROOT,
    detached: true, // grupo de procesos propio: `pnpm stop` lo cierra entero
    stdio: ['ignore', out, out],
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      // Los enlaces de los emails (recuperar contraseña) deben abrirse desde el móvil
      ...(service.name === 'api' && lanAddress() && !process.env.BETTER_AUTH_URL
        ? { BETTER_AUTH_URL: `http://${lanAddress()}:3000` }
        : {}),
    },
  });
  child.unref();
  writeFileSync(pidFile, String(child.pid));
  console.log(`· ${service.name}: arrancando (log en .logs/${service.name}.log)`);
}

/** Espera a que aparezca un patrón en el log, con límite de tiempo. */
async function waitForLog(name, pattern, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const log = existsSync(`${LOGS}/${name}.log`)
      ? readFileSync(`${LOGS}/${name}.log`, 'utf8')
      : '';
    const match = log.match(pattern);
    if (match) return match;
    if (
      /ERROR|Error:/.test(log) &&
      name === 'api' &&
      /Configuración no válida|bad auth/.test(log)
    ) {
      return null;
    }
    await sleep(500);
  }
  return null;
}

if (services.some((s) => s.name === 'api')) {
  const ok = await waitForLog('api', /Nest application successfully started/, 60_000);
  console.log(
    ok
      ? '✓ API en http://localhost:3000 (salud: /health · documentación: /docs)'
      : '✗ La API no ha arrancado: mira .logs/api.log',
  );
}

async function waitForMetro(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch('http://127.0.0.1:8081/status');
      if ((await res.text()).includes('packager-status:running')) return true;
    } catch {
      // aún no escucha
    }
    await sleep(500);
  }
  return false;
}

if (services.some((s) => s.name === 'mobile')) {
  const ready = await waitForMetro(90_000);
  const ip = lanAddress();
  if (ready && ip) {
    const url = `exp://${ip}:8081`;
    console.log('✓ Metro listo. Escanea con la cámara del iPhone (misma wifi que el ordenador):');
    qrcode.generate(url, { small: true });
    console.log(`  o escribe en Expo Go: ${url}`);
  } else if (ready) {
    console.log('✓ Metro listo, pero no encuentro la IP de la red local: ¿hay wifi?');
  } else {
    console.log('✗ Metro no ha arrancado: mira .logs/mobile.log');
  }
}
