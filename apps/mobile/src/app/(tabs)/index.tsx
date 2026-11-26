import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  useSupportControllerDecline,
  useTasksControllerList,
  type SessionDto,
  type TaskDto,
} from '@tandems/api-client';
import { useQueryClient } from '@tanstack/react-query';
import type { SceneCard } from '@tandems/shared';
import { presenceLine } from '@/features/home/a11y';
import { HomeScene } from '@/features/home/HomeScene';
import { SessionCard } from '@/features/sessions/SessionCard';
import { SupportRequestCard } from '@/features/support/SupportRequestCard';
import { useSessionActions } from '@/features/sessions/useSessionActions';
import { useHome } from '@/features/home/useHome';
import { useCompleteTask } from '@/features/tasks/useCompleteTask';
import { useRespondShared } from '@/features/tasks/useRespondShared';
import { useAskSupport } from '@/features/support/useAskSupport';
import { formatDue, formatLongDay } from '@/lib/dates';
import { useOnline } from '@/lib/online';
import { prefs } from '@/lib/prefs';
import { invalidateSessions } from '@/lib/queries';
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
  useToast,
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
  const queryClient = useQueryClient();
  const toast = useToast();
  const online = useOnline();
  const askSupport = useAskSupport();
  const decline = useSupportControllerDecline();
  const finished = useTasksControllerList({ status: 'done' });
  const { scene, dto } = home;

  const hurras = (finished.data?.status === 200 ? finished.data.data : []).filter(
    (x) => x.hurraAt && Date.now() - new Date(x.hurraAt).getTime() < RECENT_MS,
  );

  // HurraRecibido: un ¡hurra! nuevo se celebra una vez (pantalla + brillo en la forma)
  const { send } = home;
  const celebrated = useRef(new Set<string>());
  // Se vuelve a mirar solo cuando cambia la lista de ¡hurras! (no en cada render)
  const hurraIds = hurras.map((x) => x.id).join(',');
  useEffect(() => {
    const seen = [...prefs.hurrasSeen(), ...celebrated.current];
    const fresh = hurras.find((x) => !seen.includes(x.id));
    if (!fresh) return;
    // Todas las de ahora cuentan como vistas: una sola pantalla aunque lleguen varias
    hurras.forEach((x) => celebrated.current.add(x.id));
    void prefs.setHurrasSeen([...new Set([...seen, ...hurras.map((x) => x.id)])]);
    send({ type: 'HURRA' });
    router.push({
      pathname: '/tarea/hurra',
      params: { id: fresh.id, title: fresh.title, name: fresh.person?.name ?? '' },
    });
  }, [hurraIds, send]);
  const byId = new Map<string, TaskDto>(
    [...(dto?.tasks ?? []), ...(dto?.shared ?? [])].map((x) => [x.id, x]),
  );
  const asked = new Set((dto?.support?.outgoing ?? []).map((r) => r.taskId));
  const supportById = new Map((dto?.support?.incoming ?? []).map((r) => [r.id, r]));
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
            support={askSupport(task)}
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
    if (card.kind === 'request' && card.request.kind === 'support') {
      const request = supportById.get(card.request.id.replace(/^support:/, ''));
      if (!request) return null;
      const name = request.person?.name ?? '';
      return {
        key: `support:${request.id}`,
        label: t.cardSupport(name, request.taskTitle),
        node: (
          <SupportRequestCard
            request={request}
            motion={home.motion}
            online={online}
            onDecline={() =>
              decline.mutate(
                { id: request.id },
                {
                  onSettled: () => void invalidateSessions(queryClient),
                  onSuccess: () => toast(es.support.request.declined(name)),
                },
              )
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

  // Te piden: explicar las ondas y dejar tocar la forma para responder
  const firstRequest = scene.approach ? scene.cards[0] : undefined;
  const asking =
    firstRequest?.kind === 'request'
      ? (() => {
          const r = firstRequest.request;
          const name = r.person.name;
          const rawId = r.id.replace(/^[a-z]+:/, '');
          if (r.kind === 'task') {
            return {
              text: t.asks.task(name, r.taskTitle),
              open: () => router.navigate('/acompano'),
            };
          }
          if (r.kind === 'session') {
            return {
              text: t.asks.session(name),
              open: () => router.push({ pathname: '/sesion/[id]', params: { id: rawId } }),
            };
          }
          return { text: t.asks.support(name), open: undefined };
        })()
      : undefined;

  // SesionPorEmpezar: la Home cambia de titular cuando falta poco (doc 03 · sessionSoon)
  const soon = scene.pulse ? scene.cards.find((c) => c.kind === 'session') : undefined;
  const minutesLeft =
    soon?.kind === 'session'
      ? Math.max(0, Math.ceil((new Date(soon.session.scheduledAt).getTime() - Date.now()) / 60_000))
      : 0;

  // ApoyoRecibido manda sobre todo; después, ApoyoPedido de tu siguiente tarea
  const supporterName = home.supporter?.name;
  const next = scene.cards.find((c) => c.kind === 'nextTask');
  const waitingFor =
    next?.kind === 'nextTask' && asked.has(next.task.id) ? next.task.companion?.name : undefined;
  const header = supporterName
    ? { caption: es.support.receiving.caption, title: es.support.receiving.title(supporterName) }
    : soon
      ? { caption: t.startsIn(minutesLeft), title: t.soonTitle }
      : waitingFor
        ? { caption: es.support.waiting.caption, title: es.support.waiting.title(waitingFor) }
        : {
            caption: formatLongDay(new Date()),
            title: dto && !cards.length && empty ? t.title : t.liveTitle,
          };

  return (
    <Screen
      caption={header.caption}
      title={header.title}
      action={
        <IconButton
          icon="profile"
          accessibilityLabel={es.common.profile}
          onPress={() => router.push('/perfil')}
        />
      }
    >
      <HomeScene
        scene={scene}
        motion={home.motion}
        onPress={asking?.open}
        accessibilityHint={t.asks.hint}
      />
      {asking ? (
        <View style={[styles.pad, styles.asks]}>
          <Text variant="lead">{asking.text}</Text>
          <Text variant="body" color={colors.text.secondary}>
            {t.asks.ripples}
            {asking.open ? ` ${t.asks.tap}.` : ''}
          </Text>
        </View>
      ) : null}
      {supporterName ? (
        <Text variant="lead" color={colors.text.secondary} style={styles.pad}>
          {es.support.receiving.body(supporterName)}
        </Text>
      ) : waitingFor ? (
        <Text variant="body" color={colors.text.secondary} style={styles.pad}>
          {es.support.waiting.body}
        </Text>
      ) : null}

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
  asks: { gap: spacing.xxs },
});
