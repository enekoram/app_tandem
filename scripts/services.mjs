import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const LOGS = `${ROOT}/.logs`;
export const PIDS = `${ROOT}/.pids`;

/** Servicios que arranca `pnpm dev` (cada uno ejecuta el script `dev` de su paquete). */
export const SERVICES = [
  { name: 'api', filter: '@tandems/api' },
  { name: 'mobile', filter: '@tandems/mobile' },
];

export function readPid(pidFile) {
  if (!existsSync(pidFile)) return null;
  const pid = Number(readFileSync(pidFile, 'utf8').trim());
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

export function isRunning(pidFile) {
  const pid = readPid(pidFile);
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
