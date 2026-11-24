#!/usr/bin/env node
/** pnpm stop: para los procesos que arrancó `pnpm dev` (todo su grupo de procesos). */
import { rmSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { PIDS, readPid, SERVICES } from './services.mjs';

function killGroup(pid, signal) {
  try {
    process.kill(-pid, signal); // negativo = todo el grupo (pnpm → nest/expo → node)
    return true;
  } catch {
    return false;
  }
}

for (const service of SERVICES) {
  const pidFile = `${PIDS}/${service.name}.pid`;
  const pid = readPid(pidFile);
  if (!pid) continue;
  if (killGroup(pid, 'SIGTERM')) {
    await sleep(1500);
    killGroup(pid, 'SIGKILL'); // por si algo no atendió SIGTERM
    console.log(`· ${service.name}: parado`);
  } else {
    console.log(`· ${service.name}: no estaba en marcha`);
  }
  rmSync(pidFile, { force: true });
}
