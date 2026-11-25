import { useEffect } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  getContactsControllerListQueryKey,
  getTasksControllerAccompanyingQueryKey,
  useInvitationsControllerAccept,
} from '@tandems/api-client';
import { es } from '@/strings/es';
import { durations } from '@/theme';
import { useToast } from '@/ui';
import { prefs } from './prefs';

/**
 * Invitación abierta antes de tener sesión: se retoma al entrar en las pestañas.
 * - Cuenta creada desde la invitación (RegistroInvitado): se acepta sola y se enseña
 *   «Ya formas parte de la red de apoyo de…» en Acompaño, con las tareas que ya le
 *   comparten para aceptarlas o rechazarlas (BienvenidaInvitado).
 * - «Ya tengo cuenta»: se vuelve a la invitación para aceptarla.
 * Tras iniciar sesión la navegación cambia de pila: se espera a que termine la transición.
 */
export function useResumeInvite() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const accept = useInvitationsControllerAccept();
  const { mutate } = accept;

  useEffect(() => {
    const token = prefs.pendingInvite();
    if (!token) return;
    const auto = prefs.pendingInviteAuto();
    const timer = setTimeout(() => {
      void prefs.clearPendingInvite();
      if (!auto) {
        router.push({ pathname: '/invitacion', params: { token } });
        return;
      }
      mutate(
        { token },
        {
          onSuccess: (res) => {
            if (res.status !== 200) return;
            void queryClient.invalidateQueries({ queryKey: getContactsControllerListQueryKey() });
            void queryClient.invalidateQueries({
              queryKey: getTasksControllerAccompanyingQueryKey(),
            });
            router.navigate('/acompano');
            toast(es.invitation.welcome(res.data.name), {
              kind: 'ok',
              action: { label: es.invitation.welcomeOk, onPress: () => {} },
            });
          },
          // Caducada o cancelada mientras tanto: se enseña la pantalla con el motivo
          onError: () => router.push({ pathname: '/invitacion', params: { token } }),
        },
      );
    }, durations.slow);
    return () => clearTimeout(timer);
  }, [mutate, queryClient, toast]);
}
