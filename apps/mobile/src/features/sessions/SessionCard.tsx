import { Pressable, StyleSheet, View } from 'react-native';
import type { SessionDto } from '@tandems/api-client';
import { formatWhen } from '@/lib/dates';
import { es } from '@/strings/es';
import { colors, fontFamilies, sizes, spacing } from '@/theme';
import { Card, CardAction, Icon, PersonToken, Text, usePersonStyle } from '@/ui';

export type SessionCardKind = 'toConfirm' | 'waiting' | 'upcoming' | 'live';

/** En qué apartado de Mis sesiones va una sesión. */
export function sessionKind(s: SessionDto): SessionCardKind {
  if (s.status === 'live') return 'live';
  if (s.status === 'proposed') return s.proposedByMe ? 'waiting' : 'toConfirm';
  return 'upcoming';
}

/**
 * Tarjeta de sesión (canvas Mis sesiones): la otra persona, la tarea, la hora y las
 * acciones según el estado. Todo el texto se lee también sin color.
 */
export function SessionCard({
  session,
  onAccept,
  onReject,
  onChoose,
  onCancel,
  onJoin,
  onOpen,
}: {
  session: SessionDto;
  onAccept?: () => void;
  onReject?: () => void;
  onChoose?: () => void;
  onCancel?: () => void;
  onJoin?: () => void;
  onOpen?: () => void;
}) {
  const t = es.sessions.card;
  const kind = sessionKind(session);
  const person = session.person;
  const style = usePersonStyle(person?.color);
  const caption = {
    toConfirm: t.invitation,
    waiting: t.pending,
    upcoming: t.accepted,
    live: t.live,
  }[kind];
  const name = (
    <Text variant="body" color={style?.text ?? colors.text.primary} style={styles.name}>
      {person?.name ?? ''}
    </Text>
  );
  const line =
    kind === 'toConfirm' ? (
      <>
        {name}
        {t.invites}
      </>
    ) : kind === 'waiting' ? (
      <>
        {t.waitingFor}
        {name}
        {t.waitingTail}
      </>
    ) : session.role === 'companion' ? (
      <>
        {t.from}
        {name}
        {t.youAccompany}
      </>
    ) : (
      <>
        {t.with}
        {name}
      </>
    );

  return (
    <Card person={person?.color} style={styles.card} accessibilityLabel={session.taskTitle}>
      <Pressable
        style={styles.row}
        onPress={onOpen}
        disabled={!onOpen}
        accessibilityRole={onOpen ? 'button' : undefined}
      >
        {person && (
          <PersonToken
            name={person.name}
            initials={person.initials}
            color={person.color}
            size="md"
            decorative
          />
        )}
        <View style={styles.texts}>
          <Text variant="caption" color={colors.text.caption}>
            {caption}
          </Text>
          <Text variant="bodyStrong" accessibilityRole="header">
            {session.taskTitle}
          </Text>
          <Text variant="body" color={colors.text.secondary}>
            {line}
          </Text>
        </View>
      </Pressable>
      <View style={styles.slot}>
        <Icon name="clock" size={sizes.icon.button} color={colors.text.secondary} />
        <Text variant="label">{formatWhen(session.scheduledAt)}</Text>
        {session.previousScheduledAt && kind !== 'upcoming' && kind !== 'live' ? (
          <Text variant="label" color={colors.text.caption}>
            {t.moved(formatWhen(session.previousScheduledAt))}
          </Text>
        ) : null}
      </View>
      {kind === 'toConfirm' && (
        <View style={styles.actions}>
          <CardAction label={t.accept} icon="check" onPress={() => onAccept?.()} />
          <CardAction label={t.reject} variant="ghost" onPress={() => onReject?.()} />
          <CardAction
            label={t.choose}
            icon="sessions"
            variant="link"
            accessibilityLabel={t.chooseA11y}
            onPress={() => onChoose?.()}
          />
        </View>
      )}
      {kind === 'waiting' && (
        <View style={styles.actions}>
          <CardAction label={t.cancel} variant="ghost" onPress={() => onCancel?.()} />
        </View>
      )}
      {kind === 'upcoming' && (
        <View style={styles.actions}>
          <CardAction label={t.join} onPress={() => onJoin?.()} />
          <CardAction label={t.cancel} variant="ghost" onPress={() => onCancel?.()} />
          <CardAction
            label={t.choose}
            icon="sessions"
            variant="link"
            accessibilityLabel={t.chooseA11y}
            onPress={() => onChoose?.()}
          />
        </View>
      )}
      {kind === 'live' && (
        <View style={styles.actions}>
          <CardAction label={t.join} onPress={() => onJoin?.()} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  texts: { flex: 1, gap: spacing.xxs },
  name: { fontFamily: fontFamilies.sansSemiBold },
  slot: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
