import { Redirect } from 'expo-router';
import { prefs } from '@/lib/prefs';

/**
 * Entrada sin sesión: la primera vez, el onboarding; después, iniciar sesión.
 * Justo después de eliminar la cuenta, «Cuenta eliminada».
 */
export default function AuthIndex() {
  if (prefs.accountDeleted()) return <Redirect href="/cuenta-eliminada" />;
  return <Redirect href={prefs.onboardingSeen() ? '/login' : '/onboarding'} />;
}
