import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  useContactsControllerList,
  useTasksControllerList,
  type TaskDto,
} from '@tandems/api-client';
import { MAX_OPEN_TASKS } from '@tandems/shared';
import { useAskSupport } from '@/features/support/useAskSupport';
import { useCompleteTask } from '@/features/tasks/useCompleteTask';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import {
  Button,
  Card,
  CardAction,
  ConfirmSheet,
  EmphasisText,
  EmptyStateCard,
  IconButton,
  PersonToken,
  Screen,
  TaskCard,
  Text,
} from '@/ui';

export default function TasksScreen() {
  const t = es.tasks;
  const query = useTasksControllerList({ status: 'open' });
  const contacts = useContactsControllerList();
  const askSupport = useAskSupport();
  const done = useCompleteTask();
  const [limitOpen, setLimitOpen] = useState(false);

  const tasks = query.data?.status === 200 ? query.data.data : [];
  const hasContacts = contacts.data?.status === 200 && contacts.data.data.length > 0;
  const needsAttention = tasks.filter(
    (x) => x.companionStatus === 'rejected' || x.companionStatus === 'left',
  );
  const [first, ...rest] = tasks;

  const add = () =>
    tasks.length >= MAX_OPEN_TASKS ? setLimitOpen(true) : router.push('/tarea/nueva');
  const edit = (task: TaskDto) => router.push({ pathname: '/tarea/[id]', params: { id: task.id } });

  return (
    <Screen
      caption={
        query.isSuccess
          ? tasks.length
            ? t.count(tasks.length, MAX_OPEN_TASKS)
            : t.caption
          : undefined
      }
      title={t.title}
      action={<IconButton icon="plus" variant="primary" accessibilityLabel={t.add} onPress={add} />}
    >
      {query.isSuccess && tasks.length === 0 ? (
        <>
          <EmptyStateCard
            icon="tasks"
            title={t.emptyTitle}
            body={t.emptyBody}
            actions={
              <>
                <Button
                  label={t.createFirst}
                  icon="plus"
                  onPress={() => router.push('/tarea/nueva')}
                />
                {!hasContacts && (
                  <Button
                    label={t.addContactFirst}
                    variant="secondary"
                    onPress={() => router.push('/contactos/nuevo')}
                  />
                )}
              </>
            }
          />
          <Text variant="body" color={colors.text.secondary} style={styles.pad}>
            {t.hint}
          </Text>
        </>
      ) : (
        <>
          {needsAttention.map((task) => (
            <Card key={`alert-${task.id}`} style={styles.alert}>
              <View style={styles.alertRow}>
                {task.person && (
                  <PersonToken
                    name={task.person.name}
                    initials={task.person.initials}
                    color={task.person.color}
                    pending
                    size="md"
                    decorative
                  />
                )}
                <View style={styles.flex}>
                  <Text variant="caption" color={colors.text.caption}>
                    {t.alert.caption}
                  </Text>
                  <Text variant="bodyStrong">
                    {task.companionStatus === 'left'
                      ? t.alert.left(task.person?.name ?? '', task.title)
                      : t.alert.rejected(task.person?.name ?? '', task.title)}
                  </Text>
                  <Text variant="body" color={colors.text.secondary}>
                    {t.alert.body}
                  </Text>
                </View>
              </View>
              <CardAction
                label={t.alert.change}
                icon="users"
                variant="ghost"
                onPress={() =>
                  router.push({ pathname: '/tarea/[id]/acompanante', params: { id: task.id } })
                }
              />
            </Card>
          ))}
          {first && (
            <>
              <EmphasisText
                text={t.firstSection}
                variant="section"
                accessibilityRole="header"
                style={styles.pad}
              />
              <TaskCard
                task={first}
                featured
                support={askSupport(first)}
                onDone={() => done.ask(first)}
                onEdit={() => edit(first)}
              />
            </>
          )}
          {rest.length > 0 && (
            <>
              <EmphasisText
                text={t.nextSection}
                variant="section"
                accessibilityRole="header"
                style={styles.pad}
              />
              {rest.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  support={askSupport(task)}
                  onDone={() => done.ask(task)}
                  onEdit={() => edit(task)}
                />
              ))}
            </>
          )}
          {query.isSuccess && (
            <Button
              variant="link"
              label={t.seeDone}
              onPress={() => router.push('/tarea/terminadas')}
            />
          )}
        </>
      )}

      {done.sheet}
      <ConfirmSheet
        visible={limitOpen}
        title={t.limit.title}
        body={t.limit.body}
        confirmLabel={t.limit.next}
        cancelLabel={t.limit.see}
        onConfirm={() => setLimitOpen(false)}
        onCancel={() => setLimitOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.sm },
  alert: { gap: spacing.md },
  alertRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  flex: { flex: 1, gap: spacing.xxs },
});
