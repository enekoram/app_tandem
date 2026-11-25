import { Injectable } from '@nestjs/common';

/**
 * Presencia: quién tiene la app abierta ahora. En memoria mientras la API tenga una sola
 * instancia (Render gratuito); el doc 01 prevé Redis con TTL para varias instancias, y
 * bastará con otra implementación de esta misma clase.
 */
@Injectable()
export class Presence {
  private readonly sockets = new Map<string, Set<string>>();

  /** Registra un socket. true si la persona acaba de conectarse (era su primer socket). */
  add(userId: string, socketId: string): boolean {
    const set = this.sockets.get(userId) ?? new Set<string>();
    const first = set.size === 0;
    set.add(socketId);
    this.sockets.set(userId, set);
    return first;
  }

  /** Quita un socket. true si la persona se ha quedado sin ninguno (desconectada). */
  remove(userId: string, socketId: string): boolean {
    const set = this.sockets.get(userId);
    if (!set?.delete(socketId)) return false;
    if (set.size > 0) return false;
    this.sockets.delete(userId);
    return true;
  }

  isOnline(userId: string): boolean {
    return (this.sockets.get(userId)?.size ?? 0) > 0;
  }
}
