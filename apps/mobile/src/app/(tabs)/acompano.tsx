import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTasksControllerAccompanying } from '@tandems/api-client';
import { useRespondShared } from '@/features/tasks/useRespondShared';
import { useSendHurra } from '@/features/tasks/useSendHurra';
import { formatDue } from '@/lib/dates';
import { es } from '@/strings/es';
import { spacing } from '@/theme';
import {
  CardAction,
  CompanionTaskCard,
  EmphasisText,
  EmptyStateCard,
  IconButton,
  ListCard,
  ListRow,
  Screen,
} from '@/ui';

const RECENT_MS = 7 * 24 * 60 * 60 * 1000;

export default function CompanionScreen() {
  const t = es.companion;
  const query = useTasksControllerAccompanying({ status: 'open' });
  const doneQuery = useTasksControllerAccompanying({ status: 'done' });
  const hurra = useSendHurra();
  const respond = useRespondShared();
  const hidden = respond.hidden;

  const tasks = (query.data?.status === 200 ? query.data.data : []).filter(
    (x) => !hidden.includes(x.id),
  );
  const shared = tasks.filter((x) => x.companionStatus === 'pending');
  const accompanied = tasks.filter((x) => x.companionStatus === 'accepted');
  // Terminadas en la última semana a las que aún no he enviado un ¡hurra!
  const recent = (doneQuery.data?.status === 200 ? doneQuery.data.data : []).filter(
    (x) => !x.hurraAt && x.doneAt && Date.now() - new Date(x.doneAt).getTime() < RECENT_MS,
  );

  const empty = query.isSuccess && tasks.length === 0 && recent.length === 0;

  return (
    <Screen
      caption={
        query.isSuccess ? (accompanied.length ? t.count(accompanied.length) : t.caption) : undefined
      }
      title={t.title}
      action={
        <IconButton
          icon="profile"
          accessibilityLabel={es.common.profile}
          onPress={() => router.push('/perfil')}
        />
      }
    >
      {empty ? (
        <EmptyStateCard icon="companion" title={t.emptyTitle} body={t.emptyBody} />
      ) : (
        <>
          {shared.length > 0 && (
            <>
              <EmphasisText
                text={t.shared}
                variant="section"
                accessibilityRole="header"
                style={styles.pad}
              />
              {shared.map((task) => (
                <CompanionTaskCard
                  key={task.id}
                  task={task}
                  caption={t.sharedCaption}
                  line={t.wantsYou}
                  meta={formatDue(task.dueAt)}
                  actions={
                    <>
                      <CardAction
                        label={t.accept}
                        icon="check"
                        onPress={() => respond.accept(task)}
                      />
                      <CardAction
                        label={t.reject}
                        variant="ghost"
                        onPress={() => respond.askReject(task)}
                      />
                    </>
                  }
                />
              ))}
            </>
          )}
          {recent.length > 0 && (
            <>
              <EmphasisText
                text={t.recent}
                variant="section"
                accessibilityRole="header"
                style={styles.pad}
              />
              {recent.map((task) => (
                <CompanionTaskCard
                  key={task.id}
                  task={task}
                  caption={es.tasks.doneList.doneOn(es.dates.today)}
                  line={t.finishedLine}
                  actions={
                    <CardAction label={t.sendHurra} icon="check" onPress={() => hurra.send(task)} />
                  }
                />
              ))}
            </>
          )}
          <EmphasisText
            text={t.mine}
            variant="section"
            accessibilityRole="header"
            style={styles.pad}
          />
          <ListCard>
            <ListRow
              icon="tasks"
              title={t.tasksRow}
              subtitle={t.list.count(accompanied.length)}
              onPress={() => router.push('/acompano/tareas')}
            />
            <ListRow
              icon="check"
              title={t.doneRow}
              onPress={() => router.push('/acompano/terminadas')}
            />
          </ListCard>
        </>
      )}
      {respond.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.sm },
});
