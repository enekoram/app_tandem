import { useEffect, useMemo } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { useMachine } from '@xstate/react';
import { useHomeControllerHome, useMeControllerMe, type HomeDto } from '@tandems/api-client';
import {
  describeScene,
  homeMachine,
  msUntilBaseChanges,
  profileForStimulus,
  resolveMotionProfile,
  selectHomeState,
  selectToast,
  toHomeSnapshot,
  type MotionProfile,
} from '@tandems/shared';

/**
 * Home viva (doc 03): instantánea de GET /me/home → máquina → escena.
 * El tiempo real (lib/realtime) invalida la consulta y llega aquí como una instantánea nueva.
 */
export function useHome() {
  const query = useHomeControllerHome();
  const me = useMeControllerMe();
  const profile = me.data?.status === 200 ? me.data.data : undefined;
  const dto: HomeDto | undefined = query.data?.status === 200 ? query.data.data : undefined;
  const [state, send] = useMachine(homeMachine);
  const snapshot = useMemo(() => (dto ? toHomeSnapshot(dto) : null), [dto]);

  useEffect(() => {
    if (snapshot) send({ type: 'SNAPSHOT', snapshot, now: Date.now() });
  }, [snapshot, send]);

  // Reevaluar la base al cruzar la ventana de «sesión por empezar» (sin pedir nada)
  useEffect(() => {
    const ms = msUntilBaseChanges(snapshot, Date.now());
    if (ms === null) return;
    const timer = setTimeout(() => send({ type: 'TICK', now: Date.now() }), ms + 50);
    return () => clearTimeout(timer);
  }, [snapshot, send, state.context.base]);

  const reduceMotion = useReducedMotion();
  const motion: MotionProfile = resolveMotionProfile(
    profileForStimulus(profile?.stimulus ?? 'full'),
    reduceMotion,
  );
  const initials = (profile?.displayName ?? '').trim().charAt(0).toLocaleUpperCase('es');
  const scene = describeScene(selectHomeState(state), snapshot, { initials });

  return {
    scene,
    dto,
    motion,
    toast: selectToast(state),
    send,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
