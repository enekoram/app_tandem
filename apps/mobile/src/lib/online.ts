import { useSyncExternalStore } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

/**
 * Conexión (doc 04 · sin conexión): TanStack Query pausa las consultas sin red y las repite
 * al volver. Lo que ya está en pantalla se sigue viendo; las acciones no se encolan.
 */
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
);

export function useOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}

/** «Reintentar»: vuelve a mirar la red (si hay, las consultas pausadas se repiten solas). */
export async function retryConnection(): Promise<void> {
  const state = await NetInfo.refresh();
  onlineManager.setOnline(state.isConnected !== false);
}
