import { ApiError } from '@tandems/api-client';

/** Código estable de un error de la API (`CONTACT_EXISTS`, `TASK_LIMIT`…) o null. */
export function apiErrorCode(error: unknown): string | null {
  if (error instanceof ApiError && error.body && typeof error.body === 'object') {
    const code = (error.body as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

/** Campo extra del cuerpo del error (p. ej. `name` en CONTACT_EXISTS). */
export function apiErrorField(error: unknown, field: string): string | null {
  if (error instanceof ApiError && error.body && typeof error.body === 'object') {
    const value = (error.body as Record<string, unknown>)[field];
    return typeof value === 'string' ? value : null;
  }
  return null;
}
