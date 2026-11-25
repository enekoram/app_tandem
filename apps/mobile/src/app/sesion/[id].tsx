import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMeControllerMe, useSessionsControllerGet } from '@tandems/api-client';
import { sessionKind } from '@/features/sessions/SessionCard';
import { useSessionActions } from '@/features/sessions/useSessionActions';
import { formatLongDay, formatTime, formatWhen } from '@/lib/dates';
import { es } from '@/strings/es';
import { colors, radii, selfColor, sizes, spacing } from '@/theme';
import { Button, Card, EmptyStateCard, PersonToken, Screen, Text } from '@/ui';

/**
 * Detalle de una sesión. Si la otra persona me invita, es ConfirmarSesion (Aceptar sesión ·
 * Rechazar · Elegir); si no, enseña lo mismo con las acciones de su estado.
 */
export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = es.sessions.detail;
  const c = es.sessions.card;
  const query = useSessionsControllerGet(id);
  const me = useMeControllerMe();
  const actions = useSessionActions({ onDone: () => router.back() });
  const session = query.data?.status === 200 ? query.data.data : undefined;
  const myInitial = me.data?.status === 200 ? me.data.data.displayName.charAt(0) : '';
  const back = { label: es.sessions.back, onPress: () => router.back() };

  if (query.isError || (query.isSuccess && !session)) {
    return (
      <Screen kind="inner" title={es.sessions.title} back={back}>
        <EmptyStateCard
          icon="sessions"
          title={es.sessions.emptyTitle}
          body={es.sessions.errors.changed}
        />
      </Screen>
    );
  }
  if (!session) {
    return (
      <Screen kind="inner" title={es.sessions.title} back={back}>
        {null}
      </Screen>
    );
  }

  const kind = sessionKind(session);
  const name = session.person?.name ?? '';
  const title = kind === 'toConfirm' ? t.title(name) : { lead: '', em: session.taskTitle };
  const caption = {
    toConfirm: c.invitation,
    waiting: c.pending,
    upcoming: c.accepted,
    live: c.live,
  }[kind];
  const date = new Date(session.scheduledAt);

  return (
    <Screen kind="inner" caption={caption} title={title} back={back}>
      <View
        style={styles.people}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.self}>
          <Text variant="avatarInitial">{myInitial.toLocaleUpperCase('es')}</Text>
        </View>
        {session.person && (
          <PersonToken
            name={name}
            initials={session.person.initials}
            color={session.person.color}
            size="kit"
            decorative
          />
        )}
      </View>

      <Card person={session.person?.color} style={styles.card}>
        <Row label={t.task} value={session.taskTitle}>
          {session.role === 'companion' ? t.fromOwner(name) : t.withCompanion(name)}
        </Row>
        <Row label={t.when} value={`${formatLongDay(date)} · ${formatTime(date)}`}>
          {session.previousScheduledAt ? c.moved(formatWhen(session.previousScheduledAt)) : null}
        </Row>
        <Row label={t.where} value={t.meet}>
          {t.meetNote}
        </Row>
        {session.message ? <Row label={t.message} value={session.message} /> : null}
      </Card>

      <View style={styles.cta}>
        {kind === 'toConfirm' && (
          <>
            <Button label={t.acceptSession} icon="check" onPress={() => actions.accept(session)} />
            <Button
              label={c.reject}
              variant="secondary"
              onPress={() => actions.askReject(session)}
            />
            <Button
              label={c.chooseA11y}
              variant="link"
              onPress={() => actions.chooseTime(session)}
            />
          </>
        )}
        {(kind === 'upcoming' || kind === 'live') && (
          <Button label={c.join} onPress={() => actions.join(session)} />
        )}
        {kind === 'upcoming' && (
          <>
            <Button
              label={c.chooseA11y}
              variant="secondary"
              onPress={() => actions.chooseTime(session)}
            />
            <Button label={c.cancel} variant="link" onPress={() => actions.askCancel(session)} />
          </>
        )}
        {kind === 'waiting' && (
          <Button label={c.cancel} variant="secondary" onPress={() => actions.askCancel(session)} />
        )}
      </View>
      {actions.sheets}
    </Screen>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text variant="caption" color={colors.text.caption}>
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
      {children ? (
        <Text variant="body" color={colors.text.secondary}>
          {children}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  people: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.sm },
  self: {
    width: sizes.avatar.kit,
    height: sizes.avatar.kit,
    borderRadius: radii.round,
    backgroundColor: selfColor.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { gap: spacing.lg },
  row: { gap: spacing.xxs },
  cta: { gap: spacing.sm },
});
