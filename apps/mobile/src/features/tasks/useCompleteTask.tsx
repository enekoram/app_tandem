import { useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTasksControllerComplete, type TaskDto } from '@tandems/api-client';
import { invalidateTasks } from '@/lib/queries';
import { es } from '@/strings/es';
import { ConfirmSheet, useToast } from '@/ui';

/**
 * «¿La das por hecha?» → TareaTerminada. Lo usan Mis tareas y la Home.
 * `sheet` se pinta una vez en la pantalla; `ask(task)` la abre.
 */
export function useCompleteTask(onDone?: (task: TaskDto) => void) {
  const t = es.tasks;
  const toast = useToast();
  const queryClient = useQueryClient();
  const complete = useTasksControllerComplete();
  const [confirm, setConfirm] = useState<TaskDto | null>(null);

  const markDone = () => {
    const task = confirm;
    if (!task) return;
    complete.mutate(
      { id: task.id },
      {
        onSuccess: () => {
          setConfirm(null);
          void invalidateTasks(queryClient);
          onDone?.(task);
          router.push({
            pathname: '/tarea/terminada',
            params: { title: task.title, name: task.person?.name ?? '' },
          });
        },
        onError: () => {
          setConfirm(null);
          toast(es.auth.errors.network, { kind: 'err' });
        },
      },
    );
  };

  const sheet = (
    <ConfirmSheet
      visible={!!confirm}
      title={t.doneSheet.title}
      body={
        confirm
          ? t.doneSheet.body(
              confirm.title,
              confirm.companionStatus === 'accepted' ? confirm.person?.name : undefined,
            )
          : ''
      }
      confirmLabel={t.doneSheet.confirm}
      confirmIcon="check"
      cancelLabel={t.doneSheet.cancel}
      busy={complete.isPending}
      onConfirm={markDone}
      onCancel={() => setConfirm(null)}
    />
  );

  return { ask: setConfirm, sheet };
}
