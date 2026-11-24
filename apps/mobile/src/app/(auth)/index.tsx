import { Redirect } from 'expo-router';
import { prefs } from '@/lib/prefs';

/** Entrada sin sesión: la primera vez, el onboarding; después, iniciar sesión. */
export default function AuthIndex() {
  return <Redirect href={prefs.onboardingSeen() ? '/login' : '/onboarding'} />;
}
