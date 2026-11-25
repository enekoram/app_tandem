import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { devicesControllerRegister, devicesControllerUnregister } from '@tandems/api-client';
import { prefs } from './prefs';

/** Con la app abierta no se enseña el aviso del sistema: ya se ve en tiempo real. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Id del proyecto de EAS (lo pone `eas init` en app.json). Sin él, Expo no da token. */
function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export type PushResult = 'granted' | 'denied' | 'unavailable';

/**
 * Pide permiso y registra este dispositivo en la API. `unavailable`: simulador, Android en
 * Expo Go (no admite push desde el SDK 53) o falta el proyecto de EAS.
 */
export async function enablePush(): Promise<PushResult> {
  if (!Device.isDevice || !projectId()) return 'unavailable';
  const current = await Notifications.getPermissionsAsync();
  const asked = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!asked.granted) return 'denied';
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
    await devicesControllerRegister({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    await prefs.setPushToken(token);
    return 'granted';
  } catch {
    return 'unavailable';
  }
}

/** Al cerrar sesión: este móvil deja de recibir avisos de la cuenta. */
export async function disablePush(): Promise<void> {
  const token = prefs.pushToken();
  if (!token) return;
  await devicesControllerUnregister({
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
  }).catch(() => undefined);
  await prefs.clearPushToken();
}
