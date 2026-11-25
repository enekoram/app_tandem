import { es } from '@/strings/es';

export type AuthField = 'name' | 'email' | 'password' | 'form';

interface AuthErrorLike {
  code?: string;
  status?: number;
  message?: string;
}

/** Traduce un error de Better Auth a un texto y al campo al que pertenece. */
export function describeAuthError(error: AuthErrorLike | null | undefined): {
  field: AuthField;
  message: string;
} {
  const e = es.auth.errors;
  if (!error) return { field: 'form', message: e.unknown };
  if (error.status === 429) return { field: 'form', message: e.tooManyAttempts };
  switch (error.code) {
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return { field: 'email', message: e.emailTaken };
    case 'INVALID_EMAIL':
      return { field: 'email', message: e.emailInvalid };
    case 'PASSWORD_TOO_SHORT':
    case 'PASSWORD_TOO_LONG':
      return { field: 'password', message: e.passwordShort };
    case 'PASSWORD_COMPROMISED':
      return { field: 'password', message: e.passwordCompromised };
    case 'INVALID_DISPLAY_NAME':
      return { field: 'name', message: e.nameRequired };
    case 'INVALID_TOKEN':
      return { field: 'form', message: e.tokenInvalid };
    default:
      // Sin código ni estado: la petición no llegó al servidor
      if (!error.status) return { field: 'form', message: e.network };
      return { field: 'form', message: e.unknown };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export const PASSWORD_MIN = 8;
export { DISPLAY_NAME_MAX } from '@tandems/shared';
