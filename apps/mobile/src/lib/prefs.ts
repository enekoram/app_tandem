import * as SecureStore from 'expo-secure-store';

/**
 * Preferencias locales pequeñas. SecureStore porque ya está en la app y el email
 * (para entrar tras recuperar la contraseña) es dato personal.
 */
const KEYS = {
  onboardingSeen: 'tandems.onboarding_seen',
  resetEmail: 'tandems.reset_email',
  pendingInvite: 'tandems.pending_invite',
} as const;

export const prefs = {
  onboardingSeen: () => SecureStore.getItem(KEYS.onboardingSeen) === '1',
  setOnboardingSeen: () => SecureStore.setItemAsync(KEYS.onboardingSeen, '1'),
  resetEmail: () => SecureStore.getItem(KEYS.resetEmail),
  setResetEmail: (email: string) => SecureStore.setItemAsync(KEYS.resetEmail, email),
  clearResetEmail: () => SecureStore.deleteItemAsync(KEYS.resetEmail),
  /** Invitación abierta sin sesión: se retoma al entrar. */
  pendingInvite: () => SecureStore.getItem(KEYS.pendingInvite),
  setPendingInvite: (token: string) => SecureStore.setItemAsync(KEYS.pendingInvite, token),
  clearPendingInvite: () => SecureStore.deleteItemAsync(KEYS.pendingInvite),
};
