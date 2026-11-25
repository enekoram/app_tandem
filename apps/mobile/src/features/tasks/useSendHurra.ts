import { useQueryClient } from '@tanstack/react-query';
import { useTasksControllerHurra, type TaskDto } from '@tandems/api-client';
import { apiErrorCode } from '@/lib/apiErrors';
import { invalidateTasks } from '@/lib/queries';
import { es } from '@/strings/es';
import { useToast } from '@/ui';

/** Enviar un «¡hurra!» por una tarea terminada que acompañé. */
export function useSendHurra() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const mutation = useTasksControllerHurra();
  const send = (task: TaskDto) =>
    mutation.mutate(
      { id: task.id },
      {
        onSuccess: () => {
          void invalidateTasks(queryClient);
          toast(es.companion.hurraSent(task.person?.name ?? ''), { kind: 'ok' });
        },
        onError: (error) =>
          toast(
            apiErrorCode(error) === 'HURRA_ALREADY_SENT'
              ? es.companion.hurraAlready
              : es.auth.errors.network,
            { kind: 'err' },
          ),
      },
    );
  return { send, pending: mutation.isPending };
}
