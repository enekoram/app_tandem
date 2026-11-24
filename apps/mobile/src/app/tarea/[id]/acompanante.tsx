import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useContactsControllerList,
  useTasksControllerGet,
  useTasksControllerUpdate,
} from '@tandems/api-client';
import { formatDue } from '@/lib/dates';
import { invalidateTasks } from '@/lib/queries';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import {
  FormAlert,
  ListCard,
  ListRow,
  ModalHeader,
  ModalScreen,
  PersonPicker,
  Text,
  useToast,
} from '@/ui';

/** CambiarAcompanante: elegir a otra persona (sin la que rechazó o se fue). */
export default function ChangeCompanionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = es.tasks.form;
  const toast = useToast();
  const queryClient = useQueryClient();
  const query = useTasksControllerGet(id);
  const contactsQuery = useContactsControllerList();
  const update = useTasksControllerUpdate();
  const [choice, setChoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const task = query.data?.status === 200 ? query.data.data : undefined;
  const previous = task?.person;
  const contacts = (contactsQuery.data?.status === 200 ? contactsQuery.data.data : []).filter(
    (c) => c.id !== previous?.contactId,
  );

  const save = () => {
    if (!choice) {
      setError(t.companionRequired);
      return;
    }
    update.mutate(
      { id, data: { companionContactId: choice } },
      {
        onSuccess: (res) => {
          void invalidateTasks(queryClient);
          router.back();
          if (res.status === 200)
            toast(es.tasks.created(res.data.person?.name ?? ''), { kind: 'ok' });
        },
        onError: () => setError(es.auth.errors.network),
      },
    );
  };

  return (
    <ModalScreen
      header={
        <ModalHeader
          title={t.changeTitle}
          cancelLabel={t.cancel}
          onCancel={() => router.back()}
          actionLabel={t.save}
          onAction={save}
          actionDisabled={update.isPending}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.body}>
        {error && <FormAlert title={error} />}
        {task && (
          <>
            <Text variant="label" style={styles.pad}>
              {t.taskLabel}
            </Text>
            <ListCard>
              <ListRow
                title={task.title}
                subtitle={`${previous ? es.tasks.card.rejected(previous.name) : es.tasks.card.noCompanion} · ${formatDue(task.dueAt)}`}
              />
            </ListCard>
          </>
        )}
        <Text variant="label" style={styles.pad}>
          {t.otherPerson}
        </Text>
        <PersonPicker
          contacts={contacts}
          value={choice}
          onChange={setChoice}
          onAddContact={() => router.push('/contactos/nuevo')}
          error={!!error && !choice}
        />
        {previous && (
          <Text variant="label" color={colors.text.secondary} style={styles.pad}>
            {t.otherHelp(previous.name)}
          </Text>
        )}
      </ScrollView>
    </ModalScreen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  pad: { paddingHorizontal: spacing.xxs },
});
