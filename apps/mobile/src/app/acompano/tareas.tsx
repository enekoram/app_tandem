import { useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  tasksControllerLeave,
  useTasksControllerAccompanying,
  type TaskDto,
} from '@tandems/api-client';
import { formatDue } from '@/lib/dates';
import { invalidateTasks } from '@/lib/queries';
import { runUndoable } from '@/lib/undoable';
import { es } from '@/strings/es';
import {
  CardAction,
  CompanionTaskCard,
  ConfirmSheet,
  EmptyStateCard,
  Screen,
  useToast,
} from '@/ui';

/** Tareas que acompaño (aceptadas), con «Dejar de acompañar». */
export default function AccompaniedTasksScreen() {
  const t = es.companion;
  const toast = useToast();
  const queryClient = useQueryClient();
  const query = useTasksControllerAccompanying({ status: 'open' });
  const [leaving, setLeaving] = useState<TaskDto | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const tasks = (query.data?.status === 200 ? query.data.data : []).filter(
    (x) => x.companionStatus === 'accepted' && !hidden.includes(x.id),
  );

  const doLeave = () => {
    const task = leaving;
    if (!task) return;
    setLeaving(null);
    setHidden((h) => [...h, task.id]);
    const undo = runUndoable({
      commit: () =>
        tasksControllerLeave(task.id)
          .catch(() => undefined)
          .finally(() => void invalidateTasks(queryClient)),
      onUndo: () => setHidden((h) => h.filter((id) => id !== task.id)),
    });
    toast(t.leaveSheet.done(task.title), { action: { label: t.undo, onPress: undo } });
  };

  return (
    <Screen
      kind="inner"
      caption={query.isSuccess ? t.list.count(tasks.length) : undefined}
      title={t.list.title}
      back={{ label: t.list.back, onPress: () => router.back() }}
    >
      {query.isSuccess && tasks.length === 0 ? (
        <EmptyStateCard icon="companion" title={t.list.emptyTitle} body={t.list.emptyBody} />
      ) : (
        tasks.map((task) => (
          <CompanionTaskCard
            key={task.id}
            task={task}
            caption={t.list.from(task.person?.name ?? '', t.list.stateAccepted)}
            meta={`${t.list.youAccompany} · ${formatDue(task.dueAt)}`}
            actions={
              <CardAction label={t.list.leave} variant="link" onPress={() => setLeaving(task)} />
            }
          />
        ))
      )}
      <ConfirmSheet
        visible={!!leaving}
        title={t.leaveSheet.title(leaving?.title ?? '')}
        body={t.leaveSheet.body(leaving?.person?.name ?? '')}
        confirmLabel={t.leaveSheet.confirm}
        cancelLabel={t.leaveSheet.cancel}
        destructive
        onConfirm={doLeave}
        onCancel={() => setLeaving(null)}
      />
    </Screen>
  );
}
