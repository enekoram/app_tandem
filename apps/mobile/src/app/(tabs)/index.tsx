import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  useContactsControllerList,
  useTasksControllerAccompanying,
  useTasksControllerList,
} from '@tandems/api-client';
import { formatLongDay } from '@/lib/dates';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import {
  Button,
  EmphasisText,
  EmptyStateCard,
  IconButton,
  ListCard,
  ListRow,
  Screen,
  TaskCard,
  Text,
} from '@/ui';

/** Recientes: ¡hurras! de las últimas 48 h. */
const RECENT_MS = 48 * 60 * 60 * 1000;

/**
 * Hoy. Versión de la fase 2: tu siguiente tarea, lo que te han compartido y los ¡hurras!.
 * La Home «viva» con la forma unida y el tiempo real llega en la fase 3 (doc 03).
 */
export default function TodayScreen() {
  const t = es.today;
  const open = useTasksControllerList({ status: 'open' });
  const done = useTasksControllerList({ status: 'done' });
  const accompanying = useTasksControllerAccompanying({ status: 'open' });
  const contacts = useContactsControllerList();

  const tasks = open.data?.status === 200 ? open.data.data : [];
  const shared = (accompanying.data?.status === 200 ? accompanying.data.data : []).filter(
    (x) => x.companionStatus === 'pending',
  );
  const hurras = (done.data?.status === 200 ? done.data.data : []).filter(
    (x) => x.hurraAt && Date.now() - new Date(x.hurraAt).getTime() < RECENT_MS,
  );
  const hasContacts = contacts.data?.status === 200 && contacts.data.data.length > 0;
  const next = tasks[0];
  const nothing = open.isSuccess && !next && shared.length === 0 && hurras.length === 0;

  return (
    <Screen
      caption={formatLongDay(new Date())}
      title={nothing ? t.title : t.liveTitle}
      action={
        <IconButton
          icon="profile"
          accessibilityLabel={es.common.profile}
          onPress={() => router.push('/perfil')}
        />
      }
    >
      {!hasContacts && contacts.isSuccess && (
        <Text variant="body" color={colors.text.secondary}>
          {t.intro}
        </Text>
      )}

      {(shared.length > 0 || hurras.length > 0) && (
        <ListCard>
          {shared.length > 0 && (
            <ListRow
              icon="companion"
              title={t.sharedWaiting(shared.length)}
              subtitle={t.sharedWaitingSub}
              onPress={() => router.navigate('/acompano')}
            />
          )}
          {hurras.map((x) => (
            <ListRow
              key={x.id}
              icon="check"
              title={t.hurraReceived(x.person?.name ?? '', x.title)}
              onPress={() => router.push('/tarea/terminadas')}
            />
          ))}
        </ListCard>
      )}

      <EmphasisText
        text={t.nextTask}
        variant="section"
        accessibilityRole="header"
        style={styles.pad}
      />
      {next ? (
        <>
          <TaskCard
            task={next}
            featured
            onEdit={() => router.push({ pathname: '/tarea/[id]', params: { id: next.id } })}
          />
          <Button variant="link" label={t.seeTasks} onPress={() => router.navigate('/tareas')} />
        </>
      ) : (
        <EmptyStateCard
          icon="tasks"
          title={t.emptyTitle}
          body={t.emptyBody}
          actions={
            <Button label={t.createFirst} icon="plus" onPress={() => router.push('/tarea/nueva')} />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.sm },
});
