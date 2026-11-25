import { router } from 'expo-router';
import { useTasksControllerList } from '@tandems/api-client';
import { es } from '@/strings/es';
import { Button, EmptyStateCard, ListCard, ListRow, Screen } from '@/ui';

const dayFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' });

function doneWhen(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const today = new Date();
  return date.toDateString() === today.toDateString() ? es.dates.today : dayFormatter.format(date);
}

export default function DoneTasksScreen() {
  const t = es.tasks.doneList;
  const query = useTasksControllerList({ status: 'done' });
  const tasks = query.data?.status === 200 ? query.data.data : [];
  return (
    <Screen
      kind="inner"
      caption={query.isSuccess ? t.count(tasks.length) : undefined}
      title={t.title}
      back={{ label: t.back, onPress: () => router.back() }}
    >
      {query.isSuccess && tasks.length === 0 ? (
        <EmptyStateCard
          icon="check"
          title={t.emptyTitle}
          body={t.emptyBody}
          actions={<Button label={t.seeTasks} onPress={() => router.back()} />}
        />
      ) : (
        <ListCard>
          {tasks.map((task) => (
            <ListRow
              key={task.id}
              title={task.title}
              subtitle={[
                t.doneOn(doneWhen(task.doneAt)),
                task.person && `${es.tasks.card.with} ${task.person.name}`,
                task.hurraAt && task.person && t.hurraFrom(task.person.name),
              ]
                .filter(Boolean)
                .join(' · ')}
            />
          ))}
        </ListCard>
      )}
    </Screen>
  );
}
