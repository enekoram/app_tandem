import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  contactsControllerRemove,
  getContactsControllerListQueryKey,
  getTasksControllerAccompanyingQueryKey,
  getTasksControllerListQueryKey,
  useContactsControllerGet,
  useContactsControllerResend,
  useSupportControllerThinking,
  useTasksControllerAccompanying,
  useTasksControllerList,
  type ContactDto,
  type TaskDto,
} from '@tandems/api-client';
import { apiErrorCode } from '@/lib/apiErrors';
import { formatDue } from '@/lib/dates';
import { runUndoable } from '@/lib/undoable';
import { es } from '@/strings/es';
import { colors, radii, sizes, spacing } from '@/theme';
import {
  Button,
  ConfirmSheet,
  EmphasisText,
  Icon,
  ListCard,
  ListRow,
  PersonToken,
  Screen,
  Text,
  useToast,
} from '@/ui';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = es.contacts.detail;
  const toast = useToast();
  const queryClient = useQueryClient();
  const query = useContactsControllerGet(id);
  const mine = useTasksControllerList();
  const theirs = useTasksControllerAccompanying();
  const resend = useContactsControllerResend();
  const thinking = useSupportControllerThinking();
  const [confirming, setConfirming] = useState(false);
  const [resentTo, setResentTo] = useState<string | null>(null);

  const contact = query.data?.status === 200 ? query.data.data : undefined;
  if (!contact)
    return (
      <Screen
        kind="inner"
        title={es.contacts.title}
        back={{ label: t.back, onPress: () => router.back() }}
      >
        {null}
      </Screen>
    );

  const pending = contact.status !== 'accepted';
  const myTasks = (mine.data?.status === 200 ? mine.data.data : []).filter(
    (task) =>
      task.person?.contactId === contact.id &&
      (task.companionStatus === 'pending' || task.companionStatus === 'accepted'),
  );
  const accompanied = (theirs.data?.status === 200 ? theirs.data.data : []).filter(
    (task) => task.person?.contactId === contact.id,
  );

  const doResend = () =>
    resend.mutate(
      { id: contact.id },
      {
        onSuccess: () => setResentTo(contact.email),
        onError: (error) =>
          toast(apiErrorCode(error) === 'RESEND_LIMIT' ? t.resendLimit : es.auth.errors.network, {
            kind: 'err',
          }),
      },
    );

  /** Quitar con «Deshacer»: desaparece al momento y se borra de verdad a los 8 s. */
  const remove = () => {
    setConfirming(false);
    const listKey = getContactsControllerListQueryKey();
    const previous = queryClient.getQueryData(listKey);
    queryClient.setQueryData(listKey, (old: { status: number; data: ContactDto[] } | undefined) =>
      old ? { ...old, data: old.data.filter((c) => c.id !== contact.id) } : old,
    );
    router.back();
    const undo = runUndoable({
      commit: async () => {
        await contactsControllerRemove(contact.id).catch(() => undefined);
        for (const key of [
          listKey,
          getTasksControllerListQueryKey(),
          getTasksControllerAccompanyingQueryKey(),
        ]) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
      },
      onUndo: () => queryClient.setQueryData(listKey, previous),
    });
    const done = pending
      ? es.contacts.cancelSheet.done(contact.name)
      : es.contacts.removeSheet.done(contact.name);
    toast(done, { action: { label: es.contacts.undo, onPress: undo } });
  };

  const sheet = pending
    ? {
        title: es.contacts.cancelSheet.title(contact.name),
        body: es.contacts.cancelSheet.body(myTasks[0]?.title),
        confirm: es.contacts.cancelSheet.confirm,
        cancel: es.contacts.cancelSheet.back,
      }
    : {
        title: es.contacts.removeSheet.title(contact.name),
        body: es.contacts.removeSheet.body(contact.name, myTasks[0]?.title, accompanied[0]?.title),
        confirm: es.contacts.removeSheet.confirm,
        cancel: es.contacts.removeSheet.cancel,
      };

  return (
    <Screen
      kind="inner"
      title={{ lead: contact.name, em: '' }}
      back={{ label: t.back, onPress: () => router.back() }}
    >
      <View style={styles.header}>
        <PersonToken
          name={contact.name}
          initials={contact.initials}
          color={contact.color}
          pending={pending}
          size="lg"
        />
        <View style={styles.flex}>
          <Text variant="body" color={colors.text.secondary}>
            {contact.email}
          </Text>
          <View style={styles.chip}>
            {!pending && (
              <Icon
                name="checkCircle"
                size={sizes.icon.inline}
                color={colors.status.liveText}
                strokeWidth={2}
              />
            )}
            <Text variant="label" color={colors.text.caption}>
              {pending ? es.contacts.pending : es.contacts.accepted}
            </Text>
          </View>
        </View>
      </View>

      {pending ? (
        <>
          <Text variant="lead" color={colors.text.secondary} style={styles.pad}>
            {t.pendingInfo}
          </Text>
          <TaskSection
            title={t.waitingFor(contact.name)}
            tasks={myTasks}
            subtitle={(task) => `${t.waitingAccept} · ${formatDue(task.dueAt)}`}
          />
          {resentTo ? (
            <View style={styles.ok} accessibilityLiveRegion="polite">
              <Icon
                name="checkCircle"
                size={sizes.icon.inline}
                color={colors.status.liveText}
                strokeWidth={2}
              />
              <Text variant="label" color={colors.text.caption}>
                {t.resent(resentTo)}
              </Text>
            </View>
          ) : (
            <Button
              label={t.resend}
              icon="send"
              variant="secondary"
              onPress={doResend}
              disabled={resend.isPending}
            />
          )}
        </>
      ) : (
        <>
          <Button
            label={es.support.thinking.action}
            icon="heart"
            variant="secondary"
            disabled={thinking.isPending}
            onPress={() =>
              thinking.mutate(
                { data: { contactId: contact.id } },
                {
                  onSuccess: () => toast(es.support.thinking.sent(contact.name), { kind: 'ok' }),
                  onError: (error) =>
                    toast(
                      apiErrorCode(error) === 'THINKING_LIMIT'
                        ? es.support.thinking.limit
                        : es.auth.errors.network,
                      { kind: 'err' },
                    ),
                },
              )
            }
          />
          <TaskSection
            title={t.accompaniesYou}
            tasks={myTasks}
            subtitle={(task) => formatDue(task.dueAt)}
          />
          <TaskSection
            title={t.youAccompany(contact.name)}
            tasks={accompanied}
            subtitle={(task) => formatDue(task.dueAt)}
          />
        </>
      )}

      <ListCard>
        <ListRow
          icon="userMinus"
          title={pending ? t.cancelInvite : t.remove}
          destructive
          onPress={() => setConfirming(true)}
        />
      </ListCard>

      <ConfirmSheet
        visible={confirming}
        title={sheet.title}
        body={sheet.body}
        confirmLabel={sheet.confirm}
        confirmIcon="userMinus"
        cancelLabel={sheet.cancel}
        destructive
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}

function TaskSection({
  title,
  tasks,
  subtitle,
}: {
  title: { lead: string; em: string };
  tasks: TaskDto[];
  subtitle: (task: TaskDto) => string;
}) {
  if (!tasks.length) return null;
  return (
    <>
      <EmphasisText text={title} variant="section" accessibilityRole="header" style={styles.pad} />
      <ListCard>
        {tasks.map((task) => (
          <ListRow key={task.id} title={task.title} subtitle={subtitle(task)} />
        ))}
      </ListCard>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  flex: { flex: 1, gap: spacing.xs },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.bubble,
    backgroundColor: colors.bg.bubble,
  },
  pad: { paddingHorizontal: spacing.sm },
  ok: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
