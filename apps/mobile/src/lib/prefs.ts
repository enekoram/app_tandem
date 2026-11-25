import * as SecureStore from 'expo-secure-store';

/**
 * Preferencias locales pequeñas. SecureStore porque ya está en la app y el email
 * (para entrar tras recuperar la contraseña) es dato personal.
 */
const KEYS = {
  onboardingSeen: 'tandems.onboarding_seen',
  resetEmail: 'tandems.reset_email',
  pendingInvite: 'tandems.pending_invite',
  pendingInviteAuto: 'tandems.pending_invite_auto',
  accountDeleted: 'tandems.account_deleted',
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
  clearPendingInvite: async () => {
    await SecureStore.deleteItemAsync(KEYS.pendingInvite);
    await SecureStore.deleteItemAsync(KEYS.pendingInviteAuto);
  },
  /** La invitación se acepta sola al entrar (se creó la cuenta desde ella: RegistroInvitado). */
  pendingInviteAuto: () => SecureStore.getItem(KEYS.pendingInviteAuto) === '1',
  setPendingInviteAuto: async (token: string) => {
    await SecureStore.setItemAsync(KEYS.pendingInvite, token);
    await SecureStore.setItemAsync(KEYS.pendingInviteAuto, '1');
  },
  /** Tras eliminar la cuenta: al salir se enseña «Cuenta eliminada» una vez. */
  accountDeleted: () => SecureStore.getItem(KEYS.accountDeleted) === '1',
  setAccountDeleted: () => SecureStore.setItemAsync(KEYS.accountDeleted, '1'),
  clearAccountDeleted: () => SecureStore.deleteItemAsync(KEYS.accountDeleted),
};
