import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { configureApiClient } from '@tandems/api-client';
import { API_URL } from './api';
import { prefs } from './prefs';

export const APP_SCHEME = 'tandems';

/** Cliente de Better Auth: guarda la cookie de sesión en el llavero (SecureStore). */
export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
  plugins: [expoClient({ scheme: APP_SCHEME, storagePrefix: APP_SCHEME, storage: SecureStore })],
});

// Las llamadas a nuestra API llevan la misma cookie de sesión
configureApiClient({
  baseUrl: API_URL,
  getHeaders: async (): Promise<Record<string, string>> => {
    const cookie = await authClient.getCookie();
    return {
      ...(cookie ? { Cookie: cookie } : {}),
      // Para que los enlaces de invitación abran esta app (en desarrollo, Expo Go)
      'x-app-link': Linking.createURL('/invitacion'),
    };
  },
});

/**
 * Pide el enlace para crear una contraseña nueva. Guarda el email para poder entrar
 * directamente después («Guardar y entrar»).
 */
export async function requestReset(email: string) {
  await prefs.setResetEmail(email);
  return authClient.requestPasswordReset({
    email,
    // tandems://reset-password (o exp://…/--/reset-password en Expo Go)
    redirectTo: Linking.createURL('/reset-password'),
  });
}
