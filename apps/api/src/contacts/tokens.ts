import { createHash, randomBytes } from 'node:crypto';

/** Token de invitación: 32 bytes aleatorios (base64url). Alta entropía → SHA-256 basta. */
export function newInvitationToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const INVITATION_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
