import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionsControllerGet, useSessionsControllerPropose } from '@tandems/api-client';
import { SESSION_MESSAGE_MAX, SESSION_MIN_LEAD_MS } from '@tandems/shared';
import { SessionCard, sessionKind } from '@/features/sessions/SessionCard';
import { apiErrorCode } from '@/lib/apiErrors';
import { combineDateTime } from '@/lib/dates';
import { invalidateSessions } from '@/lib/queries';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import {
  DateTimePill,
  FormAlert,
  ListCard,
  ModalHeader,
  ModalScreen,
  Text,
  TextField,
  useToast,
} from '@/ui';

/**
 * ProponerHora (al recibir una invitación) y ReprogramarSesion (una ya aceptada): misma
 * hoja; la otra persona tendrá que aceptar la nueva hora.
 */
export default function ProposeTimeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = es.sessions.propose;
  const f = es.sessions.form;
  const toast = useToast();
  const queryClient = useQueryClient();
  const query = useSessionsControllerGet(id);
  const propose = useSessionsControllerPropose();
  const session = query.data?.status === 200 ? query.data.data : undefined;
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ when?: string; form?: string }>({});
  const name = session?.person?.name ?? '';
  const invitation = session ? sessionKind(session) === 'toConfirm' : false;

  const submit = () => {
    const scheduledAt = combineDateTime(date, time);
    if (!scheduledAt) return setErrors({ when: f.whenRequired });
    if (new Date(scheduledAt).getTime() < Date.now() + SESSION_MIN_LEAD_MS) {
      return setErrors({ when: f.past });
    }
    setErrors({});
    propose.mutate(
      { id, data: { scheduledAt, message: message.trim() || undefined } },
      {
        onSuccess: (res) => {
          if (res.status !== 200) return;
          void invalidateSessions(queryClient);
          router.back();
          toast(t.sent(name), { kind: 'ok' });
        },
        onError: (error) =>
          setErrors(
            apiErrorCode(error) === 'SESSION_IN_PAST'
              ? { when: f.past }
              : { form: es.sessions.errors.changed },
          ),
      },
    );
  };

  return (
    <ModalScreen
      header={
        <ModalHeader
          title={invitation ? t.title : t.rescheduleTitle}
          cancelLabel={f.cancel}
          onCancel={() => router.back()}
          actionLabel={f.send}
          actionIcon="send"
          onAction={submit}
          actionDisabled={propose.isPending || !session}
        />
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        {errors.form && <FormAlert title={errors.form} />}
        {session && (
          <View style={styles.group}>
            <Text variant="label" style={styles.pad}>
              {invitation ? t.invitationFrom(name) : t.current}
            </Text>
            <SessionCard session={session} />
          </View>
        )}
        <View style={styles.group}>
          <Text variant="label" style={styles.pad}>
            {f.when}
          </Text>
          <ListCard>
            <DateTimePill label={t.newDate} mode="date" value={date} onChange={setDate} />
            <DateTimePill label={t.newTime} mode="time" value={time} onChange={setTime} />
          </ListCard>
          {errors.when && (
            <Text
              variant="label"
              color={colors.field.errorText}
              style={styles.pad}
              accessibilityLiveRegion="polite"
            >
              {errors.when}
            </Text>
          )}
        </View>
        <TextField
          label={t.message}
          value={message}
          onChangeText={setMessage}
          maxLength={SESSION_MESSAGE_MAX}
          multiline
          textAlignVertical="top"
        />
        {session && (
          <Text variant="body" color={colors.text.secondary} style={styles.pad}>
            {t.note(name)}
          </Text>
        )}
      </ScrollView>
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.xl },
  group: { gap: spacing.sm },
  pad: { paddingHorizontal: spacing.xxs },
});
