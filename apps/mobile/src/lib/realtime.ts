import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';
import { authClient } from './auth';

/** Eventos efímeros que no pasan por /me/home (el apoyo en vivo late cada 3 s). */
export type RealtimeEvent =
  | { type: 'support'; contactId: string; state: 'started' | 'beat' | 'ended' }
  | { type: 'thinking'; contactId: string };

const listeners = new Set<(e: RealtimeEvent) => void>();

/** Suscribirse a los eventos efímeros; devuelve la función para dejar de escuchar. */
export function onRealtime(listener: (e: RealtimeEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const emit = (e: RealtimeEvent) => listeners.forEach((l) => l(e));

/**
 * Tiempo real (doc 01): un socket mientras la app está en primer plano y hay sesión.
 * Los eventos no traen datos (privacidad): avisan de que algo cambió y se vuelven a pedir
 * las consultas. Al volver a primer plano o reconectar también se refresca todo
 * (reconciliación).
 */
export function useRealtime(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;
    const refresh = () => void queryClient.invalidateQueries();

    const open = async () => {
      if (socket || cancelled) return;
      const cookie = await authClient.getCookie();
      if (!cookie || cancelled) return;
      socket = io(API_URL, {
        // Solo websocket: sin long polling (evita sesiones pegajosas en Render)
        transports: ['websocket'],
        extraHeaders: { cookie },
        reconnectionDelayMax: 10_000,
      });
      socket.on('ready', refresh);
      socket.on('home:changed', refresh);
      socket.on('presence', refresh);
      socket.on('support', (p: { contactId: string; state: 'started' | 'beat' | 'ended' }) => {
        emit({ type: 'support', ...p });
        // El inicio y el fin cambian /me/home (petición atendida); los latidos, no
        if (p.state !== 'beat') refresh();
      });
      socket.on('thinking', (p: { contactId: string }) => emit({ type: 'thinking', ...p }));
    };

    const close = () => {
      socket?.disconnect();
      socket = null;
    };

    void open();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void open();
      else close();
    });
    return () => {
      cancelled = true;
      sub.remove();
      close();
    };
  }, [queryClient]);
}
