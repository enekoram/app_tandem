import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  tasksControllerRestore,
  useTasksControllerGet,
  useTasksControllerRemove,
  useTasksControllerUpdate,
} from '@tandems/api-client';
import { apiErrorCode } from '@/lib/apiErrors';
import { invalidateTasks } from '@/lib/queries';
import { TaskForm, type TaskFormValues } from '@/features/tasks/TaskForm';
import { es } from '@/strings/es';
import { ConfirmSheet, ListCard, ListRow, ModalHeader, ModalScreen, useToast } from '@/ui';

/** Editar tarea (hoja modal) con «Borrar tarea» y deshacer. */
export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = es.tasks.form;
  const toast = useToast();
  const queryClient = useQueryClient();
  const query = useTasksControllerGet(id);
  const update = useTasksControllerUpdate();
  const remove = useTasksControllerRemove();
  const submitRef = useRef<(() => void) | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const task = query.data?.status === 200 ? query.data.data : undefined;

  const save = (values: TaskFormValues) => {
    update.mutate(
      {
        id,
        data: {
          title: values.title,
          description: values.description || null,
          dueAt: values.dueAt,
          companionContactId: values.companionContactId,
        },
      },
      {
        onSuccess: () => {
          void invalidateTasks(queryClient);
          router.back();
          toast(es.tasks.saved, { kind: 'ok' });
        },
        onError: () => setServerError(es.tasks.saveFailed),
      },
    );
  };

  const doDelete = () =>
    remove.mutate(
      { id },
      {
        onSuccess: () => {
          setConfirmDelete(false);
          void invalidateTasks(queryClient);
          router.back();
          toast(es.tasks.deleted, {
            action: {
              label: es.tasks.undo,
              onPress: () =>
                void tasksControllerRestore(id)
                  .then(() => invalidateTasks(queryClient))
                  .catch((error: unknown) =>
                    toast(
                      apiErrorCode(error) === 'TASK_LIMIT'
                        ? es.tasks.limit.body
                        : es.tasks.undoExpired,
                      { kind: 'err' },
                    ),
                  ),
            },
          });
        },
        onError: () => {
          setConfirmDelete(false);
          toast(es.auth.errors.network, { kind: 'err' });
        },
      },
    );

  const sharedWith =
    task && (task.companionStatus === 'pending' || task.companionStatus === 'accepted')
      ? task.person?.name
      : undefined;

  return (
    <ModalScreen
      header={
        <ModalHeader
          title={t.editTitle}
          cancelLabel={t.cancel}
          onCancel={() => router.back()}
          actionLabel={t.save}
          onAction={() => submitRef.current?.()}
          actionDisabled={!task || update.isPending}
        />
      }
    >
      {task && (
        <TaskForm
          task={task}
          submitRef={submitRef}
          onValid={save}
          serverError={serverError}
          onRetry={() => submitRef.current?.()}
          footer={
            <ListCard>
              <ListRow
                icon="close"
                title={t.delete}
                destructive
                onPress={() => setConfirmDelete(true)}
              />
            </ListCard>
          }
        />
      )}
      <ConfirmSheet
        visible={confirmDelete}
        title={es.tasks.deleteSheet.title(task?.title ?? '')}
        body={es.tasks.deleteSheet.body(sharedWith)}
        confirmLabel={es.tasks.deleteSheet.confirm}
        cancelLabel={es.tasks.deleteSheet.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </ModalScreen>
  );
}
