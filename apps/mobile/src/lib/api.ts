import Constants from 'expo-constants';
import { configureApiClient } from '@tandems/api-client';

/**
 * URL de la API:
 * - EXPO_PUBLIC_API_URL si está definida (staging/producción).
 * - En desarrollo, el mismo ordenador que sirve Metro, puerto 3000 (el móvil no ve «localhost»).
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:3000`;
}

export const API_URL = resolveApiUrl();

configureApiClient({ baseUrl: API_URL });
