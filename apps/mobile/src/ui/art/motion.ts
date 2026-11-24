import { useEffect } from 'react';
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { drift, durations } from '@/theme';

/**
 * Progreso 0 → 1 → 0 en bucle (ciclo de `durations.breath`, ease-in-out), base de la deriva
 * de las formas. Con Reducir movimiento se queda quieto en 0.
 */
export function useDrift(): SharedValue<number> {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduce) {
      p.value = 0;
      return;
    }
    p.value = withRepeat(
      withTiming(1, { duration: durations.breath / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduce, p]);
  return p;
}

/** Escala del latido (1 → 1.25 → 0.94 → 1). Sin animación con Reducir movimiento. */
export function useHeartbeat(): SharedValue<number> {
  const reduce = useReducedMotion();
  const s = useSharedValue(1);
  useEffect(() => {
    if (reduce) {
      s.value = 1;
      return;
    }
    const { duration, peak, rebound } = drift.heartbeat;
    const ease = Easing.inOut(Easing.ease);
    s.value = withRepeat(
      withSequence(
        withTiming(peak, { duration: duration * 0.3, easing: ease }),
        withTiming(rebound, { duration: duration * 0.3, easing: ease }),
        withTiming(1, { duration: duration * 0.4, easing: ease }),
      ),
      -1,
    );
  }, [reduce, s]);
  return s;
}
