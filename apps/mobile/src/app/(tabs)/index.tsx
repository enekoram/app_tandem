import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTasksControllerList, type SessionDto, type TaskDto } from '@tandems/api-client';
import type { SceneCard } from '@tandems/shared';
import { presenceLine } from '@/features/home/a11y';
import { HomeScene } from '@/features/home/HomeScene';
import { SessionCard } from '@/features/sessions/SessionCard';
import { useSessionActions } from '@/features/sessions/useSessionActions';
import { useHome } from '@/features/home/useHome';
import { useCompleteTask } from '@/features/tasks/useCompleteTask';
import { useRespondShared } from '@/features/tasks/useRespondShared';
import { formatDue, formatLongDay } from '@/lib/dates';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import {
  Button,
  CardAction,
  Carousel,
  CompanionTaskCard,
  EmphasisText,
  EmptyStateCard,
  IconButton,
  ListCard,
  ListRow,
  Screen,
  TaskCard,
  Text,
  type CarouselItem,
} from '@/ui';

/** Recientes: ¡hurras! de las últimas 48 h. */
const RECENT_MS = 48 * 60 * 60 * 1000;

/**
 * Hoy · «Contigo ahora» (doc 03): la forma unida, quién está contigo y el carrusel «Para
 * hoy» (lo que te piden primero, después tu siguiente tarea). Se actualiza en tiempo real.
 */
export default function TodayScreen() {
  const t = es.today;
  const home = useHome();
  const done = useCompleteTask();
  const respond = useRespondShared();
  const sessionActions = useSessionActions();
  const finished = useTasksControllerList({ status: 'done' });
  const { scene, dto } = home;

  const hurras = (finished.data?.status === 200 ? finished.data.data : []).filter(
    (x) => x.hurraAt && Date.now() - new Date(x.hurraAt).getTime() < RECENT_MS,
  );
  const byId = new Map<string, TaskDto>(
    [...(dto?.tasks ?? []), ...(dto?.shared ?? [])].map((x) => [x.id, x]),
  );
  const sessionsById = new Map<string, SessionDto>((dto?.sessions ?? []).map((x) => [x.id, x]));
  const sessionItem = (session: SessionDto | undefined): CarouselItem | null =>
    session
      ? {
          key: `session:${session.id}`,
          label: t.cardSession(session.person?.name ?? '', session.taskTitle),
          node: (
            <SessionCard
              session={session}
              onOpen={() => router.push({ pathname: '/sesion/[id]', params: { id: session.id } })}
              onAccept={() => sessionActions.accept(session)}
              onReject={() => sessionActions.askReject(session)}
              onChoose={() => sessionActions.chooseTime(session)}
              onCancel={() => sessionActions.askCancel(session)}
              onJoin={() => sessionActions.join(session)}
            />
          ),
        }
      : null;

  const cards = scene.cards
    .map((card) => toItem(card, byId))
    .filter((x): x is CarouselItem => !!x)
    .filter((x) => !respond.hidden.includes(x.key));

  function toItem(card: SceneCard, tasks: Map<string, TaskDto>): CarouselItem | null {
    if (card.kind === 'nextTask') {
      const task = tasks.get(card.task.id);
      if (!task) return null;
      return {
        key: task.id,
        label: t.cardNextTask(task.title),
        node: (
          <TaskCard
            task={task}
            featured
            onDone={() => done.ask(task)}
            onEdit={() => router.push({ pathname: '/tarea/[id]', params: { id: task.id } })}
          />
        ),
      };
    }
    if (card.kind === 'request' && card.request.kind === 'task') {
      const task = tasks.get(card.request.id.replace(/^task:/, ''));
      if (!task) return null;
      return {
        key: task.id,
        label: t.cardShared(task.person?.name ?? '', task.title),
        node: (
          <CompanionTaskCard
            task={task}
            caption={es.companion.sharedCaption}
            line={es.companion.wantsYou}
            meta={formatDue(task.dueAt)}
            actions={
              <>
                <CardAction
                  label={es.companion.accept}
                  icon="check"
                  onPress={() => respond.accept(task)}
                />
                <CardAction
                  label={es.companion.reject}
                  variant="ghost"
                  onPress={() => respond.askReject(task)}
                />
              </>
            }
          />
        ),
      };
    }
    if (card.kind === 'request' && card.request.kind === 'session') {
      return sessionItem(sessionsById.get(card.request.id.replace(/^session:/, '')));
    }
    if (card.kind === 'session') return sessionItem(sessionsById.get(card.session.id));
    // Apoyo: fase 5
    return null;
  }

  const empty = scene.a11y.kind === 'empty' || scene.a11y.kind === 'alone';
  const presence =
    scene.a11y.kind === 'contacts' ? presenceLine(scene.a11y.present, scene.a11y.absent) : '';

  // SesionPorEmpezar: la Home cambia de titular cuando falta poco (doc 03 · sessionSoon)
  const soon = scene.pulse ? scene.cards.find((c) => c.kind === 'session') : undefined;
  const minutesLeft =
    soon?.kind === 'session'
      ? Math.max(0, Math.ceil((new Date(soon.session.scheduledAt).getTime() - Date.now()) / 60_000))
      : 0;

  return (
    <Screen
      caption={soon ? t.startsIn(minutesLeft) : formatLongDay(new Date())}
      title={soon ? t.soonTitle : dto && !cards.length && empty ? t.title : t.liveTitle}
      action={
        <IconButton
          icon="profile"
          accessibilityLabel={es.common.profile}
          onPress={() => router.push('/perfil')}
        />
      }
    >
      <HomeScene scene={scene} motion={home.motion} />

      {scene.a11y.kind === 'empty' && (
        <Text variant="body" color={colors.text.secondary} style={styles.pad}>
          {t.intro}
        </Text>
      )}
      {presence ? (
        // Ya lo lee la forma: aquí no se repite a VoiceOver
        <Text
          variant="body"
          color={colors.text.secondary}
          style={styles.pad}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          {presence}
        </Text>
      ) : null}

      {cards.length > 0 ? (
        <Carousel title={t.forToday} items={cards} />
      ) : (
        dto && (
          <>
            <EmphasisText
              text={t.nextTask}
              variant="section"
              accessibilityRole="header"
              style={styles.pad}
            />
            <EmptyStateCard
              icon="tasks"
              title={t.emptyTitle}
              body={scene.a11y.kind === 'empty' ? t.emptyBody : t.emptyBodyWithContacts}
              actions={
                <Button
                  label={t.createFirst}
                  icon="plus"
                  onPress={() => router.push('/tarea/nueva')}
                />
              }
            />
          </>
        )
      )}

      {cards.length > 0 && (
        <Button variant="link" label={t.seeTasks} onPress={() => router.navigate('/tareas')} />
      )}

      {hurras.length > 0 && (
        <ListCard>
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

      {done.sheet}
      {respond.sheet}
      {sessionActions.sheets}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.sm },
});
