import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSessionsControllerList, type SessionDto } from '@tandems/api-client';
import type { Emphasis } from '@/strings/es';
import { SessionCard, sessionKind, type SessionCardKind } from '@/features/sessions/SessionCard';
import { useSessionActions } from '@/features/sessions/useSessionActions';
import { es } from '@/strings/es';
import { spacing } from '@/theme';
import { Button, EmphasisText, EmptyStateCard, IconButton, Screen } from '@/ui';

const SECTIONS: { kind: SessionCardKind; title: Emphasis }[] = [
  { kind: 'toConfirm', title: es.sessions.toConfirm },
  { kind: 'waiting', title: es.sessions.waiting },
];

/** Mis sesiones: por confirmar, esperando respuesta y próximas (en curso primero). */
export default function SessionsScreen() {
  const t = es.sessions;
  const query = useSessionsControllerList();
  const actions = useSessionActions();
  const sessions = query.data?.status === 200 ? query.data.data : [];
  const of = (kind: SessionCardKind) => sessions.filter((s) => sessionKind(s) === kind);
  // Próximas: las que están en curso van delante
  const upcoming = [...of('live'), ...of('upcoming')];
  const schedule = () => router.push('/sesion/nueva');
  const open = (s: SessionDto) => router.push({ pathname: '/sesion/[id]', params: { id: s.id } });

  const card = (s: SessionDto) => (
    <SessionCard
      key={s.id}
      session={s}
      onOpen={() => open(s)}
      onAccept={() => actions.accept(s)}
      onReject={() => actions.askReject(s)}
      onChoose={() => actions.chooseTime(s)}
      onCancel={() => actions.askCancel(s)}
      onJoin={() => actions.join(s)}
    />
  );

  return (
    <Screen
      caption={
        query.isSuccess ? (sessions.length ? t.count(sessions.length) : t.caption) : undefined
      }
      title={t.title}
      action={
        <IconButton icon="plus" variant="primary" accessibilityLabel={t.add} onPress={schedule} />
      }
    >
      {query.isSuccess && sessions.length === 0 ? (
        <EmptyStateCard
          icon="sessions"
          title={t.emptyTitle}
          body={t.emptyBody}
          actions={<Button label={t.schedule} icon="plus" onPress={schedule} />}
        />
      ) : (
        <>
          {SECTIONS.map(({ kind, title }) =>
            of(kind).length ? (
              <Section key={kind} title={title}>
                {of(kind).map(card)}
              </Section>
            ) : null,
          )}
          {upcoming.length > 0 && <Section title={t.upcoming}>{upcoming.map(card)}</Section>}
        </>
      )}
      {actions.sheets}
    </Screen>
  );
}

function Section({ title, children }: { title: Emphasis; children: React.ReactNode }) {
  return (
    <>
      <EmphasisText text={title} variant="section" accessibilityRole="header" style={styles.pad} />
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.sm },
});
