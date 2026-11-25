import { useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSessionsControllerAccept,
  useSessionsControllerCancel,
  useSessionsControllerReject,
  type SessionDto,
} from '@tandems/api-client';
import { formatDue } from '@/lib/dates';
import { invalidateSessions } from '@/lib/queries';
import { es } from '@/strings/es';
import { ConfirmSheet, useToast } from '@/ui';

/**
 * Acciones sobre una sesión, compartidas por Mis sesiones, ConfirmarSesion y la Home:
 * aceptar, rechazar (RechazarSesion, con «Proponer otra hora») y cancelar (CancelarSesion,
 * con «Elegir otra hora»). `sheets` se pinta una vez en la pantalla.
 */
export function useSessionActions({ onDone }: { onDone?: () => void } = {}) {
  const t = es.sessions;
  const toast = useToast();
  const queryClient = useQueryClient();
  const acceptM = useSessionsControllerAccept();
  const rejectM = useSessionsControllerReject();
  const cancelM = useSessionsControllerCancel();
  const [rejecting, setRejecting] = useState<SessionDto | null>(null);
  const [cancelling, setCancelling] = useState<SessionDto | null>(null);

  const settle = () => {
    void invalidateSessions(queryClient);
    onDone?.();
  };
  const failed = () => {
    void invalidateSessions(queryClient);
    toast(t.errors.changed, { kind: 'err' });
  };
  const name = (s: SessionDto | null) => s?.person?.name ?? '';
  const chooseTime = (s: SessionDto) => {
    setRejecting(null);
    setCancelling(null);
    router.push({ pathname: '/sesion/[id]/hora', params: { id: s.id } });
  };

  const accept = (s: SessionDto) =>
    acceptM.mutate(
      { id: s.id },
      {
        onSuccess: () => {
          settle();
          toast(t.accepted(name(s)), { kind: 'ok' });
        },
        onError: failed,
      },
    );

  const reject = () => {
    const s = rejecting;
    if (!s) return;
    rejectM.mutate(
      { id: s.id },
      {
        onSuccess: () => {
          setRejecting(null);
          settle();
          toast(t.rejectSheet.done(name(s)));
        },
        onError: () => {
          setRejecting(null);
          failed();
        },
      },
    );
  };

  const cancel = () => {
    const s = cancelling;
    if (!s) return;
    cancelM.mutate(
      { id: s.id },
      {
        onSuccess: () => {
          setCancelling(null);
          settle();
          toast(t.cancelSheet.done);
        },
        onError: () => {
          setCancelling(null);
          failed();
        },
      },
    );
  };

  const sheets = (
    <>
      <ConfirmSheet
        visible={!!rejecting}
        title={t.rejectSheet.title(name(rejecting))}
        body={
          rejecting
            ? t.rejectSheet.body(
                rejecting.taskTitle,
                formatDue(rejecting.scheduledAt),
                name(rejecting),
              )
            : ''
        }
        confirmLabel={t.rejectSheet.confirm}
        destructive
        busy={rejectM.isPending}
        alternative={
          rejecting
            ? { label: t.rejectSheet.propose, onPress: () => chooseTime(rejecting) }
            : undefined
        }
        cancelLabel={t.rejectSheet.back}
        onConfirm={reject}
        onCancel={() => setRejecting(null)}
      />
      <ConfirmSheet
        visible={!!cancelling}
        title={t.cancelSheet.title(name(cancelling))}
        body={
          cancelling
            ? t.cancelSheet.body(
                cancelling.taskTitle,
                formatDue(cancelling.scheduledAt),
                name(cancelling),
              )
            : ''
        }
        confirmLabel={t.cancelSheet.confirm}
        destructive
        busy={cancelM.isPending}
        alternative={
          cancelling
            ? { label: t.cancelSheet.reschedule, onPress: () => chooseTime(cancelling) }
            : undefined
        }
        cancelLabel={t.cancelSheet.back}
        onConfirm={cancel}
        onCancel={() => setCancelling(null)}
      />
    </>
  );

  return {
    accept,
    askReject: setRejecting,
    askCancel: setCancelling,
    chooseTime,
    join: (s: SessionDto) => router.push({ pathname: '/sesion/[id]/activa', params: { id: s.id } }),
    sheets,
  };
}
