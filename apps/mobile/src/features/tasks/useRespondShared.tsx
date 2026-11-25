import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tasksControllerReject, useTasksControllerAccept, type TaskDto } from '@tandems/api-client';
import { invalidateTasks } from '@/lib/queries';
import { runUndoable } from '@/lib/undoable';
import { es } from '@/strings/es';
import { ConfirmSheet, useToast } from '@/ui';

/**
 * Responder a una tarea compartida («Te comparten»): aceptar, o rechazar con hoja de
 * confirmación y «Deshacer» (desaparece y se envía al acabar la ventana).
 * Lo usan Acompaño y la Home. `hidden` = tareas rechazadas en la ventana de deshacer.
 */
export function useRespondShared() {
  const t = es.companion;
  const toast = useToast();
  const queryClient = useQueryClient();
  const acceptMutation = useTasksControllerAccept();
  const [rejecting, setRejecting] = useState<TaskDto | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);

  const accept = (task: TaskDto) =>
    acceptMutation.mutate(
      { id: task.id },
      {
        onSuccess: () => {
          void invalidateTasks(queryClient);
          toast(t.accepted(task.title, task.person?.name ?? ''), { kind: 'ok' });
        },
        onError: () => toast(es.auth.errors.network, { kind: 'err' }),
      },
    );

  const reject = () => {
    const task = rejecting;
    if (!task) return;
    setRejecting(null);
    setHidden((h) => [...h, task.id]);
    const undo = runUndoable({
      commit: () =>
        tasksControllerReject(task.id)
          .catch(() => undefined)
          .finally(() => void invalidateTasks(queryClient)),
      onUndo: () => setHidden((h) => h.filter((id) => id !== task.id)),
    });
    toast(t.rejectSheet.done(task.title, task.person?.name ?? ''), {
      action: { label: t.undo, onPress: undo },
    });
  };

  const sheet = (
    <ConfirmSheet
      visible={!!rejecting}
      title={t.rejectSheet.title(rejecting?.person?.name ?? '')}
      body={rejecting ? t.rejectSheet.body(rejecting.title, rejecting.person?.name ?? '') : ''}
      confirmLabel={t.rejectSheet.confirm}
      cancelLabel={t.rejectSheet.cancel}
      destructive
      onConfirm={reject}
      onCancel={() => setRejecting(null)}
    />
  );

  return { accept, askReject: setRejecting, hidden, sheet };
}
