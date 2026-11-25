import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSupportControllerRequest, useTasksControllerGet } from '@tandems/api-client';
import { SUPPORT_MESSAGE_MAX } from '@tandems/shared';
import { invalidateSessions } from '@/lib/queries';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import {
  Button,
  EmphasisText,
  FormAlert,
  ModalHeader,
  ModalScreen,
  TaskCard,
  Text,
  TextField,
  useToast,
} from '@/ui';

/** PedirApoyo (hoja modal): avisa a quien acompaña la tarea de que estás con ella. */
export default function AskSupportScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const t = es.support.ask;
  const toast = useToast();
  const queryClient = useQueryClient();
  const query = useTasksControllerGet(taskId);
  const ask = useSupportControllerRequest();
  const task = query.data?.status === 200 ? query.data.data : undefined;
  const name = task?.person?.name ?? '';
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const send = () =>
    ask.mutate(
      { data: { taskId, message: message.trim() || undefined } },
      {
        onSuccess: (res) => {
          if (res.status !== 201) return;
          // /me/home trae las peticiones (ApoyoPedido)
          void invalidateSessions(queryClient);
          router.back();
          toast(t.sent(name), { kind: 'ok' });
        },
        onError: () => setError(es.auth.errors.network),
      },
    );

  return (
    <ModalScreen
      header={
        <ModalHeader
          title={t.title}
          cancelLabel={t.cancel}
          onCancel={() => router.back()}
          actionLabel={es.sessions.form.send}
          actionIcon="send"
          onAction={send}
          actionDisabled={ask.isPending || !task}
        />
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        {error && <FormAlert title={error} />}
        {task && (
          <>
            <EmphasisText text={t.heading(name)} variant="title" accessibilityRole="header" />
            <Text variant="lead" color={colors.text.secondary}>
              {t.body(name)}
            </Text>
            <TaskCard task={task} />
          </>
        )}
        <TextField
          label={t.message}
          value={message}
          onChangeText={setMessage}
          maxLength={SUPPORT_MESSAGE_MAX}
          multiline
          textAlignVertical="top"
        />
        <Button
          label={t.send(name)}
          icon="heart"
          onPress={send}
          disabled={ask.isPending || !task}
          accessibilityState={{ busy: ask.isPending }}
        />
      </ScrollView>
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.xl },
});
