import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  getContactsControllerListQueryKey,
  getTasksControllerAccompanyingQueryKey,
  useInvitationsControllerAccept,
  useInvitationsControllerPreview,
} from '@tandems/api-client';
import { authClient } from '@/lib/auth';
import { prefs } from '@/lib/prefs';
import { es } from '@/strings/es';
import { colors, spacing } from '@/theme';
import { AuthLayout, Button, EmphasisText, EmptyStateCard, Text, useToast } from '@/ui';
import { Logo } from '@/ui/art/Logo';

/** InvitacionApp: «Marta te invita a su red de apoyo». Destino de tandems://invitacion?token=… */
export default function InvitationScreen() {
  const { token = '' } = useLocalSearchParams<{ token?: string }>();
  const t = es.invitation;
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const preview = useInvitationsControllerPreview(token, {
    query: { enabled: !!token, retry: false },
  });
  const accept = useInvitationsControllerAccept();
  const inviter = preview.data?.status === 200 ? preview.data.data.inviterName : null;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (preview.isError || (!token && !preview.isLoading)) {
    return (
      <AuthLayout>
        <View style={styles.logo}>
          <Logo />
        </View>
        <EmptyStateCard
          icon="mail"
          title={t.invalidTitle}
          body={t.invalidBody}
          actions={<Button label={t.goHome} onPress={() => router.replace('/')} />}
        />
      </AuthLayout>
    );
  }

  const goAuth = (to: '/registro' | '/login') => {
    void prefs.setPendingInvite(token);
    router.replace(to);
  };

  const doAccept = () =>
    accept.mutate(
      { token },
      {
        onSuccess: (res) => {
          if (res.status !== 200) return;
          void queryClient.invalidateQueries({ queryKey: getContactsControllerListQueryKey() });
          void queryClient.invalidateQueries({
            queryKey: getTasksControllerAccompanyingQueryKey(),
          });
          toast(t.accepted(res.data.name), { kind: 'ok' });
          router.replace({ pathname: '/contactos/[id]', params: { id: res.data.id } });
        },
        onError: () => {
          toast(t.invalidBody, { kind: 'err' });
          leave();
        },
      },
    );

  return (
    <AuthLayout>
      <View style={styles.logo}>
        <Logo />
      </View>
      {inviter && (
        <View style={styles.texts}>
          <Text variant="caption" color={colors.text.caption}>
            {t.caption}
          </Text>
          <EmphasisText text={t.title(inviter)} variant="hero" accessibilityRole="header" />
          <Text variant="lead" color={colors.text.caption}>
            {t.body}
          </Text>
          <Text variant="label" color={colors.text.secondary}>
            {t.invitedAs}
          </Text>
        </View>
      )}
      <View style={styles.spacer} />
      {session ? (
        <Button
          label={t.accept}
          onPress={doAccept}
          disabled={!inviter || accept.isPending}
          accessibilityState={{ busy: accept.isPending }}
        />
      ) : (
        <View style={styles.cta}>
          <Button
            label={t.createAndAccept}
            onPress={() => goAuth('/registro')}
            disabled={!inviter}
          />
          <Button
            label={t.haveAccount}
            variant="secondary"
            onPress={() => goAuth('/login')}
            disabled={!inviter}
          />
        </View>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  logo: { paddingTop: spacing.xxl * 2 },
  texts: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  spacer: { flex: 1 },
  cta: { gap: spacing.sm },
});
