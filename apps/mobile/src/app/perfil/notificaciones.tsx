import { StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  getMeControllerMeQueryKey,
  useMeControllerMe,
  useMeControllerNotifications,
  useMeControllerQuiet,
} from '@tandems/api-client';
import type { NotificationKind } from '@tandems/shared';
import type { Emphasis } from '@/strings/es';
import { es } from '@/strings/es';
import { colors, sizes, spacing } from '@/theme';
import { DateTimePill, EmphasisText, ListCard, Screen, Text, useToast } from '@/ui';

const GROUPS: { title: Emphasis; kinds: NotificationKind[] }[] = [
  {
    title: es.notifications.fromAccompanied,
    kinds: ['supportRequests', 'sharedTasks', 'sessionInvites', 'tasksDone'],
  },
  { title: es.notifications.fromCompanions, kinds: ['supportReceived', 'hurras'] },
  { title: es.notifications.reminders, kinds: ['sessionReminders'] },
];

/** NotificacionesKV: qué avisos quiere recibir la persona (todos activados por defecto). */
export default function NotificationsScreen() {
  const t = es.notifications;
  const toast = useToast();
  const queryClient = useQueryClient();
  const me = useMeControllerMe();
  const update = useMeControllerNotifications();
  const prefs = me.data?.status === 200 ? me.data.data.notifications : undefined;
  const quiet = me.data?.status === 200 ? me.data.data.quiet : undefined;
  const updateQuiet = useMeControllerQuiet();

  const saveQuiet = (next: { enabled: boolean; start: string; end: string }) =>
    updateQuiet.mutate(
      { data: next },
      {
        onSuccess: (res) => {
          if (res.status === 200) queryClient.setQueryData(getMeControllerMeQueryKey(), res);
        },
        onError: () => toast(es.auth.errors.network, { kind: 'err' }),
      },
    );

  const toggle = (kind: NotificationKind, value: boolean) =>
    update.mutate(
      { data: { [kind]: value } },
      {
        onSuccess: (res) => {
          if (res.status === 200) queryClient.setQueryData(getMeControllerMeQueryKey(), res);
        },
        onError: () => toast(es.auth.errors.network, { kind: 'err' }),
      },
    );

  return (
    <Screen kind="inner" title={t.title} back={{ label: t.back, onPress: () => router.back() }}>
      <Text variant="body" color={colors.text.secondary} style={styles.pad}>
        {t.pushLater}
      </Text>
      {GROUPS.map((group) => (
        <View key={group.kinds[0]} style={styles.group}>
          <EmphasisText
            text={group.title}
            variant="section"
            accessibilityRole="header"
            style={styles.pad}
          />
          <ListCard>
            {group.kinds.map((kind) => {
              const copy = t.kinds[kind];
              const value = prefs?.[kind] ?? true;
              return (
                <View key={kind} style={styles.row}>
                  <View style={styles.texts}>
                    <Text variant="bodyStrong">{copy.title}</Text>
                    <Text variant="label" color={colors.text.secondary}>
                      {copy.body}
                    </Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={(next) => toggle(kind, next)}
                    disabled={!prefs}
                    accessibilityLabel={copy.title}
                    accessibilityHint={copy.body}
                    trackColor={{ true: colors.action.primary, false: colors.border.subtle }}
                  />
                </View>
              );
            })}
          </ListCard>
        </View>
      ))}

      {quiet && (
        <View style={styles.group}>
          <EmphasisText
            text={t.quiet.title}
            variant="section"
            accessibilityRole="header"
            style={styles.pad}
          />
          <ListCard>
            <View style={styles.row}>
              <View style={styles.texts}>
                <Text variant="bodyStrong">{t.quiet.toggle}</Text>
                <Text variant="label" color={colors.text.secondary}>
                  {t.quiet.body}
                </Text>
              </View>
              <Switch
                value={quiet.enabled}
                onValueChange={(enabled) => saveQuiet({ ...quiet, enabled })}
                accessibilityLabel={t.quiet.toggle}
                accessibilityHint={t.quiet.body}
                trackColor={{ true: colors.action.primary, false: colors.border.subtle }}
              />
            </View>
            {quiet.enabled && (
              <>
                <DateTimePill
                  label={t.quiet.from}
                  mode="time"
                  value={toDate(quiet.start)}
                  onChange={(d) => d && saveQuiet({ ...quiet, start: toHHMM(d) })}
                />
                <DateTimePill
                  label={t.quiet.to}
                  mode="time"
                  value={toDate(quiet.end)}
                  onChange={(d) => d && saveQuiet({ ...quiet, end: toHHMM(d) })}
                />
              </>
            )}
          </ListCard>
        </View>
      )}
    </Screen>
  );
}

/** «22:00» ↔ hora de hoy (para el selector nativo). */
function toDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}
const pad = (n: number) => String(n).padStart(2, '0');
function toHHMM(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: spacing.sm },
  group: { gap: spacing.sm },
  row: {
    minHeight: sizes.listRow.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  texts: { flex: 1, gap: spacing.xxs },
});
