import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Error de dominio con código estable (la app traduce el código a un texto de strings/es.ts).
 * El 404 se usa también para recursos ajenos: nunca se revela que existen.
 */
export class DomainError extends HttpException {
  constructor(status: HttpStatus, code: string, message: string, extra?: Record<string, unknown>) {
    super({ code, message, ...extra }, status);
  }
}

export const notFound = (what = 'Recurso') =>
  new DomainError(HttpStatus.NOT_FOUND, 'NOT_FOUND', `${what} no encontrado`);
