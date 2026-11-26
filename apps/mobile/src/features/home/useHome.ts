import { useEffect, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { useHomeControllerHome, useMeControllerMe, type HomeDto } from '@tandems/api-client';
import {
  describeScene,
  homeMachine,
  msUntilBaseChanges,
  selectHomeState,
  selectToast,
  toHomeSnapshot,
} from '@tandems/shared';
import { useMotionProfile } from '@/lib/motion';
import { onRealtime } from '@/lib/realtime';

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
    if (!snapshot) return;
    send({ type: 'SNAPSHOT', snapshot, now: Date.now() });
    // Al reconectar: si alguien me está enviando apoyo, el corazón vuelve a latir
    const from = dto?.support?.sendingContactIds?.[0];
    if (from) send({ type: 'SUPPORT_HEARTBEAT', from });
  }, [snapshot, dto, send]);

  // Apoyo en vivo: cada evento mueve la región `support` (sin latido en 6 s, se apaga)
  useEffect(
    () =>
      onRealtime((e) => {
        if (e.type !== 'support') return;
        const type =
          e.state === 'started'
            ? 'SUPPORT_STARTED'
            : e.state === 'beat'
              ? 'SUPPORT_HEARTBEAT'
              : 'SUPPORT_ENDED';
        send({ type, from: e.contactId });
      }),
    [send],
  );

  // Reevaluar la base al cruzar la ventana de «sesión por empezar» (sin pedir nada)
  useEffect(() => {
    const ms = msUntilBaseChanges(snapshot, Date.now());
    if (ms === null) return;
    const timer = setTimeout(() => send({ type: 'TICK', now: Date.now() }), ms + 50);
    return () => clearTimeout(timer);
  }, [snapshot, send, state.context.base]);

  const motion = useMotionProfile();
  const initials = (profile?.displayName ?? '').trim().charAt(0).toLocaleUpperCase('es');
  const homeState = selectHomeState(state);
  const scene = describeScene(homeState, snapshot, { initials });
  const supporter = homeState.supportFrom
    ? dto?.contacts.find((c) => c.id === homeState.supportFrom)
    : undefined;

  return {
    scene,
    dto,
    motion,
    toast: selectToast(state),
    /** Quién me está enviando apoyo ahora (ApoyoRecibido). */
    supporter,
    send,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
