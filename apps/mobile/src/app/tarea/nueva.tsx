import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTasksControllerCreate } from '@tandems/api-client';
import { apiErrorCode } from '@/lib/apiErrors';
import { invalidateTasks } from '@/lib/queries';
import { TaskForm, type TaskFormValues } from '@/features/tasks/TaskForm';
import { es } from '@/strings/es';
import { ModalHeader, ModalScreen, useToast } from '@/ui';

export default function NewTaskScreen() {
  const t = es.tasks.form;
  const toast = useToast();
  const queryClient = useQueryClient();
  const create = useTasksControllerCreate();
  const submitRef = useRef<(() => void) | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const save = (values: TaskFormValues) => {
    setServerError(null);
    create.mutate(
      {
        data: {
          title: values.title,
          description: values.description || undefined,
          dueAt: values.dueAt ?? undefined,
          companionContactId: values.companionContactId,
        },
      },
      {
        onSuccess: (res) => {
          if (res.status !== 201) return;
          void invalidateTasks(queryClient);
          router.back();
          toast(es.tasks.created(res.data.person?.name ?? ''), { kind: 'ok' });
        },
        onError: (error) =>
          setServerError(
            apiErrorCode(error) === 'TASK_LIMIT' ? es.tasks.limit.body : es.auth.errors.network,
          ),
      },
    );
  };

  return (
    <ModalScreen
      header={
        <ModalHeader
          title={t.newTitle}
          cancelLabel={t.cancel}
          onCancel={() => router.back()}
          actionLabel={t.create}
          onAction={() => submitRef.current?.()}
          actionDisabled={create.isPending}
        />
      }
    >
      <TaskForm submitRef={submitRef} onValid={save} serverError={serverError} />
    </ModalScreen>
  );
}
