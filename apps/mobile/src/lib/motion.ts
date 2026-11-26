import { useReducedMotion } from 'react-native-reanimated';
import { useMeControllerMe } from '@tandems/api-client';
import { profileForStimulus, resolveMotionProfile, type MotionProfile } from '@tandems/shared';

/** Perfil de movimiento: nivel de estímulo del perfil + «Reducir movimiento» del sistema. */
export function useMotionProfile(): MotionProfile {
  const me = useMeControllerMe();
  const profile = me.data?.status === 200 ? me.data.data : undefined;
  const reduceMotion = useReducedMotion();
  return resolveMotionProfile(profileForStimulus(profile?.stimulus ?? 'full'), reduceMotion);
}
