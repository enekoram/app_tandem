import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSessionsControllerCreate,
  useTasksControllerAccompanying,
  useTasksControllerList,
  type TaskDto,
} from '@tandems/api-client';
import { SESSION_MIN_LEAD_MS } from '@tandems/shared';
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
  OptionPicker,
  PersonToken,
  Text,
  TextField,
  useToast,
} from '@/ui';

type Errors = { task?: string; when?: string; meet?: string; form?: string };

/**
 * ProgramarSesion (hoja modal): una tarea con acompañante que ha aceptado (mía o que
 * acompaño), fecha y hora futuras y, de momento, el enlace de Meet a mano (opcional).
 */
export default function ScheduleSessionScreen() {
  const t = es.sessions.form;
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const mine = useTasksControllerList({ status: 'open' });
  const accompanying = useTasksControllerAccompanying({ status: 'open' });
  const create = useSessionsControllerCreate();
  const [task, setTask] = useState<string | null>(taskId ?? null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [meetUrl, setMeetUrl] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const eligible: TaskDto[] = [
    ...(mine.data?.status === 200 ? mine.data.data : []),
    ...(accompanying.data?.status === 200 ? accompanying.data.data : []),
  ].filter((x) => x.companionStatus === 'accepted' && x.person);
  const chosen = eligible.find((x) => x.id === task);
  const loaded = mine.isSuccess && accompanying.isSuccess;

  const submit = () => {
    const scheduledAt = combineDateTime(date, time);
    const url = meetUrl.trim();
    const found: Errors = {};
    if (!chosen) found.task = t.taskRequired;
    if (!scheduledAt) found.when = t.whenRequired;
    else if (new Date(scheduledAt).getTime() < Date.now() + SESSION_MIN_LEAD_MS)
      found.when = t.past;
    if (url && !/^https:\/\/\S+$/.test(url)) found.meet = t.meetInvalid;
    setErrors(found);
    if (found.task || found.when || found.meet || !chosen || !scheduledAt) return;

    create.mutate(
      { data: { taskId: chosen.id, scheduledAt, meetUrl: url || undefined } },
      {
        onSuccess: (res) => {
          if (res.status !== 201) return;
          void invalidateSessions(queryClient);
          router.back();
          toast(es.sessions.sent(res.data.person?.name ?? ''), {
            kind: 'ok',
            action: { label: es.sessions.ok, onPress: () => {} },
          });
        },
        onError: (error) => {
          const code = apiErrorCode(error);
          if (code === 'SESSION_IN_PAST') setErrors({ when: t.past });
          else if (code === 'SESSION_EXISTS') setErrors({ form: t.exists });
          else setErrors({ form: es.auth.errors.network });
        },
      },
    );
  };

  return (
    <ModalScreen
      header={
        <ModalHeader
          title={t.title}
          cancelLabel={t.cancel}
          onCancel={() => router.back()}
          actionLabel={t.send}
          actionIcon="send"
          onAction={submit}
          actionDisabled={create.isPending}
        />
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        {errors.form && <FormAlert title={errors.form} />}
        <View style={styles.group}>
          <Text variant="label" style={styles.pad}>
            {t.task}
          </Text>
          {errors.task && (
            <Text variant="label" color={colors.field.errorText} style={styles.pad}>
              {errors.task}
            </Text>
          )}
          {loaded && eligible.length === 0 ? (
            <Text variant="body" color={colors.text.secondary} style={styles.pad}>
              {t.noTasks}
            </Text>
          ) : (
            <OptionPicker
              options={eligible.map((x) => ({
                id: x.id,
                title: x.title,
                subtitle: x.person?.name,
                leading: x.person ? (
                  <PersonToken
                    name={x.person.name}
                    initials={x.person.initials}
                    color={x.person.color}
                    size="sm"
                    decorative
                  />
                ) : undefined,
              }))}
              value={task}
              onChange={setTask}
              error={!!errors.task}
            />
          )}
          {chosen?.person && (
            <Text variant="label" color={colors.text.secondary} style={styles.pad}>
              {chosen.role === 'owner'
                ? t.with(chosen.person.name)
                : t.withOwner(chosen.person.name)}
            </Text>
          )}
        </View>

        <View style={styles.group}>
          <Text variant="label" style={styles.pad}>
            {t.when}
          </Text>
          <ListCard>
            <DateTimePill label={t.date} mode="date" value={date} onChange={setDate} />
            <DateTimePill label={t.time} mode="time" value={time} onChange={setTime} />
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
          label={t.meet}
          placeholder={t.meetPlaceholder}
          value={meetUrl}
          onChangeText={setMeetUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          textContentType="URL"
          error={errors.meet}
        />
        <Text variant="body" color={colors.text.secondary} style={styles.pad}>
          {t.note}
        </Text>
      </ScrollView>
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.xl },
  group: { gap: spacing.sm },
  pad: { paddingHorizontal: spacing.xxs },
});
