import { router } from 'expo-router';
import { useTasksControllerAccompanying } from '@tandems/api-client';
import { es } from '@/strings/es';
import { CompanionTaskCard, EmptyStateCard, Screen } from '@/ui';

const dayFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' });

/** Terminadas de las tareas que acompaño. (El «¡hurra!» llega en la fase 5.) */
export default function AccompaniedDoneScreen() {
  const t = es.companion.doneList;
  const query = useTasksControllerAccompanying({ status: 'done' });
  const tasks = query.data?.status === 200 ? query.data.data : [];
  return (
    <Screen
      kind="inner"
      caption={t.caption}
      title={t.title}
      back={{ label: t.back, onPress: () => router.back() }}
    >
      {query.isSuccess && tasks.length === 0 ? (
        <EmptyStateCard icon="check" title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        tasks.map((task) => (
          <CompanionTaskCard
            key={task.id}
            task={task}
            caption={es.tasks.doneList.doneOn(
              task.doneAt && new Date(task.doneAt).toDateString() === new Date().toDateString()
                ? es.dates.today
                : task.doneAt
                  ? dayFormatter.format(new Date(task.doneAt))
                  : '',
            )}
            meta={t.from(task.person?.name ?? '')}
          />
        ))
      )}
    </Screen>
  );
}
