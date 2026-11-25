import { useEffect } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMeControllerMe,
  useSessionsControllerGet,
  useSessionsControllerJoin,
} from '@tandems/api-client';
import { apiErrorCode } from '@/lib/apiErrors';
import { invalidateSessions } from '@/lib/queries';
import { es } from '@/strings/es';
import { colors, radii, selfColor, sizes, spacing } from '@/theme';
import { AuthLayout, BackLink, Button, EmphasisText, PersonToken, Text, useToast } from '@/ui';

/** Para crear una videollamada nueva cuando la sesión no tiene enlace. */
const NEW_MEET_URL = 'https://meet.google.com/new';

/**
 * SesionActiva: al entrar se marca que estoy (la primera entrada la pone en vivo). La
 * videollamada se abre en Google Meet, fuera de la app (doc 04 · decisión 5).
 */
export default function ActiveSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = es.sessions.active;
  const toast = useToast();
  const queryClient = useQueryClient();
  const query = useSessionsControllerGet(id);
  const me = useMeControllerMe();
  const join = useSessionsControllerJoin();
  const session = query.data?.status === 200 ? query.data.data : undefined;
  const myInitial = me.data?.status === 200 ? me.data.data.displayName.charAt(0) : '';
  const { mutate } = join;

  useEffect(() => {
    mutate(
      { id },
      {
        onSuccess: () => void invalidateSessions(queryClient),
        onError: (error) => {
          toast(apiErrorCode(error) === 'NOT_STARTED' ? t.notYet : es.sessions.errors.changed, {
            kind: 'err',
          });
          router.back();
        },
      },
    );
  }, [id, mutate, queryClient, toast, t.notYet]);

  const name = session?.person?.name ?? '';
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/sesiones'));

  return (
    <AuthLayout top={<BackLink label={es.sessions.back} onPress={leave} />}>
      <View
        style={styles.people}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.self}>
          <Text variant="avatarLarge">{myInitial.toLocaleUpperCase('es')}</Text>
        </View>
        {session?.person && (
          <PersonToken
            name={name}
            initials={session.person.initials}
            color={session.person.color}
            size="lg"
            decorative
          />
        )}
      </View>
      {session && (
        <View style={styles.texts}>
          <View style={styles.live}>
            <View style={styles.dot} />
            <Text variant="caption" color={colors.status.liveText}>
              {t.caption}
            </Text>
          </View>
          <EmphasisText
            text={{ lead: '', em: session.taskTitle }}
            variant="hero"
            accessibilityRole="header"
          />
          <Text variant="lead" color={colors.text.secondary}>
            {session.role === 'companion' ? t.fromOwner(name) : t.with(name)}
          </Text>
          <Text variant="body" color={colors.text.secondary}>
            {session.otherJoined ? t.otherHere(name) : t.otherNotYet(name)}
          </Text>
          <Text variant="body" color={colors.text.secondary}>
            {session.meetUrl ? t.note : t.noLink}
          </Text>
        </View>
      )}
      <View style={styles.spacer} />
      <View style={styles.cta}>
        <Button
          label={session?.meetUrl ? t.openMeet : t.newMeet}
          onPress={() => void Linking.openURL(session?.meetUrl ?? NEW_MEET_URL)}
          disabled={!session}
        />
        <Button label={t.back} variant="secondary" onPress={leave} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  people: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.xxl },
  self: {
    width: sizes.avatar.lg,
    height: sizes.avatar.lg,
    borderRadius: radii.round,
    backgroundColor: selfColor.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  live: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: {
    width: sizes.notice.liveDot,
    height: sizes.notice.liveDot,
    borderRadius: radii.round,
    backgroundColor: colors.status.live,
  },
  spacer: { flex: 1 },
  cta: { gap: spacing.sm },
});
